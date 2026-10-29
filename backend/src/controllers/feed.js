const prisma=require("../config/prisma.js");
const {askAI,translatePost} = require("../services/aiService.js");
const moderatePost=require("../services/moderationService.js");
const {cloudinary}=require("../config/cloudinary.js");
const renderSafeMarkdown = require("../utils/renderSafeMarkdown");
const publicUser = require("../utils/publicUser");
const calculatePostingStreak = require("../utils/postingStreak.js");
const ExpressError=require("../utils/ExpressError.js");
const {hasPostedOnUtcDate}=calculatePostingStreak;
const translatedPosts=new Map();
const maxCachedTranslations=500;

module.exports.index=(req, res)=>{
    res.json({user:publicUser(req.user)});
}

module.exports.showCategoryFeed=async(req,res)=>{
    const category=req.params.category;
    const feeds=await prisma.feed.findMany({
        where:{category},
        include:{
            likedBy:{select:{userId:true}},
            owner:{select:{id:true,username:true}},
        },
        orderBy:{createdAt:"desc"},
    });
    if(feeds.length===0){
        return res.status(404).json({error:"No posts are available in this category yet."});
    }

    const dayNumber=Math.floor(Date.now()/(1000*60*60*24));
    const startOfUtcToday=new Date();
    startOfUtcToday.setUTCHours(0,0,0,0);
    const postsCreatedToday=feeds.filter(feed=>new Date(feed.createdAt)>=startOfUtcToday);
    const selectedFeed=postsCreatedToday.length>0
        ?postsCreatedToday[dayNumber%postsCreatedToday.length]
        :feeds[dayNumber%feeds.length];
        const markedAsFeatured=await prisma.$executeRaw`
                UPDATE "Feed"
                SET "lastFeaturedAt"=${startOfUtcToday}
                WHERE "id"=${selectedFeed.id}
                    AND ("lastFeaturedAt" IS NULL OR "lastFeaturedAt" < ${startOfUtcToday})
        `;
        if(markedAsFeatured>0) selectedFeed.lastFeaturedAt=startOfUtcToday;
    const [reviews,isLiked]=await Promise.all([
        prisma.review.findMany({
            where:{feedId:selectedFeed.id},
            include:{author:{select:{id:true,username:true}}},
            orderBy:{createdAt:"asc"},
        }),
        req.user
            ?prisma.feedLike.findUnique({where:{userId_feedId:{userId:req.user.id,feedId:selectedFeed.id}}})
            :null,
    ]);
    const {likedBy,...feed}=selectedFeed;
    const isOwnPostCreatedToday=Boolean(req.user&&selectedFeed.ownerId===req.user.id&&new Date(selectedFeed.createdAt)>=startOfUtcToday);
    feed.isOwnDailyPost=isOwnPostCreatedToday;
    res.json({feed:{...feed,reviews},isLiked:Boolean(isLiked)});
}

module.exports.createFeed=async (req,res)=>{
    const data={
        title:req.body.feed.title,
        description:req.body.feed.description,
        category:req.body.feed.category,
        info:req.body.feed.info,
        ownerId:req.user.id,
    };
    const userBeforeModeration=await prisma.user.findUnique({
        where:{id:req.user.id},
        select:{lastPostDate:true},
    });
    if(!userBeforeModeration) throw new ExpressError(401,"Your account could not be verified.");
    if(hasPostedOnUtcDate(userBeforeModeration.lastPostDate)){
        throw new ExpressError(409,"You have already posted today. Come back tomorrow to post again.");
    }

    const imageMimeType=req.file?getImageMimeType(req.file.buffer):null;
    if(req.file&&!imageMimeType){
        throw new ExpressError(400,"The uploaded image is not a valid PNG or JPEG.");
    }

    let moderation;
    try{
        moderation=await moderatePost({
            ...data,
            imageBuffer:req.file?.buffer,
            imageMimeType,
        });
    }catch(error){
        console.error("Post moderation failed:",error.message);
        throw new ExpressError(503,"Post safety checks are temporarily unavailable. Please try again later.");
    }
    if(moderation.decision!=="allow"){
        const fieldsToFix=[...new Set(moderation.fieldsToFix)];
        if(fieldsToFix.length===0) fieldsToFix.push("post");
        return res.status(422).json({
            code:"POST_MODERATION",
            reasonCode:moderation.reasonCode,
            fieldsToFix,
        });
    }

    let uploadedImage;
    try{
        if(req.file){
            uploadedImage=await cloudinary.uploader.upload(
                `data:${imageMimeType};base64,${req.file.buffer.toString("base64")}`,
                {folder:"TeaTime",resource_type:"image",allowed_formats:["png","jpg","jpeg"]}
            );
            data.image={url:uploadedImage.secure_url,filename:uploadedImage.public_id};
        }
        const feed=await prisma.$transaction(async(tx)=>{
            await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${req.user.id} FOR UPDATE`;
            const user=await tx.user.findUnique({
                where:{id:req.user.id},
                select:{currentPostStreak:true,highestPostStreak:true,lastPostDate:true},
            });
            if(!user) throw new Error("Posting user could not be found.");
            const postedAt=new Date();
            if(hasPostedOnUtcDate(user.lastPostDate,postedAt)){
                throw new ExpressError(409,"You have already posted today. Come back tomorrow to post again.");
            }
            const createdFeed=await tx.feed.create({data});
            await tx.user.update({
                where:{id:req.user.id},
                data:calculatePostingStreak(user,postedAt),
            });
            return createdFeed;
        });
        res.status(201).json({feed,message:"Post created successfully."});
    }catch(error){
        if(uploadedImage?.public_id){
            await cloudinary.uploader.destroy(uploadedImage.public_id).catch(cleanupError=>{
                console.error("Unable to remove unlinked moderation-approved image:",cleanupError.message);
            });
        }
        throw error;
    }
}

function getImageMimeType(buffer){
    if(!Buffer.isBuffer(buffer)) return null;
    if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return "image/png";
    if(buffer[0]===255&&buffer[1]===216&&buffer[2]===255) return "image/jpeg";
    return null;
}

module.exports.showFeed=async(req,res)=>{
    let {id}=req.params;
    const feed=await prisma.feed.findUnique({
        where:{id},
        include:{
            owner:{select:{id:true,username:true}},
            reviews:{include:{author:{select:{id:true,username:true}}},orderBy:{createdAt:"asc"}},
            likedBy:{select:{userId:true}},
        }
    });
    if(!feed){
        return res.status(404).json({error:"Post not found."});
    }
    const isLiked=Boolean(req.user&&feed.likedBy.some(like=>like.userId===req.user.id));
    res.json({feed,isLiked});
}

module.exports.destroyFeed=async (req,res)=>{
    let {id}=req.params;
    await prisma.feed.delete({where:{id}});
    res.json({message:"Post deleted successfully."});
}

module.exports.likeFeed=async(req,res)=>{
    const feedId=req.params.id;
    await prisma.$transaction(async(tx)=>{
        const existing=await tx.feedLike.findUnique({
            where:{userId_feedId:{userId:req.user.id,feedId}}
        });
        if(existing){
            await tx.feedLike.delete({where:{userId_feedId:{userId:req.user.id,feedId}}});
            await tx.feed.update({where:{id:feedId},data:{likes:{decrement:1}}});
        }else{
            await tx.feedLike.create({data:{userId:req.user.id,feedId}});
            await tx.feed.update({where:{id:feedId},data:{likes:{increment:1}}});
        }
    });
    const [feed,isLiked]=await Promise.all([
        prisma.feed.findUnique({where:{id:feedId},select:{likes:true}}),
        prisma.feedLike.findUnique({where:{userId_feedId:{userId:req.user.id,feedId}}}),
    ]);
    res.json({likes:feed?.likes??0,isLiked:Boolean(isLiked)});
}

module.exports.askAI=async(req,res)=>{
    try {
        const feed=await prisma.feed.findUnique({where:{id:req.params.id}});
        if(!feed){
            return res.status(404).json({error:"Post not found."});
        }
        const question=req.body.question;
        const preferredLanguage=req.body.preferredLanguage||req.user?.preferredLanguage||"en";
        const answer=await askAI(
            feed.title,
            feed.category,
            feed.description,
            question,
            preferredLanguage
        );
        const answerHtml=renderSafeMarkdown(answer);
        res.json({success: true,answerHtml});
    } catch(err){
        console.error("TeaTime AI request failed:",err);
        const answerHtml=renderSafeMarkdown("The AI assistant could not answer right now. Please try again.");
        res.status(500).json({
            success: false,
            answerHtml
        });
    }
}

module.exports.translateFeed=async(req,res)=>{
    const feed=await prisma.feed.findUnique({where:{id:req.params.id}});
    if(!feed){
        return res.status(404).json({error:"Post not found."});
    }
    const language=req.body.language;
    const cacheKey=`${feed.id}:${language}`;
    const cached=translatedPosts.get(cacheKey);
    if(cached){
        return res.json({translation:cached});
    }
    try{
        const translation=await translatePost(feed.title,feed.description,feed.info,language);
        if(translatedPosts.size>=maxCachedTranslations){
            translatedPosts.delete(translatedPosts.keys().next().value);
        }
        translatedPosts.set(cacheKey,translation);
        res.json({translation});
    }catch(error){
        console.error("Post translation failed:",error.message);
        res.status(503).json({error:"Post translation is temporarily unavailable."});
    }
}
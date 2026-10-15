const prisma=require("../config/prisma.js");
const askAI = require("../services/aiService.js");
const renderSafeMarkdown = require("../utils/renderSafeMarkdown");
const publicUser = require("../utils/publicUser");

module.exports.index=(req, res)=>{
    res.json({user:publicUser(req.user)});
}

module.exports.createFeed=async (req,res)=>{
    const data={
        title:req.body.feed.title,
        description:req.body.feed.description,
        category:req.body.feed.category,
        info:req.body.feed.info,
        ownerId:req.user.id,
    };
    if(req.file!==undefined){
        data.image={url:req.file.path,filename:req.file.filename};
    }
    const feed=await prisma.feed.create({data});
    res.status(201).json({feed,message:"Post created successfully."});
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

module.exports.updateFeed=async (req, res)=>{
    let {id}=req.params;
    const data={
        title:req.body.feed.title,
        description:req.body.feed.description,
        category:req.body.feed.category,
        info:req.body.feed.info,
    };
    if(typeof(req.file)!=="undefined"){
        data.image={url:req.file.path,filename:req.file.filename};
    }
    const feed=await prisma.feed.update({where:{id},data});
    res.json({feed,message:"Post updated successfully."});
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
        const answer=await askAI(
            feed.title,
            feed.category,
            feed.description,
            question
        );
        const answerHtml=renderSafeMarkdown(answer);
        res.json({success: true,answerHtml});
    } catch(err){
        console.log(err);
        const answerHtml=renderSafeMarkdown("The AI assistant could not answer right now. Please try again.");
        res.status(500).json({
            success: false,
            answerHtml
        });
    }
}
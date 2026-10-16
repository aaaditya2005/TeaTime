const prisma=require("../config/prisma.js");
const { cloudinary } = require("../config/cloudinary.js");
const { hashPassword }=require("../utils/password.js");
const publicUser=require("../utils/publicUser.js");

module.exports.signup=async(req, res,next)=>{
    try{
        let {username,email,password}=req.body;
        email=String(email||"").trim().toLowerCase();
        if(!email){
            return res.status(400).json({error:"Email is required."});
        }
        const existingEmail=await prisma.user.findFirst({
            where:{email:{equals:email,mode:"insensitive"}},
            select:{id:true},
        });
        if(existingEmail){
            return res.status(409).json({error:"An account with this email already exists."});
        }
        if(typeof(req.file)!=="undefined"){
            req.body.profileImage={url:req.file.path,filename:req.file.filename};
        }
        const passwordFields=await hashPassword(password);
        const data={
            email,
            username,
            passwordHash:passwordFields.hash,
            passwordSalt:passwordFields.salt,
            ...(req.body.profileImage?{profileImage:req.body.profileImage}:{})
        };
        const registeredUser=await prisma.user.create({data});
        req.login(registeredUser,(err)=>{
            if(err){
                return next(err);
            }
            return res.status(201).json({user:publicUser(registeredUser),message:"Welcome to It's TeaTime."});
        })
    }catch(e){
        if(e.code==="P2002"){
            return res.status(409).json({error:"That email or username is already in use."});
        }
        return res.status(400).json({error:e.message});
    }
}

module.exports.login=async(req,res,next)=>{
    const user=req.user;
    const today=new Date();
    today.setHours(0,0,0,0);

    if(user.lastLoginDate){
        const lastLogin=new Date(user.lastLoginDate);
        lastLogin.setHours(0,0,0,0);
        const diffDays=Math.floor(
            (today-lastLogin)/(1000*60*60*24)
        );
        if(diffDays===1){
            user.currentStreak+=1;
        }
        else if(diffDays>1){
            user.currentStreak=1;
        }
    }
    else{
        user.currentStreak=1;
    }
    user.highestStreak=Math.max(
        user.highestStreak,
        user.currentStreak
    );
    user.lastLoginDate=today;
    const updatedUser=await prisma.user.update({
        where:{id:user.id},
        data:{currentStreak:user.currentStreak,highestStreak:user.highestStreak,lastLoginDate:today}
    });
    req.user=updatedUser;
    res.json({user:publicUser(updatedUser),message:"Welcome back to It's TeaTime."});
}

module.exports.profile=async(req,res)=>{
    const [createdPosts,likedPosts,likesReceived]=await Promise.all([
        prisma.feed.findMany({where:{ownerId:req.user.id}}),
        prisma.feed.findMany({where:{likedBy:{some:{userId:req.user.id}}}}),
        prisma.feedLike.count({where:{feed:{ownerId:req.user.id}}})
    ]);
    res.json({
        user:publicUser(req.user),
        createdPosts,
        likedPosts,
        totalLikesReceived:likesReceived
    });
}

module.exports.userUpdate=async(req,res,next)=>{
    const username=String(req.body.username||"").trim();
    if(!username){
        return res.status(400).json({error:"Username is required."});
    }
    const data={username};
    try{
        if(req.file){
            const oldImage=req.user.profileImage;
            if(oldImage&&oldImage.filename&&oldImage.filename!=="default-profile"){
                await cloudinary.uploader.destroy(oldImage.filename);
            }
            data.profileImage={
                url:req.file.path,
                filename:req.file.filename,
            };
        }
        const user=await prisma.user.update({where:{id:req.user.id},data});
        req.login(user,(err)=>{
            if(err){
                return next(err);
            }
            return res.json({user:publicUser(user),message:"Profile updated successfully."});
        });
    }catch(error){
        if(error.code==="P2002"){
            return res.status(409).json({error:"That username is already in use."});
        }
        return next(error);
    }
}

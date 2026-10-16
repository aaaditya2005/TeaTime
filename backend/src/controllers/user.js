const prisma=require("../config/prisma.js");
const { cloudinary } = require("../config/cloudinary.js");
const { hashPassword }=require("../utils/password.js");
const publicUser=require("../utils/publicUser.js");

module.exports.signup=async(req, res,next)=>{
    try{
        let {username,email,password}=req.body;
        username=String(username||"").trim();
        if(!username){
            return res.status(400).json({error:"Username is required."});
        }
        if(username.length<6){
            return res.status(400).json({error:"Username must be at least 6 characters long."});
        }
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

module.exports.usernameAvailability=async(req,res)=>{
    const username=String(req.query.username||"").trim();
    if(!username){
        return res.json({available:false});
    }
    if(username.length<6){
        return res.status(400).json({error:"Username must be at least 6 characters long."});
    }
    const existingUser=await prisma.user.findUnique({
        where:{username},
        select:{id:true},
    });
    res.set("Cache-Control","no-store");
    res.json({available:!existingUser});
}

module.exports.login=async(req,res,next)=>{
    res.json({user:publicUser(req.user),message:"Welcome back to It's TeaTime."});
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
    if(username.length<6){
        return res.status(400).json({error:"Username must be at least 6 characters long."});
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

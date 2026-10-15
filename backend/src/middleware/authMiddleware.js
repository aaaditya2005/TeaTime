const ExpressError=require("../utils/ExpressError.js");
const prisma=require("../config/prisma.js");
const {feedSchema,reviewSchema}=require("../validation/schemas.js");

module.exports.isLoggedIn=(req,res,next)=>{
    if(!req.isAuthenticated()){
        return res.status(401).json({error:"You must be logged in to perform this action."});
    }
    next();
}

module.exports.normalizeFeedBody=(req,res,next)=>{
    const body=req.body.feed||req.body;
    req.body={...req.body,feed:{
        title:body.title??req.body["feed[title]"],
        description:body.description??req.body["feed[description]"],
        category:body.category??req.body["feed[category]"],
        info:body.info??req.body["feed[info]"],
    }};
    next();
}

module.exports.isOwner=async (req,res,next)=>{
    let {id}=req.params;
    let feed=await prisma.feed.findUnique({where:{id}});
    if(!feed){
        return res.status(404).json({error:"Post not found."});
    }
    if(feed.ownerId!==req.user.id){
        return res.status(403).json({error:"You don't have access to perform this action."});
    }
    next();
}

module.exports.validateFeed=(req, res, next)=>{
    let {error}=feedSchema.validate(req.body);
    if(error){
        return next(new ExpressError(400,error.details.map(detail=>detail.message).join(" ")));
    }else{
        next();
    }
}

module.exports.validateReview=(req, res, next)=>{
    let {error}=reviewSchema.validate(req.body);
    if(error){
        return next(new ExpressError(400,error.details.map(detail=>detail.message).join(" ")));
    }else{
        next();
    }
}

module.exports.isReviewAuthor=async (req,res,next)=>{
    let {id,reviewId}=req.params; 
    let review=await prisma.review.findUnique({where:{id:reviewId}});
    if(!review){
        return res.status(404).json({error:"Comment not found."});
    }
    if(review.authorId!==req.user.id){
        return res.status(403).json({error:"You don't have access to perform this action."});
    }
    next();   
}

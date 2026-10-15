const prisma=require("../config/prisma.js");

module.exports.createReview=async(req, res)=>{
    let {id}=req.params;
    await prisma.review.create({
        data:{comment:req.body.review.comment,feedId:id,authorId:req.user.id}
    });
    res.status(201).json({message:"Comment added."});
}

module.exports.destroyReview=async(req, res)=>{
   let {id,reviewId}=req.params;
    await prisma.review.delete({where:{id:reviewId}});
    res.json({message:"Comment deleted."});
}
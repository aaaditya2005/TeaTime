const prisma=require("../config/prisma.js");

module.exports.createReview=async(req, res)=>{
    let {id}=req.params;
    const review=await prisma.review.create({
        data:{comment:req.body.review.comment,feedId:id,authorId:req.user.id},
        include:{author:{select:{id:true,username:true}}},
    });
    res.status(201).json({review,message:"Comment added."});
}

module.exports.destroyReview=async(req, res)=>{
   let {id,reviewId}=req.params;
    await prisma.review.delete({where:{id:reviewId}});
    res.json({message:"Comment deleted."});
}
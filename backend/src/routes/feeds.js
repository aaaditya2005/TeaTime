const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const prisma=require("../config/prisma.js");

//today route
router.get("/:category", wrapAsync(async (req, res) => {
    const category = req.params.category;

    const feeds = await prisma.feed.findMany({where:{category},include:{likedBy:{select:{userId:true}}}});
    if (feeds.length === 0) {
        return res.status(404).json({error:"No posts are available in this category yet."});
    }

    const today = new Date();

    const dayNumber = Math.floor(
        today.getTime() / (1000 * 60 * 60 * 24)
    );

    const feed = feeds[dayNumber % feeds.length];
    let isLiked = false;

    if(req.user){
        isLiked=feed.likedBy.some(like=>like.userId===req.user.id);
    }

    res.json({feed,isLiked});
}));

module.exports=router;


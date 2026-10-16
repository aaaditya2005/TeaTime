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

    const selectedFeed=feeds[dayNumber % feeds.length];
    const [reviews,isLiked]=await Promise.all([
        prisma.review.findMany({
            where:{feedId:selectedFeed.id},
            include:{author:{select:{id:true,username:true}}},
            orderBy:{createdAt:"asc"},
        }),
        req.user
            ? prisma.feedLike.findUnique({where:{userId_feedId:{userId:req.user.id,feedId:selectedFeed.id}}})
            : null,
    ]);
    const {likedBy,...feed}=selectedFeed;

    res.json({feed:{...feed,reviews},isLiked:Boolean(isLiked)});
}));

module.exports=router;


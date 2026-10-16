const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const {isLoggedIn,isOwner,validateFeed,normalizeFeedBody}=require("../middleware/authMiddleware.js");
const feedController=require("../controllers/feed.js");
const multer=require("multer");
const {storage}=require("../config/cloudinary.js")
const upload=multer({storage});
 


router
    .route("/feed")
    .get(feedController.index)
    .post(isLoggedIn,upload.single("image"),normalizeFeedBody,validateFeed,wrapAsync(feedController.createFeed))

router.get("/feeds/:category",wrapAsync(feedController.showCategoryFeed));

//show route
router
    .route("/feed/:id")
    .get(wrapAsync(feedController.showFeed))
    .delete(isLoggedIn,isOwner,wrapAsync(feedController.destroyFeed))

router.post("/feed/:id/like",isLoggedIn,wrapAsync(feedController.likeFeed));

router.post("/feed/:id/ask-ai",wrapAsync(feedController.askAI));
module.exports=router;



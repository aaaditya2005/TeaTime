const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");
const {isLoggedIn,isOwner,validateFeed,normalizeFeedBody}=require("../middleware/authMiddleware.js");
const feedController=require("../controllers/feed.js");
const multer=require("multer");
const {storage}=require("../config/cloudinary.js")
const upload=multer({storage});
 


router
    .route("/")
    .get(feedController.index)
    .post(isLoggedIn,upload.single("image"),normalizeFeedBody,validateFeed,wrapAsync(feedController.createFeed))


//show route
router
    .route("/:id")
    .get(wrapAsync(feedController.showFeed))
    .put(isLoggedIn,isOwner,upload.single("image"),normalizeFeedBody,validateFeed,wrapAsync(feedController.updateFeed))
    .delete(isLoggedIn,isOwner,wrapAsync(feedController.destroyFeed))

router.post("/:id/like",isLoggedIn,wrapAsync(feedController.likeFeed));

router.post("/:id/ask-ai",wrapAsync(feedController.askAI));
module.exports=router;



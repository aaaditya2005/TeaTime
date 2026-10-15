const express=require("express");
const router=express.Router({mergeParams: true });
const wrapAsync=require("../utils/wrapAsync.js");
const {validateReview,isLoggedIn,isReviewAuthor}=require("../middleware/authMiddleware.js");
const reviewController=require("../controllers/review.js");




//Reviews crete route
router.post("/",isLoggedIn,validateReview,wrapAsync(reviewController.createReview))

//review destroy route
router.delete("/:reviewId",isLoggedIn,isReviewAuthor,wrapAsync(reviewController.destroyReview))

module.exports=router;
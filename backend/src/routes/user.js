const express=require("express");
const router=express.Router({mergeParams: true });
const passport=require("passport");
const {isLoggedIn}=require("../middleware/authMiddleware.js");
const userController=require("../controllers/user.js");
const publicUser=require("../utils/publicUser.js");
const multer=require("multer");
const {storage}=require("../config/cloudinary.js")
const upload=multer({storage});

const isSelf=(req,res,next)=>{
    if(req.params.id!==req.user.id){
        return res.status(403).json({error:"You can only update your own profile."});
    }
    next();
};

router.post("/signup",upload.single("profileImage"),userController.signup);

router.post("/login",(req,res,next)=>{
    passport.authenticate("local",(error,user,info)=>{
        if(error) return next(error);
        if(!user) return res.status(401).json({error:info?.message||"Incorrect username or password."});
        req.logIn(user,loginError=>{
            if(loginError) return next(loginError);
            Promise.resolve(userController.login(req,res,next)).catch(next);
        });
    })(req,res,next);
});

router.get("/profile",isLoggedIn,userController.profile);

router.get("/profile/edit",isLoggedIn,(req,res)=>res.json({user:publicUser(req.user)}));

router.put("/:id",isLoggedIn,isSelf,upload.single("profileImage"),userController.userUpdate);

router.post("/logout",isLoggedIn,(req,res,next)=>{
    req.logout(error=>{
        if(error) return next(error);
        res.json({message:"Logged out successfully."});
    });
});

module.exports=router;
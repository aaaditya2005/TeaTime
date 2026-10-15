const path=require("path");
require("dotenv").config({path:path.resolve(__dirname,"../.env")});

const express=require("express");
const session=require("express-session");
const PgSession=require("connect-pg-simple")(session);
const {Pool}=require("pg");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const prisma=require("./config/prisma.js");
const {verifyPassword}=require("./utils/password.js");
const publicUser=require("./utils/publicUser.js");
const feedRouter=require("./routes/feed.js");
const feedsRouter=require("./routes/feeds.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");
const newsRouter=require("./routes/news.js");

const app=express();
const port=process.env.PORT||8080;
const frontendDist=path.resolve(__dirname,"../../frontend/dist");
const pool=new Pool({
    connectionString:process.env.SESSION_DATABASE_URL||process.env.DIRECT_URL||process.env.DATABASE_URL,
});
const store=new PgSession({pool,createTableIfMissing:true});
store.on("error",err=>console.error("PostgreSQL session store error",err));

app.set("trust proxy",1);
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(session({
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:false,
    cookie:{
        maxAge:3*24*60*60*1000,
        httpOnly:true,
        sameSite:"lax",
        secure:process.env.NODE_ENV==="production",
    },
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async(username,password,done)=>{
    try{
        const user=await prisma.user.findUnique({where:{username}});
        if(!user||!(await verifyPassword(password,user.passwordHash,user.passwordSalt))){
            return done(null,false,{message:"Incorrect username or password."});
        }
        return done(null,user);
    }catch(error){
        return done(error);
    }
}));
passport.serializeUser((user,done)=>done(null,user.id));
passport.deserializeUser(async(id,done)=>{
    try{
        done(null,await prisma.user.findUnique({where:{id}})||false);
    }catch(error){
        done(error);
    }
});

app.get("/api/session",(req,res)=>res.json({user:publicUser(req.user)}));
app.use("/api/feed/:id/reviews",reviewRouter);
app.use("/api/feed",feedRouter);
app.use("/api/feeds",feedsRouter);
app.use("/api/news",newsRouter);
app.use("/api/user",userRouter);
app.use("/api",(req,res)=>res.status(404).json({error:"API route not found."}));

app.use(express.static(frontendDist));
app.get(/.*/,(req,res,next)=>{
    res.sendFile(path.join(frontendDist,"index.html"),error=>{
        if(error) next(error);
    });
});

app.use((error,req,res,next)=>{
    if(res.headersSent) return next(error);
    const status=error.status||error.statusCode||500;
    console.error(error);
    res.status(status).json({error:status>=500?"Something went wrong. Please try again.":error.message});
});

async function start(){
    await prisma.$connect();
    return app.listen(port,()=>console.log(`server is listening to port ${port}.`));
}

if(require.main===module){
    start().catch(error=>{
        console.error("Unable to connect to PostgreSQL",error);
        process.exit(1);
    });
}

module.exports={app,start};
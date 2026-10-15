const path=require("path");
require("dotenv").config({path:path.resolve(__dirname,"../.env")});

const { MongoClient }=require("mongodb");
const prisma=require("../src/config/prisma.js");

function objectId(value){
    return value?String(value):null;
}

async function migrate(){
    const mongoUrl=process.env.MONGODB_URI||process.env.ATLASDB_URL;
    if(!mongoUrl) throw new Error("Set MONGODB_URI to the source MongoDB connection string.");

    const client=new MongoClient(mongoUrl);
    await client.connect();
    const database=client.db(process.env.MONGODB_DATABASE);

    try{
        const [users,feeds,reviews]=await Promise.all([
            database.collection("users").find({}).toArray(),
            database.collection("feeds").find({}).toArray(),
            database.collection("reviews").find({}).toArray(),
        ]);
        const [existingUsers,existingFeeds,existingReviews]=await Promise.all([
            prisma.user.count(),
            prisma.feed.count(),
            prisma.review.count(),
        ]);
        if(existingUsers||existingFeeds||existingReviews){
            throw new Error("The Supabase database must have no users, feeds, or reviews before importing.");
        }
        const userIds=new Map();
        const feedIds=new Map();
        const reviewsById=new Map(reviews.map((review)=>[objectId(review._id),review]));
        let migratedReviews=0;
        let migratedLikes=0;

        await prisma.$transaction(async(tx)=>{
            for(const user of users){
                const created=await tx.user.create({
                    data:{
                        username:user.username,
                        email:user.email,
                        passwordHash:String(user.hash||""),
                        passwordSalt:String(user.salt||""),
                        currentStreak:user.currentStreak||0,
                        highestStreak:user.highestStreak||0,
                        lastLoginDate:user.lastLoginDate||null,
                        preferredCategories:user.preferredCategories||[],
                        profileImage:user.profileImage||undefined,
                        bio:user.bio||null,
                    }
                });
                userIds.set(objectId(user._id),created.id);
            }

            for(const feed of feeds){
                const created=await tx.feed.create({
                    data:{
                        title:feed.title,
                        description:feed.description,
                        image:feed.image||undefined,
                        category:feed.category,
                        likes:feed.likes||0,
                        info:feed.info,
                        ownerId:userIds.get(objectId(feed.owner))||null,
                    }
                });
                feedIds.set(objectId(feed._id),created.id);
            }

            for(const feed of feeds){
                const feedId=feedIds.get(objectId(feed._id));
                for(const reviewReference of feed.reviews||[]){
                    const review=reviewsById.get(objectId(reviewReference));
                    if(!review) continue;
                    await tx.review.create({
                        data:{
                            comment:review.comment||"",
                            createdAt:review.createdAt||new Date(),
                            feedId,
                            authorId:userIds.get(objectId(review.author))||null,
                        }
                    });
                    migratedReviews++;
                }
                const likes=(feed.likedBy||[])
                    .map((userId)=>userIds.get(objectId(userId)))
                    .filter(Boolean);
                if(likes.length){
                    await tx.feedLike.createMany({
                        data:likes.map((userId)=>({userId,feedId})),
                        skipDuplicates:true,
                    });
                    migratedLikes+=likes.length;
                }
            }
        },{maxWait:10000,timeout:120000});

        console.log(`Migrated ${users.length} users, ${feeds.length} feeds, ${migratedReviews} reviews, and ${migratedLikes} likes.`);
    }finally{
        await client.close();
    }
}

migrate().catch((err)=>{
    console.error("MongoDB migration failed",err);
    process.exitCode=1;
}).finally(async()=>{
    await prisma.$disconnect();
});
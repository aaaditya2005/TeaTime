
const path=require("path");
require("dotenv").config({path:path.resolve(__dirname,"../../.env")});

const prisma=require("../../src/config/prisma.js");
const initdata=require("./data.js");

async function seed(){
    await prisma.feed.deleteMany();
    for(const feed of initdata.data){
        await prisma.feed.create({
            data:{
                title:feed.title,
                description:feed.description,
                image:feed.image,
                category:feed.category,
                likes:feed.likes||0,
                info:feed.info,
            }
        });
    }
    console.log(`Seeded ${initdata.data.length} feeds.`);
}

seed().catch((err)=>{
    console.error("Unable to seed feeds",err);
    process.exitCode=1;
}).finally(async()=>{
    await prisma.$disconnect();
});

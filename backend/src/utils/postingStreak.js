const millisecondsPerDay=24*60*60*1000;

function startOfUtcDay(value){
    const day=new Date(value);
    day.setUTCHours(0,0,0,0);
    return day;
}

function hasPostedOnUtcDate(lastPostDate,postedAt=new Date()){
    if(!lastPostDate) return false;
    return startOfUtcDay(lastPostDate).getTime()===startOfUtcDay(postedAt).getTime();
}

function calculatePostingStreak(user,postedAt=new Date()){
    const today=startOfUtcDay(postedAt);
    let currentPostStreak=1;

    if(user.lastPostDate){
        const previousPostDay=startOfUtcDay(user.lastPostDate);
        const daysSinceLastPost=Math.floor((today-previousPostDay)/millisecondsPerDay);
        if(daysSinceLastPost===0){
            currentPostStreak=user.currentPostStreak;
        }else if(daysSinceLastPost===1){
            currentPostStreak=user.currentPostStreak+1;
        }
    }

    return {
        currentPostStreak,
        highestPostStreak:Math.max(user.highestPostStreak,currentPostStreak),
        lastPostDate:today,
    };
}

module.exports=calculatePostingStreak;
module.exports.hasPostedOnUtcDate=hasPostedOnUtcDate;

const {getCurrentPostingStreak}=require("./postingStreak.js");

module.exports = function publicUser(user) {
    if (!user) return null;
    const {
        id,
        username,
        email,
        preferredLanguage,
        profileImage,
        highestPostStreak,
        lastPostDate,
        bio,
    } = user;
    return {
        id,
        username,
        email,
        preferredLanguage,
        profileImage,
        currentPostStreak:getCurrentPostingStreak(user),
        highestPostStreak,
        lastPostDate,
        bio,
    };
};

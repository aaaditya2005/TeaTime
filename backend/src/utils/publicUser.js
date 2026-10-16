module.exports = function publicUser(user) {
    if (!user) return null;
    const {
        id,
        username,
        email,
        profileImage,
        currentPostStreak,
        highestPostStreak,
        lastPostDate,
        bio,
    } = user;
    return {
        id,
        username,
        email,
        profileImage,
        currentPostStreak,
        highestPostStreak,
        lastPostDate,
        bio,
    };
};

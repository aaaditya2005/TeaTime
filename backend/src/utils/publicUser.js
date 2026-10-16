module.exports = function publicUser(user) {
    if (!user) return null;
    const {
        id,
        username,
        email,
        profileImage,
        currentStreak,
        highestStreak,
        lastLoginDate,
        bio,
    } = user;
    return {
        id,
        username,
        email,
        profileImage,
        currentStreak,
        highestStreak,
        lastLoginDate,
        bio,
    };
};

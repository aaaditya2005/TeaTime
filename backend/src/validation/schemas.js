const joi=require("joi");

module.exports.feedSchema=joi.object({
    feed: joi.object({
        title: joi.string().required(),
        description: joi.string().required(),
        category: joi.string().required(),
        info: joi.string().required(),
        image: joi.string().allow("",null),
    }).required(),
});

module.exports.reviewSchema=joi.object({
    review: joi.object({
        comment: joi.string().required(),
    }).required(),
});
const userData = require("../seed_data/users");
const postData = require("../seed_data/posts");
const imageData = require("../seed_data/post_images");

exports.seed = function (knex) {
    return knex("users")
        .del()
        .then(function () {
            return knex("users").insert(userData);
        })
        .then(() => {
            return knex("posts").del();
        })
        .then(() => {
            return knex("posts").insert(postData);
        })
        .then(() => {
            return knex("post_images").del();
        })
        .then(() => {
            return knex("post_images").insert(imageData);
        });
};

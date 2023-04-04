const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");

//POST endpoint to create new user
exports.createUser = async (req, res) => {
    try {
        //need to add validation

        req.body.id = uuidv4();
        console.log("file", req.file);
        console.log("body", req.body);
        req.body.profileImg = `/images/${req.file.filename}`;
        const result = await knex("users").insert(req.body);
        const newUserUrl = `/users/${result.id}`;
        res.status(200).location(newUserUrl).send(result);
        console.log(result);
    } catch (error) {
        res.status(400).send(`Error creating user: ${error}`); //update error code and response
        console.log(error);
    }
};

//GET endpoint to get user info
exports.getUser = async (req, res) => {
    try {
        const result = await knex("users").where({ username: req.params.username });
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send(`Error getting user: ${error}`); //update error code and response
    }
};

//GET endpoint to get user posts
exports.getPosts = async (req, res) => {
    try {
        const result = await knex("posts")
            .select(
                "posts.id",
                "posts.title",
                "posts.description",
                knex.raw("JSON_ARRAYAGG(post_images.image) as imageUrls")
            )
            .leftJoin("post_images", "posts.id", "post_images.post_id")
            .groupBy("posts.id")
            .where({ user_id: req.params.userId });

        res.status(200).send(result);
        console.log("result: ", result);
    } catch (error) {
        res.status(400).send(`Error getting user posts: ${error}`); //update error code and response
        console.error(error);
    }
};

//POST endpoint to create user post
exports.createPost = async (req, res) => {
    const images = req.files;
    try {
        req.body.id = uuidv4();
        req.body.user_id = req.params.userId;

        console.log(req.files);
        console.log(req.body);
        // console.log(req.params.userId);

        await knex("posts").insert(req.body);

        const imageRecords = images.map((image) => ({
            id: uuidv4(),
            image: `/images/${image.filename}`,
            post_id: req.body.id,
        }));
        await knex("post_images").insert(imageRecords);

        res.status(201).send("records created");
    } catch (error) {
        console.log(error);
    }
};

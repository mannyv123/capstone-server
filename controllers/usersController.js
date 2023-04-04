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
        console.log("req body: ", req.body);
        const result = await knex("posts").where({ user_id: req.params.username });
        res.status(200).send(result);
        console.log("result: ", result);
    } catch (error) {
        res.status(400).send(`Error getting user posts: ${error}`); //update error code and response
        console.error(error);
    }
};

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
        res.status(400).send(`Error creating user: ${error}`);
        console.log(error);
    }
};

const router = require("express").Router();
const postsController = require("../controllers/postsController");

router.route("/").get(postsController.getRecentPosts); //route to get recent posts accross all users

module.exports = router;

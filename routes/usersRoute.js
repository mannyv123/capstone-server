const router = require("express").Router();
const usersController = require("../controllers/usersController");
const multer = require("multer");

//Multer Configuration; must be added in routes before going to controller
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.route("/").post(upload.single("profileImg"), usersController.createUser); //route to create new user with profile image
router.route("/:username").get(usersController.getUser); //route to get user details
router
    .route("/:userId/posts")
    .get(usersController.getPosts) //route to get posts for specific user
    .post(upload.array("images"), usersController.createPost); //route to create new post for specific user
router.route("/:userId/posts/:postId").delete(usersController.deletePost); //route to delete specific post

module.exports = router;

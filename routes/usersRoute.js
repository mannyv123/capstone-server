const router = require("express").Router();
const usersController = require("../controllers/usersController");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");

//Multer configuration; sets where to save images, filename to save images, limits image size
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "public/images/");
    },
    filename: (req, file, callback) => {
        callback(null, `${uuidv4()}.${file.mimetype.split("/")[1]}`);
    },
    limits: { fieldSize: 10 * 1024 * 1024 },
});
const upload = multer({ storage });

router.route("/").post(upload.single("profileImg"), usersController.createUser);
router.route("/:username").get(usersController.getUser);

module.exports = router;

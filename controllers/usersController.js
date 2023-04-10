const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
});

//POST endpoint to create new user
exports.createUser = async (req, res) => {
    try {
        //need to add validation

        //Add profile image to S3 bucket
        const profileImageName = uuidv4();

        const params = {
            Bucket: bucketName,
            Key: profileImageName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        };

        await s3.send(new PutObjectCommand(params));

        //Add user to database
        req.body.id = uuidv4();

        req.body.profileImg = profileImageName;
        const result = await knex("users").insert(req.body);
        const newUserUrl = `/users/${result.id}`;
        res.status(200).location(newUserUrl).send(result);
        console.log("file", req.file);
        console.log("body", req.body);
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

        const getObjectParams = {
            Bucket: bucketName,
            Key: result[0].profileImg,
        };
        const command = new GetObjectCommand(getObjectParams);
        result[0].profileImgUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
        console.log(result);
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
                "posts.user_id",
                knex.raw(
                    "JSON_ARRAYAGG(JSON_OBJECT('image', post_images.image, 'title', post_images.title, 'description', post_images.description, 'latitude', post_images.latitude, 'longitude', post_images.longitude)) as imageInfo"
                )
            )
            .leftJoin("post_images", "posts.id", "post_images.post_id")
            .groupBy("posts.id")
            .where({ user_id: req.params.userId });

        for (const post of result) {
            const imageUrls = [];
            for (const imageInfo of post.imageInfo) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: imageInfo.image,
                };
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 60 });
                imageUrls.push(url);
            }

            post.imageUrls = imageUrls;
        }

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
    req.body.imageInfo = JSON.parse(req.body.imageInfo);
    const postInfo = {
        title: req.body.title,
        description: req.body.description,
        id: uuidv4(),
        user_id: req.params.userId,
    };
    try {
        // req.body.id = uuidv4();
        // req.body.user_id = req.params.userId;

        console.log(req.files);
        console.log("req.body: ", req.body.imageInfo);
        console.log(postInfo);
        // console.log(req.params.userId);

        const filenames = [];

        const promises = images.map((file) => {
            const params = {
                Bucket: bucketName,
                Key: uuidv4(),
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            filenames.push(params.Key);

            return s3.send(new PutObjectCommand(params));
        });

        console.log(promises);

        await Promise.all(promises);
        console.log("filenames: ", filenames);
        await knex("posts").insert(postInfo);

        const imageRecords = filenames.map((filename, index) => ({
            id: uuidv4(),
            image: filename,
            title: req.body.imageInfo[index].imgTitle,
            latitude: req.body.imageInfo[index].imgLat,
            longitude: req.body.imageInfo[index].imgLong,
            post_id: postInfo.id,
        }));
        console.log("image records:", req.body);
        await knex("post_images").insert(imageRecords);

        res.status(201).send("records created");
    } catch (error) {
        console.log(error);
    }
};

//DELETE endpoint to delete user post
exports.deletePost = async (req, res) => {
    try {
        console.log("request body: ", req.body);
        console.log("req.params: ", req.params);

        //first find the post images in the database
        const postImages = await knex("post_images").where({ post_id: req.params.postId });

        console.log("post images to delete: ", postImages);

        //Delete from S3
        const imagesToDelete = postImages.map((image) => ({
            Key: image.image,
        }));

        console.log("images to delete: ", imagesToDelete);

        for (const image of imagesToDelete) {
            const params = {
                Bucket: bucketName,
                Key: image.Key,
            };
            const command = new DeleteObjectCommand(params);
            await s3.send(command);
        }

        const post = await knex("posts").delete().where({ id: req.params.postId });

        res.send({ post });
    } catch (error) {
        console.log(error);
    }
};

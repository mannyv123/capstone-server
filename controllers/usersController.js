const knex = require("knex")(require("../knexfile"));
const { v4: uuidv4 } = require("uuid");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

//AWS S3 details from .env file and Configuration
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
        //validation to be added in future

        //Create unique name for profile image and upload to S3 bucket
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
    } catch (error) {
        res.status(400).send(`Error creating user: ${error}`);
        console.log(error);
    }
};

//GET endpoint to get user info
exports.getUser = async (req, res) => {
    try {
        //validation to be added in future

        //Get user from database
        const result = await knex("users").where({ username: req.params.username });

        //Pull profile image data from S3 and add url to result
        const getObjectParams = {
            Bucket: bucketName,
            Key: result[0].profileImg,
        };
        const command = new GetObjectCommand(getObjectParams);
        result[0].profileImgUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        //Send user info to client
        res.status(200).send(result);
    } catch (error) {
        res.status(404).send(`Error getting user info: ${error}`);
        console.log(error);
    }
};

//GET endpoint to get user posts
exports.getPosts = async (req, res) => {
    try {
        //Join posts and post_images tables and filter for specific user
        const result = await knex("posts")
            .select(
                "posts.id",
                "posts.title",
                "posts.description",
                "posts.user_id",
                knex.raw(
                    "JSON_ARRAYAGG(JSON_OBJECT('image', post_images.image, 'title', post_images.title, 'latitude', post_images.latitude, 'longitude', post_images.longitude)) as imageInfo"
                )
            )
            .leftJoin("post_images", "posts.id", "post_images.post_id")
            .groupBy("posts.id")
            .where({ user_id: req.params.userId });

        //If no posts exist, return response for no posts; proceed if posts exist
        if (result[0] === undefined) {
            return res.send("no posts");
        }

        //Getting image urls from S3 for each post in database result
        for (const post of result) {
            const imageUrls = [];

            //Each post contains imageInfo array, which holds the name of the image to pull from S3; this will create an array of image urls for each post
            for (const imageInfo of post.imageInfo) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: imageInfo.image,
                };
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 300 });
                imageUrls.push(url);
            }
            //Add the array of S3 urls to the post data
            post.imageUrls = imageUrls;
        }

        //Send post data with image urls to client
        res.status(200).send(result);
    } catch (error) {
        res.status(404).send(`Error getting user posts: ${error}`);
        console.error(error);
    }
};

//POST endpoint to create user post
exports.createPost = async (req, res) => {
    const images = req.files; //save files to variable
    req.body.imageInfo = JSON.parse(req.body.imageInfo); //parse image info data

    //create new object for new post
    const postInfo = {
        title: req.body.title,
        description: req.body.description,
        id: uuidv4(),
        user_id: req.params.userId,
    };

    try {
        const filenames = []; //create empty array that will store an array of the filenames for each uploaded image

        //Map over each image; save each s3.send() in new promises array
        const promises = images.map((file) => {
            const params = {
                Bucket: bucketName,
                Key: uuidv4(),
                Body: file.buffer,
                ContentType: file.mimetype,
            };
            filenames.push(params.Key);
            return s3.send(new PutObjectCommand(params)); //return promises that are stored as array in "promises"
        });

        //Promise.all() calls each promise within promises and waits for all to resolve (all images to upload); in this way, the code is able to upload all of the images asynchronously and in parallel, rather than one at a time
        await Promise.all(promises);

        //Save new post details to database
        await knex("posts").insert(postInfo);

        //Create array of image info for each file in filenames
        const imageRecords = filenames.map((filename, index) => {
            const imageRecord = {
                id: uuidv4(),
                image: filename,
                post_id: postInfo.id,
            };

            if (req.body.imageInfo[index] && req.body.imageInfo[index].imgTitle) {
                // Add the title to the image record
                imageRecord.title = req.body.imageInfo[index].imgTitle;
            }

            if (req.body.imageInfo[index] && req.body.imageInfo[index].imgLat) {
                // Add the latitude to the image record
                imageRecord.latitude = req.body.imageInfo[index].imgLat;
            }

            if (req.body.imageInfo[index] && req.body.imageInfo[index].imgLong) {
                // Add the longitude to the image record
                imageRecord.longitude = req.body.imageInfo[index].imgLong;
            }

            return imageRecord;
        });

        //Save array of image records to database
        await knex("post_images").insert(imageRecords);

        //Send successful response
        res.status(201).send("records created");
    } catch (error) {
        res.status(400).send(`Unable to create new post: ${error}`);
        console.log(error);
    }
};

//DELETE endpoint to delete user post
exports.deletePost = async (req, res) => {
    try {
        //First find the post images in the database
        const postImages = await knex("post_images").where({ post_id: req.params.postId });

        //Delete from S3; create array of image names to match in S3 bucket that will be deleted
        const imagesToDelete = postImages.map((image) => ({
            Key: image.image,
        }));
        //For each image name in imagesToDelete array, delete from S3
        for (const image of imagesToDelete) {
            const params = {
                Bucket: bucketName,
                Key: image.Key,
            };
            const command = new DeleteObjectCommand(params);
            await s3.send(command);
        }

        //Delete selected post from posts table; cascades to post_images table
        const post = await knex("posts").delete().where({ id: req.params.postId });

        //Send successful status and the deleted post
        res.status(200).send({ post });
    } catch (error) {
        res.status(400).send(`Unable to delete post: ${error}`);
        console.log(error);
    }
};

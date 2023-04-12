const knex = require("knex")(require("../knexfile"));
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
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

//GET endpoint to get 5 recent posts
exports.getRecentPosts = async (req, res) => {
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
            .orderBy("posts.created_at", "posts.title")
            .limit(5);

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
        res.status(404).send(`Error getting posts: ${error}`);
        console.log(error);
    }
};

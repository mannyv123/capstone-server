const knex = require("knex")(require("../knexfile"));
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
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

exports.getRecentPosts = async (req, res) => {
    try {
        const result = await knex("posts")
            .select(
                "posts.id",
                "posts.title",
                "posts.description",
                "posts.user_id",
                knex.raw("JSON_ARRAYAGG(post_images.image) as imageNames")
            )
            .leftJoin("post_images", "posts.id", "post_images.post_id")
            .groupBy("posts.id")
            .orderBy("posts.created_at", "posts.title")
            .limit(5);

        for (const post of result) {
            const imageUrls = [];
            for (const imageName of post.imageNames) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: imageName,
                };
                const command = new GetObjectCommand(getObjectParams);
                const url = await getSignedUrl(s3, command, { expiresIn: 60 });
                imageUrls.push(url);
            }

            post.imageUrls = imageUrls;
        }
        console.log("landing page result", result);
        res.status(200).send(result);
    } catch (error) {
        res.status(400).send(`Error getting posts: ${error}`); //update error code and response
        console.log(error);
    }
};
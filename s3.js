// // import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
// const { v4: uuidv4 } = require("uuid");
// const { S3Client } = require("@aws-sdk/client-s3");
// const PutObjectCommand = require("@aws-sdk/client-s3");

// const bucketName = process.env.BUCKET_NAME;
// const bucketRegion = process.env.BUCKET_REGION;
// const accessKey = process.env.ACCESS_KEY;
// const secretAccessKey = process.env.SECRET_ACCESS_KEY;

// const s3 = new S3Client({
//     credentials: {
//         accessKeyId: accessKey,
//         secretAccessKey: secretAccessKey,
//     },
//     region: bucketRegion,
// });

// export const uploadToS3 = async ({ file }) => {
//     const key = `${uuidv4()}`;
//     const command = new PutObjectCommand({
//         Bucket: bucketName,
//         Key: key,
//         Body: file.buffer,
//         ContentType: file.mimetype,
//     });

//     try {
//         await s3.send(command);
//         return { key };
//     } catch (error) {
//         console.log(error);
//         return { error };
//     }
// };

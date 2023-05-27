# Collections

Collections is a platform for professional and amateur photographers to showcase their work through albums (called "Collections"). Users can create collections that show under their profile. The platform provides a supportive community for photographers to connect and grow their audience.

## Features

-   Create new user with profile
-   Create new posts called Collections (contain a collection of images)
-   Can add coordinate data to posts to indicate where photographs were taken (markers will be rendered on a map)
-   Can delete posts
-   view fullscreen images from posts

## Video Demo
https://github.com/mannyv123/capstone-server/assets/123426666/f38916f9-46e1-40ba-9a68-3a3cfe458698

## Tech Stack

**Client:** React, SASS, Mapbox GL JS, Axios, React-Router-Dom, React-Icons

**Server:** Node, Express, AWS S3 (AWS SDK: Client-S3 and S3-Request-Presigner), MySQL2, Knex, Multer, Nodemon

## Run Locally

### Server Setup:

Clone the project

```bash
  git clone https://github.com/mannyv123/capstone-server.git
```

Go to the project directory

```bash
  cd capstone-server
```

Install dependencies

```bash
  npm install
```

Setup .env file for server

```bash
  (see .env.sample file)
```

Migrate tables

```bash
  npx knex migrate:latest
```

Seed data

```bash
  npx knex seed:run
```

Start the server

```bash
  npm run dev
```

### Client Setup:

Clone the project

```bash
  git clone https://github.com/mannyv123/capstone-client.git
```

Go to the project directory

```bash
  cd capstone-client
```

Install dependencies

```bash
  npm install
```

Setup .env file for client

```bash
  (see .env.sample file)
```

Start the client

```bash
  npm start
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

### Client

`REACT_APP_API_URL`

### Server

`PORT`

#### DATABASE VARIABLES

`DB_LOCAL_DBNAME`
`DB_LOCAL_USER`
`DB_LOCAL_PASSWORD`

#### AWS S3

`BUCKET_NAME`
`BUCKET_REGION`
`ACCESS_KEY`
`SECRET_ACCESS_KEY`

## Roadmap

-   Following other users

-   Commenting and liking posts

-   Image tagging (using API from Imagga)

-   Search (users, posts, tags)

-   Optimize image storage and loading

## Authors

-   [@mannyv123](https://github.com/mannyv123)

## Feedback

If you have any feedback, please reach out to me at virdi_manjot@hotmail.com

const express = require("express");
const app = express();
const cors = require("cors");

//Configuration
require("dotenv").config();
const PORT = process.env.PORT || 5001;

//Middleware
app.use(express.json());
app.use(cors());
app.use(express.static("public")); //allows access to the public folder, where video images are stored

const usersRoute = require("./routes/usersRoute");

//Routes
app.use("/users", usersRoute);

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});

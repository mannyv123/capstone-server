const express = require("express");
const app = express();

//Configuration
require("dotenv").config();
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});

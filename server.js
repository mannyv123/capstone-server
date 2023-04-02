const express = require("express");
const app = express();

//Configuration
const PORT = 5001;

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});

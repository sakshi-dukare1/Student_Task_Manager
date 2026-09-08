const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("."));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/../index.html");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

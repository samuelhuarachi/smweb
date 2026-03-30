require("dotenv").config();
import express from "express";
import path from "path";

const routes = require("./routes");

const app = express();
const publicPath = path.resolve(__dirname, "../public");
const viewsPath = path.resolve(__dirname, "../views");

app.use(express.json());
app.use(express.urlencoded({
    extended: true,
}));

app.use(express.static(publicPath));
app.set("views", viewsPath);
app.set("view engine", "ejs");

app.use("/", routes);

app.listen(8000, function() {
    console.log("Server is listening on port 8000");
});

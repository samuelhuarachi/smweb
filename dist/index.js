"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const routes = require("./routes");
const app = (0, express_1.default)();
const publicPath = path_1.default.resolve(__dirname, "../public");
const viewsPath = path_1.default.resolve(__dirname, "../views");
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({
    extended: true,
}));
app.use(express_1.default.static(publicPath));
app.set("views", viewsPath);
app.set("view engine", "ejs");
app.use("/", routes);
app.listen(8000, function () {
    console.log("Server is listening on port 8000");
});

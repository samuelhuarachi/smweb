const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MergeIntoSingleFilePlugin = require("webpack-merge-and-include-globally");
const TerserPlugin = require("terser-webpack-plugin");
const webpack = require("webpack");

module.exports = {
    mode: "production",
    resolve: {
        extensions: [".tsx", ".ts", ".js", ".jsx"],
    },
    optimization: {
        minimize: true,
    },
    entry: {
        "peerClient": "./resources/js/peerClient",
        "peerAnalist": "./resources/js/peerAnalist",
        "capture-girls": "./resources/js/capture-girls",
        "payment": "./resources/js/payment",
    },
    output: {
        filename: "[name].bundle.js",
        path: path.resolve(__dirname, "./public/dist/js"),
    },
    watchOptions: {
        poll: 1000, // Check for changes every second
        ignored: /node_modules/,
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MergeIntoSingleFilePlugin({
            files: {
                // "floorplan.js": ["./resources/oldJs/floorplan.js"],
            },
        }),
    ],
    module: {
        rules: [
            {
                test: /\.jsx$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "ts-loader",
                        options: {
                            configFile: "tsconfig.webpack.json",
                        },
                    },
                ],
                exclude: /node_modules/,
            },
        ],
    },
};

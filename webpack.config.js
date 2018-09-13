module.exports = {
    entry: ["./src/index.js"],
    output: {
        filename: 'yinqiantong.min.js',
        library: "yinqiantong",
        libraryTarget: "umd",
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    }
}
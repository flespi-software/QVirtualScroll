var webpack = require('webpack'),
    path = require('path')

module.exports = function (env) {
    return {
        entry: ['./src/store/modules/'+env.moduleName+'/index.js'],
        output: {
            filename: env.moduleName +'Module.js',
            path: path.resolve(__dirname, 'dist'),
            library: env.moduleName +'Module',
            libraryTarget: 'umd',
            umdNamedDefine: true
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    loader: 'babel-loader',
                    include: path.resolve(__dirname, 'src'),
                    exclude: /node_modules/
                },
            ]
        },
        resolve: {
            modules: [path.resolve('./node_modules'), path.resolve('./src')],
            extensions: ['.json', '.js']
        },
        // plugins: [
        //     new webpack.optimize.UglifyJsPlugin({
        //         minimize: true
        //     })
        // ]
    }
}
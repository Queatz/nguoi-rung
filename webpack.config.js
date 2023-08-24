const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const appDirectory = fs.realpathSync(process.cwd())

module.exports = {
    entry: path.resolve(appDirectory, 'src/app.ts'),
    output: {
        filename: 'js/app.js',
        clean: true,
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            fs: false,
            path: false,
        },
    },
    devServer: {
        host: '0.0.0.0',
        port: 8842,
        static: path.resolve(appDirectory, 'public'),
        hot: true,
        devMiddleware: {
            publicPath: '/',
            writeToDisk: true
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            { test: /\.fx$/, use: 'raw-loader' }
        ],
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'assets', to: 'assets' }
            ]
        }),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.resolve(appDirectory, 'public/index.html'),
        })
    ],
    mode: 'development',
}

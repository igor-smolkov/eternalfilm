const path = require('path') //для корректной работы с путями файлов
const HTMLWebpackPlugin = require('html-webpack-plugin') //для проброса html из сорцов
const {CleanWebpackPlugin} = require('clean-webpack-plugin') //для очистки диста от ранее собранных файлов
const CopyWebpackPlugin = require('copy-webpack-plugin') //для переброса файлов в сборку
const MiniCssExtractPlugin = require('mini-css-extract-plugin') //для css в отдельном файле
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin') //оптимизация css файлов
const TerserWebpackPlugin = require('terser-webpack-plugin') //оптимизация js файлов

const isDev = process.env.NODE_ENV === 'development' //переменная: мы находимся в режиме разработки?
const isProd = !isDev //в режиме продакшена

//имена входных файлов
const entryPoint = 'script.js'
const baseTemplate = 'main.pug'
const copyFile = 'favicon.ico'
const outputHTML = 'index.html'

//имена выходных файлов в зависимости от режима сборки с хешем и без для различных расширений
const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`

//оптимизация
const optimization = () => {
    const config = {
        splitChunks: {
            chunks: 'all'
        }
    }

    if (isProd) {
        config.minimizer = [
            new OptimizeCssAssetsWebpackPlugin(),
            new TerserWebpackPlugin()
        ]
    }

    return config
}

//общая функция добавления лоадеров для css и его препроцессоров
const cssLoaders = extra => {
    const loaders = [
        {
            loader: MiniCssExtractPlugin.loader,
            options: {
                hmr: isDev, //без перезагрузки страницы в режиме разработки
                reloadAll: true
            }
        }, 
        'css-loader'
    ]

    if (extra) {
        loaders.push(extra) //добавляем лоадер препроцессора в массив лоадеров, если лоадер определен
    }

    return loaders
}

module.exports = {
    context: path.resolve(__dirname, 'src'), //папка исходников
    entry: {
        app: [ //имя выходных файлов при [name]
            '@babel/polyfill', //для корректной работы
            `./${entryPoint}`
        ]
    }, //входная точка сборки
    output: {
        filename: filename('js'), //выходной файл приложения
        path: path.resolve(__dirname, 'dist') //папка сборки
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src') //алиас на паку исходников
        }
    },
    optimization: optimization(), //вызов вынесенной функции оптимизации
    devServer: {
        port: 4200,
        hot: isDev //если мы в режиме разработки
    },
    devtool: isDev ? 'source-map' : '',
    plugins: [
        new HTMLWebpackPlugin({
            template: `./${baseTemplate}`, //шаблон
            filename: outputHTML,
            minify: {
                collapseWhitespace: isProd //оптимизация HTML только в продакшен
            }
        }),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                {from: path.resolve(__dirname, `src/${copyFile}`)} //откуда взять файл
            ]
        }),
        new MiniCssExtractPlugin({
            filename: filename('css') //имя выходного css файла
        })
    ],
    module: {
        rules: [
            {
                test: /\.css$/, //все css файлы
                use: cssLoaders()  //<- подгрузка css, работа с ним
            },
            {
                test: /\.s[ac]ss$/, //все sass/scss файлы
                use: cssLoaders('sass-loader')  //добавление сас-лоадера для сас 
            },
            {
                test: /\.(png|jpg|svg|gif)$/, //все изображения
                use: ['file-loader']  //подгрузка файлов
            },
            {
                test: /\.(ttf|woff|woff2|eot)$/, //все шрифты
                use: ['file-loader']  //подгрузка файлов
            },
            {
                test: /\.js$/, //все скрипты
                exclude: /node_modules/, //исключаем исходники библиотек при компиляции
                loader: {
                    loader: 'babel-loader', //лоадер бэйбэла
                    options: {
                        presets: [
                            '@babel/preset-env' //основной пресет
                        ]
                    }
                }
            },
            {
                test: /\.pug$/, //все pug файлы
                loader: 'pug-loader'
            }
        ]
    }
}
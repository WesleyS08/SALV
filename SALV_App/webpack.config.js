const { withExpoWebpack } = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await withExpoWebpack(env, argv);

    // Habilita Fast Refresh no Web
    config.devServer = {
        ...config.devServer,
        hot: true,
    };

    return config;
};

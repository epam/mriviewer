const webpack = require('webpack');

// eslint-disable-next-line no-unused-vars
module.exports = function override(config, env) {
  // Add a fallback for 'fs', 'path', 'stream', and 'zlib' modules
  config.resolve.fallback = {
    fs: false,
    path: 'path-browserify',
    stream: require.resolve('stream-browserify'),
    zlib: require.resolve('browserify-zlib'),
  };

  // Add the 'process' and 'Buffer' global variables
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};

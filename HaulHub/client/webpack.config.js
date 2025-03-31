const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      "events": require.resolve("events/")
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [/node_modules\/events/]  // Exclude events module from source-map-loader
      }
    ]
  },
  ignoreWarnings: [/Failed to parse source map/]  // Ignore source map warnings
};

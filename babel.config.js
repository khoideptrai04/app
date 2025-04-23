module.exports = function (api) {
    api.cache(true);
    return {
      presets: [
        'babel-preset-expo', // Preset mặc định của Expo
      ],
    };
  };
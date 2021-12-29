module.exports = {
  plugins: [
    require('postcss-selector-namespace')({
      namespace() {
        return '#middle_background_react';
      },
    }),
  ],
};

const path = require("path");
const { name } = require("./package");

function resolve(dir) {
  return path.join(__dirname, dir);
}

const port = 7105;

module.exports = {
  outputDir: "dist",
  assetsDir: "static",
  filenameHashing: true,
  publicPath: "http://localhost:7105",
  devServer: {
    hot: true,
    disableHostCheck: true,
    port,
    overlay: {
      warnings: false,
      errors: true,
    },
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  // 自定义webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        "@": resolve("src"),
      },
    },
    output: {
      // 把子应用打包成 umd 库格式
      library: `middleVue`,
      libraryTarget: "umd",
    },
  },
};

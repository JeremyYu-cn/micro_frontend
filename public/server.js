const http = require("http");
const fs = require("fs");
const path = require("path");

const htmlPath = path.resolve(__dirname, "index.html");
const jsPath = path.resolve(__dirname, "..", "dist", "index.js");

const app = http.createServer((req, res) => {
  const html = fs.createReadStream(htmlPath);
  const js = fs.createReadStream(jsPath);
  if (/dist\/index.js/.test(req.url)) {
    js.pipe(res);
  } else {
    html.pipe(res);
  }
});

app.listen(8989, () => {
  console.log("server running at 8989");
});

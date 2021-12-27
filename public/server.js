const http = require('http');
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, 'index.html');
const jsPath = path.resolve(__dirname, '..', 'dist', 'index.js');

const app = http.createServer((req, res) => {
  if (/dist\/index.js/.test(req.url)) {
    const js = fs.createReadStream(jsPath);
    js.pipe(res);
  } else {
    const html = fs.createReadStream(htmlPath);
    html.pipe(res);
  }
});

app.listen(8989, () => {
  console.log('server running at 8989');
});

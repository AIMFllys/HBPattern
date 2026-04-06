const https = require('https');
const fs = require('fs');
const path = require('path');

const fontDir = path.join(__dirname, 'public', 'fonts');
if (!fs.existsSync(fontDir)) {
  fs.mkdirSync(fontDir, { recursive: true });
}

const fontPath = path.join(fontDir, 'material-symbols-outlined.woff2');
const url = 'https://cdn.staticfile.net/material-symbols-outlined/5.2.40/materialsymbolsoutlined-variablefont_wght.woff2';

console.log(`开始从 ${url} 下载字体文件...`);

https.get(url, (response) => {
  if (response.statusCode !== 200) {
    console.error(`下载失败，状态码: ${response.statusCode}`);
    return;
  }

  const fileStream = fs.createWriteStream(fontPath);
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log('✅ 字体文件下载成功: public/fonts/material-symbols-outlined.woff2');
  });
}).on('error', (err) => {
  console.error('下载出错:', err.message);
});

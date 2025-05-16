// builder.js
const compile = require('./compiler');
const path = require('path');
const fs = require('fs');

// 讀取 CLI 參數
const graphPath = process.argv[2] || './full-graph.json';
const outputDir = process.argv[3] || './prompt-txt';

// 確認 graph 檔案是否存在
const resolvedGraphPath = path.resolve(process.cwd(), graphPath);
if (!fs.existsSync(resolvedGraphPath)) {
  console.error(`❌ 語意圖檔案不存在：${resolvedGraphPath}`);
  process.exit(1);
}

// 開始編譯
console.log(`✔ using semantic graph: ${resolvedGraphPath}`);
console.log(`✔ output directory: ${outputDir}`);
compile(resolvedGraphPath, outputDir);

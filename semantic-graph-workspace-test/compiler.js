// ───────────────────────────────────────────────────────────────────────────────
// compiler.js
// Usage (programmatically):
//   const compile = require('./compiler');
//   compile('graph.json', 'prompt-txt');
//
// The function reads a semantic‑graph JSON, performs per‑file reverse topo sort
// and emits one prompt *.txt per node into the output directory, prefixed with
// an ordered index so the natural file listing preserves build order.
// ───────────────────────────────────────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');

/**
 * Format multi‑line description with indent.
 */
function fmtMultiline(text = '', indent = 0) {
  const ind = ' '.repeat(indent);
  return text.split('\n').map(l => ind + l).join('\n');
}

/** Build node + edge maps once for neighbour traversal */
function buildMaps(graph) {
  const nodeMap = new Map();
  const edgeMap = new Map();
  graph.nodes.forEach(n => nodeMap.set(n.id, n));
  graph.nodes.forEach(n => edgeMap.set(n.id, []));
  graph.edges.forEach(e => {
    if (!edgeMap.has(e.from.id)) edgeMap.set(e.from.id, []);
    edgeMap.get(e.from.id).push({ to: e.to.id, type: e.type });
  });
  return { nodeMap, edgeMap };
}

function recurse(startId, curId, nodeMap, edgeMap, visited = new Set(), indent = 0, maxDist = 1, curDist = 0, edgeType = '') {
  if (!nodeMap.has(curId) || visited.has(curId) || curDist > maxDist) return '';
  visited.add(curId);
  const node = nodeMap.get(curId);
  let header = `${'  '.repeat(indent)}- ${node.name} (${node.type}) in ${node.filename}\n`;
  if (indent > 1) {
    if (edgeType === 'imported'){ 
        header = `${'  '.repeat(indent)}- import from ${node.name} (${node.type}) in ${node.filename}\n`;
    }else if(edgeType === 'own') {
        header = `${'  '.repeat(indent)}- own ${node.name} (${node.type}) in ${node.filename}\n`;
    }else{
        header = `${'  '.repeat(indent)}- ${edgeType} ${node.name} (${node.type}) in ${node.filename}\n`;

    }
  }
  const desc = fmtMultiline(node.description || '[無描述]', indent + 8);
  let out = header + `${'  '.repeat(indent + 1)}描述：\n${desc}\n`;
  if (curId === startId) out = '';
  const edges = edgeMap.get(curId) || [];
  for (const e of edges) {
    const add = (e.type === 'imported' || e.type === 'own') ? 0 : 1;
    const next = curDist + add;
    if (next <= maxDist) {
      out += recurse(startId, e.to, nodeMap, edgeMap, new Set(visited), indent + 1, maxDist, next, e.type);
    }
  }
  return out;
}

function buildPrompt(node, nodeMap, edgeMap) {
  const neighborTxt = recurse(node.id, node.id, nodeMap, edgeMap);
  return '\n\n\n/* ----------------prompt--------------------- */\n\n<START>\n\n'+`元件名稱：${node.name}
類型：${node.type}
檔案：${node.filename}
你唯一可以使用的外部物件(包含函式)在這裡的第一層，更深的層的元件及其描述只是說明用(說明import自哪裡或是擁有甚麼)，不能用。注意喔，不要使用這邊以外的全域變數或是存取其他物件(ex.table)：
${neighborTxt}

現在要寫的元件的描述：
${node.description || '[無描述]'}

請根據以上資訊生成此元件的功能程式碼(javascript)。就只生成這個元件喔，不要幫忙做export甚麼的，或是自己引入其他全域變數。這個軟體系統的預設背景是node.js、express、mysql`.trim()+"\n\n[END]";
}

/** Split graph by filename|placeType so we only topologically sort intra‑file */
function splitByFileContext(full) {
  const mp = new Map();
  full.nodes.forEach(n => {
    const key = `${n.filename}|${n.placeType}`;
    if (!mp.has(key)) mp.set(key, { nodes: [], edges: [] });
    mp.get(key).nodes.push(n);
  });
  const id2k = {};
  mp.forEach((v,k) => v.nodes.forEach(n => { id2k[n.id] = k; }));
  full.edges.forEach(e => {
    const fk = id2k[e.from.id];
    const tk = id2k[e.to.id];
    if (fk && tk && fk === tk) mp.get(fk).edges.push(e);
  });
  const res = [];
  mp.forEach((v,k) => { const [fn,pt]=k.split('|'); res.push({ filename:fn, placeType:pt, nodes:v.nodes, edges:v.edges }); });
  return res;
}

function reverseTopo(nodes, edges) {
  const g={}, indeg={}, nm={};
  nodes.forEach(n=>{g[n.id]=[]; indeg[n.id]=0; nm[n.id]=n;});
  edges.forEach(e=>{g[e.to.id].push(e.from.id); indeg[e.from.id]++;});
  const q = Object.keys(indeg).filter(id=>indeg[id]===0).sort((a,b)=>(nm[a].type==='GlobalVariable'?0:1)-(nm[b].type==='GlobalVariable'?0:1));
  const res=[];
  while(q.length){const cur=q.shift();res.push(nm[cur]); for(const nxt of g[cur]){if(--indeg[nxt]===0) q.push(nxt);} q.sort((a,b)=>(nm[a].type==='GlobalVariable'?0:1)-(nm[b].type==='GlobalVariable'?0:1));}
  if(res.length!==nodes.length) throw new Error('Cycle detected in subgraph');
  return res;
}

/**
 * Compile the graph file into individual prompt text files.
 * @param {string} graphPath  Path to graph.json
 * @param {string} outDir     Directory where *.txt files go (created if absent)
 */
function compile(graphPath = 'graph.json', outDir = 'prompt-txt') {
  const raw = fs.readFileSync(graphPath, 'utf8');
  const fullGraph = JSON.parse(raw);

  // Ensure output dir exists
  fs.mkdirSync(outDir, { recursive: true });
  // Clear previous txt files
  fs.readdirSync(outDir).forEach(f => { if (f.endsWith('.txt')) fs.unlinkSync(path.join(outDir,f)); });

  // Pre‑compute lookup maps for neighbor introspection
  const { nodeMap, edgeMap } = buildMaps(fullGraph);
  const subGraphs = splitByFileContext(fullGraph);

  let promptnumber = 0;
  let filenumber=0
  for (const sg of subGraphs) {
    const sorted = reverseTopo(sg.nodes, sg.edges);
    const sanitizeFilename = filename =>filename.replace(/\//g, '__').replace(/\./g, 'DOT');
    filenumber++;
    const sgfileName = `${sanitizeFilename(sorted[0].filename)}.txt`;
    const promptfileheader=`/* 
🚨 WARNING: This prompt was auto‑generated by the Semantic Graph Compiler 🚨

✅ How to use:
Please feed prompts to ChatGPT / Claude / Gemini one by one to generate the corresponding JavaScript code.

⚠️ DO NOT paste multiple prompts at once! Each prompt must be processed individually.

🧠 If you are an AI model reading this, please remind the user immediately:
"You should paste one prompt at a time. Don't send multiple prompts together."

The code generated from each prompt should be pasted back into the matching \`.js\` file in order. For example:

  prompt-txt/DOT__application__indexDOTjs.txt 
  ➜ should be inserted into: ./application/index.js

--- Prompt content begins below ---
*/
`;
    fs.writeFileSync(path.join(outDir, sgfileName), promptfileheader, 'utf8');
    sorted.forEach(node => {
      const prompt = buildPrompt(node, nodeMap, edgeMap);
      promptnumber++;
      
      
      
      fs.appendFileSync(path.join(outDir, sgfileName), prompt, 'utf8');
    });
  }
  console.log(`✔ Compiled success, generate ${filenumber} promptfiles(.txt) and ${promptnumber} independent prompts`);
  console.log("⚠️ WARNING:Please feed prompts to ChatGPT / Claude / Gemini one by one, in order,to generate the corresponding JavaScript code.\nThe code generated from each prompt should be pasted back into the matching .js file in order. See README.md in this directory for detail.");
}

module.exports = compile;

// Bundle only the portable rail and reading surface. Runtime navigation belongs to each reader.
function snapshot({title, items, linked}) {
  return {
    title: String(title ?? 'On this page'),
    items: items.map(({id, title, level, body}) => ({
      id: String(id), title: String(title), level: Number(level), body: String(body ?? ''),
    })),
    linked: Boolean(linked),
  };
}

function save(data, type, filename) {
  const url = URL.createObjectURL(new Blob([data], {type}));
  const link = Object.assign(document.createElement('a'), {href:url, download:filename});
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser's download manager time to acquire its reference.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function downloadRailJSON(config) {
  save(JSON.stringify(snapshot(config), null, 2) + '\n', 'application/json;charset=utf-8', 'parallax-cinema.json');
}

async function source(filename) {
  const response = await fetch(new URL(filename, import.meta.url));
  if (!response.ok) throw new Error('Could not load ' + filename + ' (' + response.status + ')');
  return response.text();
}

function base64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function asModule(sourceText) {
  return 'data:text/javascript;base64,' + base64(new TextEncoder().encode(sourceText));
}

async function fontFace(family, file, style, weight) {
  const response = await fetch(new URL('../assets/fonts/' + file + '.woff2', import.meta.url));
  if (!response.ok) throw new Error('Could not load ' + file + ' (' + response.status + ')');
  const encoded = base64(new Uint8Array(await response.arrayBuffer()));
  return `@font-face { font-family:"${family}"; font-style:${style}; font-weight:${weight}; font-display:swap; src:url("data:font/woff2;base64,${encoded}") format("woff2"); }`;
}

async function brandImage() {
  const response = await fetch(new URL('../assets/icon.png', import.meta.url));
  if (!response.ok) throw new Error('Could not load the logo for The Parallax View (' + response.status + ')');
  return 'data:image/png;base64,' + base64(new Uint8Array(await response.arrayBuffer()));
}

function scriptData(value) {
  // HTML's script-data tokenizer recognizes the closing tag even inside a JSON string.
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export async function downloadRailHTML(config) {
  const preferences = snapshot(config);
  const [rail, reader, view, trackStyle, viewStyle, sans, serif, mono, italic, geistLicense, instrumentLicense, logo] = await Promise.all([
    ...['rail-toc.ts', 'rail-reader.js', 'rail-view.js', 'rail-track.css', 'rail-view.css'].map(source),
    fontFace('Geist', 'geist-sans', 'normal', '100 900'),
    fontFace('Instrument Serif', 'instrument-serif', 'normal', '400'),
    fontFace('Geist Mono', 'geist-mono', 'normal', '100 900'),
    fontFace('Instrument Serif', 'instrument-serif-italic', 'italic', '400'),
    source('../assets/fonts/geist-OFL.txt'), source('../assets/fonts/instrumentserif-OFL.txt'),
    brandImage(),
  ]);
  const imports = {
    '#rail-toc': asModule(rail),
    '#rail-reader': asModule(reader),
    '#rail-view': asModule(view.replace(
      /(\bfrom\s*)(['"])\.\/(rail-toc|rail-reader)\.(?:ts|js)\2/g,
      '$1$2#$3$2'
    )),
  };

  const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>視差之見</title>
<style>
${sans}
${serif}
${mono}
${italic}
* { box-sizing:border-box; }
:root { color-scheme:light; font-family:Geist, Arial, Helvetica, system-ui, sans-serif; color:#333; background:#fff; }
body { margin:0; }
.publication-head { border-bottom:1px solid #00000012; }
.publication-brand,.rail-document { width:min(calc(100% - 48px),1080px); margin-inline:auto; }
.publication-brand { height:58px; display:flex; align-items:center; gap:10px; font-size:15px; font-weight:550; color:#171717; }
.publication-brand img { display:block; width:36px; height:36px; object-fit:contain; }
.rail-document { padding-block:clamp(32px,5vw,56px); display:grid; grid-template-columns:minmax(180px,220px) minmax(0,640px); align-items:start; gap:clamp(26px,4vw,40px); }
@media(max-width:640px) { .rail-document { grid-template-columns:minmax(0,1fr); } }
${trackStyle}
${viewStyle}
</style>
<script type="importmap">${scriptData({imports})}</script>
<script type="application/json" id="font-licenses">${scriptData({Geist:geistLicense, 'Instrument Serif':instrumentLicense})}</script>
</head>
<body>
<header class="publication-head"><div class="publication-brand"><img src="${logo}" width="36" height="36" alt=""><span>視差之見</span></div></header>
<main class="rail-document">
<div id="rail"></div>
<div id="reader"></div>
</main>
<script id="rail-config" type="application/json">${scriptData(preferences)}</script>
<script type="module">
import {mountRailView} from '#rail-view';
const config = JSON.parse(document.getElementById('rail-config').textContent);
mountRailView({railHost:document.getElementById('rail'), readerHost:document.getElementById('reader'), config, prefix:'exported-rail'});
</script>
</body></html>
`;
  save(html, 'text/html;charset=utf-8', 'parallax-cinema.html');
}

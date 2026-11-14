/*
 * Simulador local do GitHub Pages (ferramenta de TESTE; o jogo publicado não usa Node).
 *
 * Imita o que o GitHub Pages faz com este repositório publicado a partir da raiz da branch:
 *   - serve SÓ os arquivos que vão para o repositório (rastreados pelo git + novos não ignorados);
 *   - diferencia maiúsculas de minúsculas nos caminhos (o servidor do GitHub é Linux; o Windows não);
 *   - o site fica no subcaminho /Hangover-Fishing/ (como https://daikiihype.github.io/Hangover-Fishing/);
 *   - pasta sem barra no fim → redireciona 301 para a pasta com barra; pasta → index.html;
 *   - sem processamento Jekyll (o repositório tem .nojekyll);
 *   - tudo o que não existe → 404.
 * Cada pedido é registrado (para a auditoria de publicação conferir 404 e caminhos).
 *
 * Uso:  node jogo/tests/servidor-pages.js [porta] [arquivo-de-registro]
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RAIZ = path.join(__dirname, '..', '..');
const PREFIXO = '/Hangover-Fishing';
const PORTA = Number(process.argv[2]) || 8790;
const REGISTRO = process.argv[3] || null;

const git = (args) => execSync('git -c core.quotepath=false ' + args, { cwd: RAIZ }).toString('utf8').split('\0').filter(Boolean);
function publicados() {
  const s = new Set(git('ls-files -z'));
  for (const f of git('ls-files -z --others --exclude-standard')) s.add(f);
  // arquivos apagados no disco não são publicados
  for (const f of [...s]) if (!fs.existsSync(path.join(RAIZ, f))) s.delete(f);
  return s;
}
let arquivos = publicados();
setInterval(() => { arquivos = publicados(); }, 5000).unref();   // acompanha arquivos novos durante os testes

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webm': 'video/webm', '.zip': 'application/zip', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.bat': 'text/plain; charset=utf-8'
};

function registrar(linha) { if (REGISTRO) fs.appendFileSync(REGISTRO, linha + '\n'); }

const servidor = http.createServer((req, res) => {
  const fim = (status, cab, corpo) => { res.writeHead(status, cab || {}); res.end(corpo || ''); registrar(status + ' ' + req.method + ' ' + req.url); };
  if (req.method !== 'GET' && req.method !== 'HEAD') return fim(405);
  let caminho;
  try { caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return fim(400); }
  if (caminho === PREFIXO) return fim(301, { Location: PREFIXO + '/' });
  if (!caminho.startsWith(PREFIXO + '/')) return fim(404, { 'Content-Type': 'text/plain' }, 'fora do site');
  let rel = caminho.slice(PREFIXO.length + 1);
  if (rel.includes('..')) return fim(400);
  if (rel === '' || rel.endsWith('/')) rel += 'index.html';
  if (!arquivos.has(rel)) {
    if (arquivos.has(rel + '/index.html')) return fim(301, { Location: caminho + '/' });
    return fim(404, { 'Content-Type': 'text/plain' }, '404: ' + rel);
  }
  const corpo = fs.readFileSync(path.join(RAIZ, rel));
  fim(200, { 'Content-Type': TIPOS[path.extname(rel).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'max-age=600' }, req.method === 'HEAD' ? '' : corpo);
});
servidor.listen(PORTA, '127.0.0.1', () => console.log('Simulador do GitHub Pages: http://127.0.0.1:' + PORTA + PREFIXO + '/  (' + arquivos.size + ' arquivos publicados)'));

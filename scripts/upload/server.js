import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pino from 'pino';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const HTTP_PORT = parseInt(process.env.UPLOAD_SERVER_PORT || '9011', 10);
const WS_PORT = parseInt(process.env.UPLOAD_WS_PORT || '9010', 10);

let connectedExtensions = [];
let pendingRequests = new Map();

function createHTTPServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'running',
        extensions: connectedExtensions.length,
        extensionConnected: connectedExtensions.length > 0,
        pendingRequests: pendingRequests.size
      }));
      return;
    }

    if (req.method === 'POST' && req.url === '/upload') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { filePath } = JSON.parse(body);
          if (!filePath) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'filePath requis' }));
            return;
          }

          if (connectedExtensions.length === 0) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Aucune extension Chrome connectee' }));
            return;
          }

          const result = await sendToExtension({
            type: 'upload_file',
            payload: {
              filePath,
              fileData: fs.readFileSync(filePath).toString('base64'),
              fileName: path.basename(filePath)
            }
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          log.error({ err }, 'Erreur upload');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/inject-text') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { selector, text } = JSON.parse(body);
          if (!text && text !== '') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'text requis' }));
            return;
          }

          if (connectedExtensions.length === 0) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Aucune extension Chrome connectee' }));
            return;
          }

          const result = await sendToExtension({
            type: 'inject_text',
            payload: {
              selector: selector || '[role="textbox"]',
              text
            }
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          log.error({ err }, 'Erreur inject-text');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/test') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { filePath } = JSON.parse(body);
          if (connectedExtensions.length === 0) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Extension non connectee' }));
            return;
          }

          const testPath = filePath || '';
          const result = testPath
            ? await sendToExtension({
                type: 'upload_file',
                payload: {
                  filePath: testPath,
                  fileData: fs.readFileSync(testPath).toString('base64'),
                  fileName: path.basename(testPath)
                }
              })
            : await sendToExtension({ type: 'test', payload: { filePath: '' } });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return server;
}

function createWSServer() {
  let wss;
  try {
    wss = new WebSocketServer({ port: WS_PORT });
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.log("Port WebSocket " + WS_PORT + " deja utilise");
      return null;
    }
    throw err;
  }

  wss.on('connection', (ws) => {
    log.info('Extension Chrome connectee');
    connectedExtensions.push(ws);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        log.debug({ msg }, 'Message recu de l\'extension');

        if ((msg.type === 'result' || msg.type === 'upload_result' || msg.type === 'inject_text_result') && msg.requestId) {
          const pending = pendingRequests.get(msg.requestId);
          if (pending) {
            pending.resolve(msg);
            pendingRequests.delete(msg.requestId);
          }
        }
      } catch (err) {
        log.error({ err }, 'Erreur traitement message extension');
      }
    });

    ws.on('close', () => {
      connectedExtensions = connectedExtensions.filter(e => e !== ws);
      log.info('Extension deconnectee');
    });

    ws.on('error', (err) => {
      log.error({ err }, 'Erreur WebSocket extension');
      connectedExtensions = connectedExtensions.filter(e => e !== ws);
    });
  });

  return wss;
}

function sendToExtension(message, timeout = 15000) {
  return new Promise((resolve, reject) => {
    if (connectedExtensions.length === 0) {
      reject(new Error('Aucune extension connectee'));
      return;
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const msg = { ...message, requestId };

    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error('Timeout en attente de reponse de l\'extension'));
    }, timeout);

    pendingRequests.set(requestId, {
      resolve: (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      }
    });

    const ws = connectedExtensions[0];
    ws.send(JSON.stringify(msg));
    log.debug({ requestId, message }, 'Message envoye a l\'extension');
  });
}

async function start() {
  const httpServer = createHTTPServer();
  const wss = createWSServer();

  httpServer.listen(HTTP_PORT, () => {
    log.info({ port: HTTP_PORT }, 'Serveur HTTP demarre');
    console.log(`Serveur HTTP: http://localhost:${HTTP_PORT}`);
  });

  log.info({ port: WS_PORT }, 'Serveur WebSocket demarre');
  console.log(`Serveur WebSocket: ws://localhost:${WS_PORT}`);

  process.on('SIGINT', () => {
    log.info('Arret du serveur...');
    httpServer.close();
    if (wss) wss.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log.info('Arret du serveur...');
    httpServer.close();
    if (wss) wss.close();
    process.exit(0);
  });
}

start();

export { createHTTPServer, createWSServer, sendToExtension };

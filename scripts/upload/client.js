import http from 'http';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

function getServerUrl() {
  return process.env.UPLOAD_SERVER_URL || 'http://localhost:9011';
}

function httpRequest(method, urlPath, body = null, baseUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl || getServerUrl());
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Serveur inaccessible : ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout de connexion au serveur'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

export async function checkStatus(baseUrl) {
  try {
    const status = await httpRequest('GET', '/status', null, baseUrl);
    return {
      running: status.status === 'running',
      extensionConnected: status.extensionConnected || false,
      extensions: status.extensions || 0,
      pendingRequests: status.pendingRequests || 0
    };
  } catch (err) {
    log.error({ err }, 'Serveur upload inaccessible');
    return {
      running: false,
      extensionConnected: false,
      extensions: 0,
      pendingRequests: 0,
      error: err.message
    };
  }
}

export async function upload(filePath, baseUrl) {
  try {
    const result = await httpRequest('POST', '/upload', { filePath }, baseUrl);
    log.info({ result }, 'Upload envoye');
    return result;
  } catch (err) {
    log.error({ err }, 'Erreur upload');
    return { success: false, error: err.message };
  }
}

export async function testUpload(filePath, baseUrl) {
  try {
    const result = await httpRequest('POST', '/test', { filePath }, baseUrl);
    log.info({ result }, 'Test upload effectue');
    return result;
  } catch (err) {
    log.error({ err }, 'Erreur test upload');
    return { success: false, error: err.message };
  }
}

export function createClient(serverUrl) {
  const baseUrl = serverUrl || getServerUrl();

  return {
    checkStatus: () => checkStatus(baseUrl),
    upload: (filePath) => upload(filePath, baseUrl),
    testUpload: (filePath) => testUpload(filePath, baseUrl),
    destroy() {}
  };
}

if (process.argv[1] && process.argv[1].endsWith('client.js')) {
  const command = process.argv[2];
  const arg = process.argv[3];

  async function main() {
    switch (command) {
      case 'status': {
        const status = await checkStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
      }
      case 'upload': {
        if (!arg) {
          console.error('Usage: node scripts/upload/client.js upload <chemin_fichier>');
          process.exit(1);
        }
        const result = await upload(arg);
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      case 'test': {
        const result = await testUpload(arg || '');
        console.log(JSON.stringify(result, null, 2));
        break;
      }
      default:
        console.error('Commandes: status, upload <fichier>, test');
        process.exit(1);
    }
  }

  main().catch(err => {
    console.error('Erreur:', err.message);
    process.exit(1);
  });
}

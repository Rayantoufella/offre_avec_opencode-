import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..');
const envPath = path.join(projectRoot, '.env');
const envExamplePath = path.join(projectRoot, '.env.example');

function writeEnv(cvPath, excelPath) {
  const envContent = `CV_PATH=${cvPath}
EXCEL_PATH=${excelPath}
DRY_RUN=true
UPLOAD_SERVER_URL=http://localhost:9011
UPLOAD_SERVER_PORT=9011
UPLOAD_WS_PORT=9010
CV_MAX_SIZE_MB=10
LOG_LEVEL=info
`;

  fs.writeFileSync(envPath, envContent, 'utf-8');
  console.log(JSON.stringify({
    success: true,
    message: 'Fichier .env cree',
    cvPath,
    excelPath
  }));
}

const cvPath = process.argv[2];
const excelPath = process.argv[3];

if (!cvPath || !excelPath) {
  console.error('Usage: node scripts/setup-env.js <cv_path> <excel_path>');
  process.exit(1);
}

writeEnv(cvPath, excelPath);

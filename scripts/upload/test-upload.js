import { checkStatus, upload, testUpload } from './client.js';
import { validateCV } from '../validation/cv-validator.js';
import dotenv from 'dotenv';

dotenv.config();

const log = process.env.LOG_LEVEL || 'info';

async function runTest() {
  console.log('========== TEST DU FILE UPLOAD HELPER ==========\n');

  const cvPath = process.env.CV_PATH;
  if (!cvPath) {
    console.error('CV_PATH non defini dans .env');
    process.exit(1);
  }

  console.log('1. Verification du CV...');
  const cvResult = validateCV(cvPath);
  if (!cvResult.valid) {
    console.error(`   ECHEC: ${cvResult.reason}`);
    process.exit(1);
  }
  console.log(`   OK: ${cvPath} (${(cvResult.size / 1024).toFixed(1)} Ko)\n`);

  console.log('2. Verification du serveur upload...');
  const status = await checkStatus();
  if (!status.running) {
    console.error('   ECHEC: Serveur non demarre');
    console.error('   Lancez: npm run upload-server');
    process.exit(1);
  }
  console.log(`   OK: Serveur en marche\n`);

  console.log('3. Verification de l\'extension Chrome...');
  if (!status.extensionConnected) {
    console.error('   ECHEC: Extension non connectee');
    console.error('   Installez l\'extension dans chrome://extensions/');
    process.exit(1);
  }
  console.log(`   OK: ${status.extensions} extension(s) connectee(s)\n`);

  console.log('4. Test d\'upload...');
  const uploadResult = await testUpload(cvPath);
  if (uploadResult.success) {
    console.log(`   SUCCES: ${uploadResult.file}`);
  } else {
    console.error(`   ECHEC: ${uploadResult.error}`);
    process.exit(1);
  }

  console.log('\n========== TOUS LES TESTS SONT OK ==========');
}

runTest().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});

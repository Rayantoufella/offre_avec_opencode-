import { runWorkflow } from './orchestrator.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Mode TEST ONE active\n');
  process.env.DRY_RUN = 'true';

  const result = await runWorkflow({
    dryRun: true,
    testOne: true,
    excelPath: process.argv[2],
    cvPath: process.argv[3]
  });

  if (!result.success) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});

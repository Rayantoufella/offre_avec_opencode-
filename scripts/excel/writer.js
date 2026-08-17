import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

const AUTOMATION_COLUMNS = [
  { header: 'AUTOMATION_STATUS', key: 'AUTOMATION_STATUS', width: 18 },
  { header: 'AUTOMATION_ERROR', key: 'AUTOMATION_ERROR', width: 40 },
  { header: 'PROCESSED_AT', key: 'PROCESSED_AT', width: 25 }
];

export async function writeExcelStatus(filePath, results, options = {}) {
  const { backup = true, suffix = '_processed' } = options;

  if (backup && fs.existsSync(filePath)) {
    const backupPath = filePath.replace(/(\.[^.]+)$/, `${suffix}$1`);
    fs.copyFileSync(filePath, backupPath);
    log.info({ backupPath }, 'Sauvegarde creee');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('Aucune feuille trouvee dans le fichier');
  }

  const lastCol = worksheet.columnCount;
  const statusCol = lastCol + 1;
  const errorCol = lastCol + 2;
  const processedCol = lastCol + 3;

  worksheet.getColumn(statusCol).header = 'AUTOMATION_STATUS';
  worksheet.getColumn(statusCol).key = 'AUTOMATION_STATUS';
  worksheet.getColumn(statusCol).width = 18;

  worksheet.getColumn(errorCol).header = 'AUTOMATION_ERROR';
  worksheet.getColumn(errorCol).key = 'AUTOMATION_ERROR';
  worksheet.getColumn(errorCol).width = 40;

  worksheet.getColumn(processedCol).header = 'PROCESSED_AT';
  worksheet.getColumn(processedCol).key = 'PROCESSED_AT';
  worksheet.getColumn(processedCol).width = 25;

  for (const result of results) {
    const rowNum = result.row;
    const row = worksheet.getRow(rowNum + 1);

    row.getCell(statusCol).value = result.automationStatus || result.status || '';
    row.getCell(errorCol).value = result.automationError || result.reason || '';
    row.getCell(processedCol).value = result.processedAt || new Date().toISOString();

    row.commit();
  }

  await workbook.xlsx.writeFile(filePath);
  log.info({ filePath, resultsCount: results.length }, 'Excel mis a jour');
  return { filePath, updated: results.length };
}

export async function addAutomationColumns(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    throw new Error('Aucune feuille trouvee');
  }

  let hasStatus = false;
  let hasError = false;
  let hasProcessed = false;

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.value === 'AUTOMATION_STATUS') hasStatus = true;
      if (cell.value === 'AUTOMATION_ERROR') hasError = true;
      if (cell.value === 'PROCESSED_AT') hasProcessed = true;
    });
  });

  const lastCol = worksheet.columnCount;
  let colOffset = 0;

  if (!hasStatus) {
    worksheet.getColumn(lastCol + 1).header = 'AUTOMATION_STATUS';
    worksheet.getColumn(lastCol + 1).key = 'AUTOMATION_STATUS';
    worksheet.getColumn(lastCol + 1).width = 18;
    colOffset++;
  }
  if (!hasError) {
    worksheet.getColumn(lastCol + 1 + colOffset).header = 'AUTOMATION_ERROR';
    worksheet.getColumn(lastCol + 1 + colOffset).key = 'AUTOMATION_ERROR';
    worksheet.getColumn(lastCol + 1 + colOffset).width = 40;
    colOffset++;
  }
  if (!hasProcessed) {
    worksheet.getColumn(lastCol + 1 + colOffset).header = 'PROCESSED_AT';
    worksheet.getColumn(lastCol + 1 + colOffset).key = 'PROCESSED_AT';
    worksheet.getColumn(lastCol + 1 + colOffset).width = 25;
  }

  await workbook.xlsx.writeFile(filePath);
  log.info({ filePath }, 'Colonnes d\'automation ajoutees');
}

export function prepareWriteData(analysisResults) {
  return analysisResults.map(r => ({
    row: r.row,
    automationStatus: r.status === 'VALID' ? 'READY' : r.status === 'SKIP' ? 'SKIPPED' : r.status === 'INCOMPLETE' ? 'INCOMPLETE' : r.status,
    automationError: r.reason || '',
    processedAt: new Date().toISOString()
  }));
}

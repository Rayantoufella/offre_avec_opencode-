import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

export async function openGmailCompose(mcpTools, to, subject) {
  log.info('Ouverture de Gmail Compose...');

  const params = new URLSearchParams();
  if (to) params.set('to', to);
  if (subject) params.set('su', subject);
  const url = `https://mail.google.com/mail/u/0/?view=cm&fs=1${params.toString() ? '&' + params.toString() : ''}`;

  await mcpTools.navigate(url);
  await mcpTools.wait_for({ timeout: 5000 });

  const snapshot = await mcpTools.snapshot();

  if (!snapshot) {
    throw new Error('Impossible de capturer la page Gmail');
  }

  log.info('Gmail Compose ouvert');
  return snapshot;
}

export async function fillRecipient(mcpTools, email) {
  log.info({ email }, 'Remplissage du destinataire');

  const snapshot = await mcpTools.snapshot();
  const toField = findElementByLabel(snapshot, ['To', 'A', 'Destinataire']);

  if (!toField) {
    throw new Error('Champ destinataire introuvable');
  }

  await mcpTools.click({ ref: toField.ref });
  await mcpTools.type({ ref: toField.ref, text: email });
  await mcpTools.press_key({ key: 'Tab' });

  log.info({ email }, 'Destinataire rempli');
}

export async function fillSubject(mcpTools, subject) {
  log.info({ subject }, 'Remplissage de l\'objet');

  const snapshot = await mcpTools.snapshot();
  const subjectField = findElementByLabel(snapshot, ['Subject', 'Objet']);

  if (!subjectField) {
    throw new Error('Champ objet introuvable');
  }

  await mcpTools.click({ ref: subjectField.ref });
  await mcpTools.type({ ref: subjectField.ref, text: subject });

  log.info('Objet rempli');
}

export async function fillBody(mcpTools, body) {
  log.info('Remplissage du corps du message');

  const snapshot = await mcpTools.snapshot();
  const bodyField = findElementByRole(snapshot, 'textbox');

  if (!bodyField) {
    throw new Error('Champ corps du message introuvable');
  }

  await mcpTools.click({ ref: bodyField.ref });
  await mcpTools.type({ ref: bodyField.ref, text: body });

  log.info('Corps du message rempli');
}

export async function attachFile(mcpTools, uploadClient, filePath) {
  log.info({ filePath }, 'Attachement du fichier via File Upload Helper');

  const status = await uploadClient.checkStatus();
  if (!status.extensionConnected) {
    throw new Error('Extension Chrome non connectee au serveur upload');
  }

  const result = await uploadClient.upload(filePath);

  if (!result.success) {
    throw new Error(`Echec de l'upload : ${result.error}`);
  }

  log.info({ file: result.file }, 'Fichier attache avec succes');
  return result;
}

export async function verifyAttachment(mcpTools) {
  log.info('Verification de la piece jointe...');

  await mcpTools.wait_for({ timeout: 3000 });
  const snapshot = await mcpTools.snapshot();
  const pageText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

  const hasAttachment = /attached|piece jointe|attachment/i.test(pageText) ||
    /\.pdf/i.test(pageText);

  log.info({ hasAttachment }, 'Verification piece jointe');
  return hasAttachment;
}

export async function verifyRecipient(mcpTools, expectedEmail) {
  log.info({ expectedEmail }, 'Verification du destinataire');

  const snapshot = await mcpTools.snapshot();
  const pageText = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

  const hasRecipient = pageText.includes(expectedEmail);
  log.info({ hasRecipient }, 'Verification destinataire');
  return hasRecipient;
}

export async function sendEmail(mcpTools, dryRun = true) {
  if (dryRun) {
    log.info('MODE DRY RUN - Envoi simule, aucun email envoye');
    return { sent: false, dryRun: true };
  }

  log.info('Envoi de l\'email...');

  const snapshot = await mcpTools.snapshot();
  const sendButton = findElementByLabel(snapshot, ['Send', 'Envoyer']);

  if (!sendButton) {
    throw new Error('Bouton Envoyer introuvable');
  }

  await mcpTools.click({ ref: sendButton.ref });
  await mcpTools.wait_for({ timeout: 5000 });

  log.info('Email envoye');
  return { sent: true, dryRun: false };
}

function findElementByLabel(snapshot, labels) {
  if (!snapshot) return null;
  const text = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

  for (const label of labels) {
    const regex = new RegExp(`${label}[^\\n]*@(e\\d+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return { ref: match[1], label };
    }
  }

  const refMatch = text.match(/@e(\d+)/);
  if (refMatch) {
    return { ref: `e${refMatch[1]}`, label: labels[0] };
  }

  return null;
}

function findElementByRole(snapshot, role) {
  if (!snapshot) return null;
  const text = typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot);

  const regex = new RegExp(`${role}[^@]*@(e\\d+)`, 'i');
  const match = text.match(regex);
  if (match) {
    return { ref: match[1], role };
  }

  return null;
}

export async function prepareEmail(mcpTools, emailData, uploadClient, cvPath) {
  log.info({ to: emailData.to, subject: emailData.subject }, 'Preparation de l\'email');

  await openGmailCompose(mcpTools, emailData.to, emailData.subject);
  await fillBody(mcpTools, emailData.body);
  await attachFile(mcpTools, uploadClient, cvPath);

  const attachmentOk = await verifyAttachment(mcpTools);
  if (!attachmentOk) {
    log.warn('Piece jointe non detectee');
  }

  const recipientOk = await verifyRecipient(mcpTools, emailData.to);
  if (!recipientOk) {
    log.warn('Destinataire non verifie');
  }

  return {
    ready: attachmentOk && recipientOk,
    attachmentOk,
    recipientOk
  };
}

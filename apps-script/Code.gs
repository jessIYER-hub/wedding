/**
 * Jessica & Gaurav · RSVP endpoint
 *
 * Receives RSVPs from the save-the-date site and writes them into the sheet
 * this script is bound to. See README.md for deploy steps.
 *
 * Re-submissions: if a guest sends the form again with the same name
 * (ignoring capitals and extra spaces), their existing row is UPDATED in place
 * rather than a new row being added. The Timestamp shows their latest answer.
 */

// Must match GUEST_PASSPHRASE in script.js (not case sensitive).
const PASSPHRASE = 'forever';

const SHEET_NAME = 'RSVPs';

const HEADERS = [
  'Timestamp',
  'Name',
  'Attending',
  'Party size',
  'Other guests',
  'Dietary/allergies',
  'Solo room preference',
  'Message',
];

const MAX_FIELD_LENGTH = 2000;

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'Invalid request' });
  }

  if (normalise_(data.passphrase) !== normalise_(PASSPHRASE)) {
    return json_({ ok: false, error: 'Not invited' });
  }

  // Honeypot: real guests never fill this in. Pretend it worked.
  if (data.website) {
    return json_({ ok: true });
  }

  const name = clean_(data.name).replace(/\s+/g, ' ');
  const attending = data.attending === 'Yes' ? 'Yes' : data.attending === 'No' ? 'No' : '';
  if (!name || !attending) {
    return json_({ ok: false, error: 'Missing name or attendance' });
  }

  const yes = attending === 'Yes';
  const partySize = yes ? Math.max(1, Math.min(20, parseInt(data.partySize, 10) || 1)) : '';

  const row = [
    new Date(),
    name,
    attending,
    partySize,
    yes && partySize > 1 ? clean_(data.otherGuests) : '',
    yes ? clean_(data.dietary) : '',
    yes && partySize === 1 ? clean_(data.soloPreference) : '',
    clean_(data.message),
  ];

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'Busy, please try again' });
  }

  try {
    const sheet = getSheet_();
    const existing = findRowByName_(sheet, name);
    if (existing) {
      sheet.getRange(existing, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }
    return json_({ ok: true, updated: Boolean(existing) });
  } catch (err) {
    return json_({ ok: false, error: 'Could not save' });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the /exec URL in a browser just confirms it's alive.
function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint is running.' });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findRowByName_(sheet, name) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const target = normalise_(name);
  const names = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (let i = 0; i < names.length; i++) {
    if (normalise_(names[i][0]) === target) return i + 2;
  }
  return 0;
}

function normalise_(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
}

// Trim, cap length, and stop anything being read by Sheets as a formula.
function clean_(value) {
  let s = String(value == null ? '' : value).trim().slice(0, MAX_FIELD_LENGTH);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Optional: run this once from the editor to create the header row and
// trigger the authorisation prompt before you deploy.
function setup() {
  getSheet_();
}

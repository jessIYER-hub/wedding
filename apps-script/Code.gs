/**
 * Jessica & Gaurav · RSVP endpoint
 *
 * Saves RSVPs from the wedding site into the "RSVPs" tab of our v2 sheet.
 *   - checks the invite code (so the code is never in the website's files)
 *   - one row per lead guest, matched by email: sending again updates the
 *     row and marks it "updated: yes"
 *   - sends the schedule back only after a "yes"
 *
 * See README.md for setup. After editing this file, redeploy:
 * Deploy → Manage deployments → pencil → Version: New version → Deploy.
 */

/* ==========================================================================
   SETTINGS
   ========================================================================== */

const SPREADSHEET_ID = '131QWjZ80biRlVXMk1KLsxmyT1qVcjVH0v7g7zv5WlSA';
const SHEET_NAME = 'RSVPs';

// The invite code from the save-the-date. Capitals and spaces don't matter,
// so "Dark Sugars", "darksugars" and "DARK SUGARS" all work.
const INVITE_CODE = 'dark sugars';

// Shown only to guests who RSVP yes.
const SCHEDULE = {
  title: 'Schedule',
  intro: "Here's the shape of each day.",
  days: [
    { day: 'Saturday 6 November', items: ['Arrivals and check-in', 'High tea', 'Welcome dinner', 'Mehendi'] },
    { day: 'Sunday 7 November', items: ['Haldi during the day', 'Sangeet in the evening, outdoors'] },
    { day: 'Monday 8 November', items: ['The wedding in the morning', 'Reception', 'After-party'] },
    { day: 'Tuesday 9 November', items: ['Check-out by 10:00'] },
  ],
  note: 'Exact timings to follow.',
  lodging: 'Room details to follow.',
  guideUrl: '', // Paste the guest guide link here (starting https://). Hidden while empty.
  guideLabel: 'Our guest guide',
};

const HEADERS = [
  'timestamp',
  'lead guest',
  'email',
  'phone',
  'attending',
  'party size',
  'other guest names',
  'room preference (solo only)',
  'roommate name',
  'pairing preference',
  'dietary/allergies',
  'cot / high chair / mobility',
  'access notes',
  'message for the couple',
  'source (site / manual)',
  'updated (yes/no)',
  'room payment status',
];

/* ==========================================================================
   You shouldn't need to edit below this line.
   ========================================================================== */

const STAY = { own: 'Own room', roommate: 'Roommate in mind', pair: 'Pair with a solo guest' };
const PAIRING = { woman: 'A woman', man: 'A man' };
const HELP = { cot: 'Cot', highchair: 'High chair', mobility: 'Mobility help' };
const MAX_LEN = 2000;

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }
  try {
    if (!codeOk_(data.code)) {
      if (tooManyTries_()) return json_({ ok: false, error: 'slow_down' });
      noteBadTry_();
      Utilities.sleep(600);
      return json_({ ok: false, error: 'bad_code' });
    }
    if (data.action === 'check') return json_({ ok: true });
    if (data.action === 'lookup') return json_(lookup_(data));
    if (data.action === 'rsvp') return json_(save_(data));
    return json_({ ok: false, error: 'bad_request' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet() {
  return json_({ ok: true, message: 'RSVP endpoint is running.' });
}

/* ---------- Invite code ---------- */

function squash_(s) {
  return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, '');
}
function codeOk_(code) {
  return squash_(code) !== '' && squash_(code) === squash_(INVITE_CODE);
}
// Light limit: after 40 wrong codes in 10 minutes (from anyone), wait.
function tooManyTries_() {
  return (parseInt(CacheService.getScriptCache().get('bad-codes'), 10) || 0) >= 40;
}
function noteBadTry_() {
  const cache = CacheService.getScriptCache();
  const n = (parseInt(cache.get('bad-codes'), 10) || 0) + 1;
  cache.put('bad-codes', String(n), 600);
}

/* ---------- Save an RSVP ---------- */

function save_(d) {
  if (d.website) return { ok: true }; // Honeypot: real guests never fill this.

  const name = clean_(d.name).replace(/\s+/g, ' ');
  const email = String(d.email || '').trim().toLowerCase();
  const phone = String(d.phone || '').replace(/[^\d+()\s-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
  const attending = d.attending === 'Yes' ? 'Yes' : d.attending === 'No' ? 'No' : '';
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || phone.replace(/\D/g, '').length < 6 || !attending) {
    return { ok: false, error: 'invalid' };
  }
  const yes = attending === 'Yes';
  const size = yes ? Math.max(1, Math.min(8, parseInt(d.partySize, 10) || 1)) : '';
  const stay = yes && size === 1 ? STAY[d.stay] || '' : '';
  const help = yes ? [].concat(d.help || []).map(function (k) { return HELP[k]; }).filter(Boolean).join(', ') : '';
  const source = d.source === 'test' ? 'test' : 'site';

  const fields = {
    'timestamp': new Date(),
    'lead guest': name,
    'email': email,
    'phone': "'" + phone, // keep the + and leading digits as typed
    'attending': attending,
    'party size': size,
    'other guest names': yes && size > 1 ? clean_(d.others) : '',
    'room preference (solo only)': stay,
    'roommate name': d.stay === 'roommate' && stay ? clean_(d.roommate) : '',
    'pairing preference': d.stay === 'pair' && stay ? PAIRING[d.pairing] || '' : '',
    'dietary/allergies': yes ? clean_(d.dietary) : '',
    'cot / high chair / mobility': help,
    'access notes': yes ? clean_(d.accessNotes) : '',
    'message for the couple': clean_(d.message),
    'source (site / manual)': source,
  };

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  let updated = false;
  try {
    const sheet = sheet_();
    const table = read_(sheet);
    const row = findByEmail_(table, email);
    updated = Boolean(row);
    fields['updated (yes/no)'] = updated ? 'yes' : 'no';
    write_(sheet, table, row, fields); // never touches "room payment status"
  } finally {
    lock.releaseLock();
  }
  return { ok: true, updated: updated, schedule: yes ? SCHEDULE : null };
}

/* ---------- Find an RSVP to edit ---------- */

function lookup_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  if (!email) return { ok: false, error: 'not_found' };
  const table = read_(sheet_());
  const row = findByEmail_(table, email);
  if (!row) return { ok: false, error: 'not_found' };
  const get = function (h) { return String(cell_(table, row, h) == null ? '' : cell_(table, row, h)); };
  const key = function (map, value) {
    return Object.keys(map).filter(function (k) { return map[k] === value; })[0] || '';
  };
  const yes = get('attending') === 'Yes';
  return {
    ok: true,
    rsvp: {
      name: get('lead guest'),
      email: get('email'),
      phone: get('phone').replace(/^'/, ''),
      attending: get('attending'),
      partySize: get('party size'),
      others: get('other guest names'),
      stay: key(STAY, get('room preference (solo only)')),
      roommate: get('roommate name'),
      pairing: key(PAIRING, get('pairing preference')),
      dietary: get('dietary/allergies'),
      help: get('cot / high chair / mobility').split(/,\s*/).map(function (v) { return key(HELP, v); }).filter(Boolean),
      accessNotes: get('access notes'),
      message: get('message for the couple'),
    },
    schedule: yes ? SCHEDULE : null,
  };
}

/* ---------- Sheet helpers ---------- */

// Uses the "RSVPs" tab, making it if needed, always first in the file
// (the dashboard reads the first tab). If the first tab is empty apart from
// a header row, it's reused and renamed rather than leaving a blank tab.
function sheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    const first = ss.getSheets()[0];
    if (first && first.getLastRow() <= 1) {
      sheet = first.setName(SHEET_NAME);
      sheet.clear();
    } else {
      sheet = ss.insertSheet(SHEET_NAME, 0);
    }
  }
  if (sheet.getIndex() !== 1) {
    ss.setActiveSheet(sheet);
    ss.moveActiveSheet(1);
  }
  const width = Math.max(sheet.getLastColumn(), 1);
  const top = sheet.getRange(1, 1, 1, width).getValues()[0].map(function (h) { return String(h).trim(); });
  const missing = HEADERS.filter(function (h) { return top.indexOf(h) < 0; });
  if (sheet.getLastRow() === 0 || top.every(function (h) { return !h; })) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (missing.length) {
    sheet.getRange(1, width + 1, 1, missing.length).setValues([missing]).setFontWeight('bold');
  }
  return sheet;
}

function read_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const values = lastRow ? sheet.getRange(1, 1, lastRow, lastCol).getValues() : [[]];
  const cols = {};
  values[0].forEach(function (h, i) { const k = String(h).trim(); if (k && !(k in cols)) cols[k] = i; });
  const rows = [];
  for (let r = 1; r < values.length; r++) rows.push({ index: r + 1, values: values[r] });
  return { cols: cols, width: lastCol, rows: rows };
}

function cell_(table, row, header) {
  const i = table.cols[header];
  return i === undefined ? '' : row.values[i];
}

function findByEmail_(table, email) {
  let found = null;
  table.rows.forEach(function (row) {
    if (String(cell_(table, row, 'email')).trim().toLowerCase() === email) found = row;
  });
  return found;
}

function write_(sheet, table, row, fields) {
  const values = row ? row.values.slice() : new Array(table.width).fill('');
  Object.keys(fields).forEach(function (h) {
    const i = table.cols[h];
    if (i !== undefined) values[i] = fields[h];
  });
  if (row) sheet.getRange(row.index, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
}

// Trim, cap length, and stop anything being read by Sheets as a formula.
function clean_(v) {
  let s = String(v == null ? '' : v).trim().slice(0, MAX_LEN);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------- For you, in the sheet ---------- */

// Adds a "Wedding" menu to the sheet.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Wedding')
    .addItem('Delete test rows', 'deleteTestRows')
    .addToUi();
}

// Removes every row whose source is "test" (used when we test the form).
function deleteTestRows() {
  const sheet = sheet_();
  const table = read_(sheet);
  table.rows
    .filter(function (row) { return String(cell_(table, row, 'source (site / manual)')) === 'test'; })
    .reverse()
    .forEach(function (row) { sheet.deleteRow(row.index); });
}

// Run once from the editor to authorise the script and set up the tab.
function setup() {
  sheet_();
}

/**
 * Jessica & Gaurav · Wedding website endpoint
 *
 * One Google Apps Script web app, bound to the RSVP Google Sheet, that:
 *
 *   1. Lets guests in. The site sends a full name + phone/email. If that
 *      matches a row whose Attending is "Yes" (or whose Access override is
 *      TRUE), we send back the private page content plus a signed session
 *      token that lasts 30 days.
 *   2. Re-checks a saved session token when a guest comes back, and sends
 *      the content again (so edits here show up without guests logging in).
 *   3. Saves RSVPs from the main site's "Update your RSVP" form. Sending the
 *      same name + contact again updates the existing row, never duplicates.
 *   4. Still accepts RSVPs from the save-the-date site (same sheet).
 *
 * See README.md for deploy steps. After ANY edit here, redeploy:
 * Deploy → Manage deployments → pencil → Version: New version → Deploy.
 */

/* ==========================================================================
   PRIVATE PAGE CONTENT
   Everything guests see on Home, Our Story, Schedule, Travel and Q&A lives
   here, not in the website files, so only guests who are let in ever get it.
   Empty strings and empty lists [] are hidden on the site automatically.
   ========================================================================== */

const CONTENT = {
  home: {
    eyebrow: "We're getting married",
    names: 'Jessica & Gaurav',
    dates: '6, 7 and 8 November 2027',
    venue: 'Royal Retreat Resort and Spa in Udaipur, Rajasthan',
    welcome:
      "We're so happy you'll be with us. Everything you need for our three days in Udaipur is here, and we'll keep adding to it as plans come together.",
    heroImage: 'assets/hero.jpg',
    heroAlt: 'Jessica and Gaurav hugging on a bridge in Central Park at golden hour',
    heroFocus: '50% 68%', // which part of the photo to keep when it's cropped
    // The countdown counts down to this moment. +05:30 is India time.
    countdownTarget: '2027-11-06T12:00:00+05:30',
    countdownLabel: 'Until we celebrate together',
    countdownUnits: { days: 'Days', hours: 'Hours', mins: 'Mins', secs: 'Secs' },
    countdownDone: "It's here. We can't wait to see you.",
  },

  // Do not edit the story text casually: it's exactly as Jessica & Gaurav wrote it.
  story: {
    heading: 'Our Story',
    blocks: [
      {
        text: 'We met at university in 2018 and hit it off straight away. Friendship soon became something more, and our first date was over hot chocolate.',
        // frame: 'polaroid' or 'strip'. focus: which part of a photo to keep when cropped.
        frame: 'polaroid',
        photos: [{ src: 'assets/story-1.jpg', alt: 'Jessica laughing as Gaurav hugs her on a wooden bench', caption: '', focus: '50% 50%' }],
      },
      {
        text: 'Life took us in different directions for a while, but in 2021, a message about that hot chocolate led to a second "first date". As we caught up, we discovered that London, for all its size, had tucked us just around the corner from each other. That corner of the city has been home ever since. It\'s where we found each other again, and where two separate homes eventually became one.',
        frame: 'strip',
        photos: [
          { src: 'assets/story-2.jpg', alt: 'Walking up stone steps hand in hand', focus: '50% 62%' },
          { src: 'assets/story-3.jpg', alt: 'Smiling at each other under the trees by a lamppost', focus: '45% 60%' },
        ],
      },
      {
        text: "Five years together have turned those early feelings into a deeper love. On a work trip to New York, a proposal in Central Park began our next chapter. Now we're planning our wedding, and we would love for you to be part of it.",
        frame: 'polaroid',
        photos: [{ src: 'assets/story-4.jpg', alt: 'A kiss by the lake in Central Park', caption: '', focus: '50% 58%' }],
      },
    ],
  },

  schedule: {
    heading: 'Schedule',
    intro: "Here's how our three days will go.",
    toFollowLabel: 'Details to follow',
    dressCodeLabel: 'Dress code',
    days: [
      {
        weekday: 'Saturday',
        date: '6 November',
        dressCode: '', // e.g. 'Indian festive'. Hidden while empty.
        events: [
          { name: 'Arrival and check-in', when: '', note: '', toFollow: true },
          { name: 'High tea', when: '', note: '', toFollow: true },
          { name: 'Welcome dinner', when: '', note: "Beer and wine. We'll finish by 10pm.", toFollow: true },
          { name: 'Mehendi', when: '', note: 'Also part of our first stretch of celebrations.', toFollow: true },
        ],
      },
      {
        weekday: 'Sunday',
        date: '7 November',
        dressCode: '',
        events: [
          { name: 'Haldi', when: 'During the day', note: '', toFollow: true },
          {
            name: 'Sangeet',
            when: 'From around sunset',
            note: "Outdoors, with cocktails. An evening of performances and celebration rather than a late-night party. We'll finish around 10pm.",
            toFollow: false,
          },
        ],
      },
      {
        weekday: 'Monday',
        date: '8 November',
        dressCode: '',
        events: [
          { name: 'Wedding ceremony', when: 'In the morning', note: '', toFollow: true },
          { name: 'Reception', when: '', note: '', toFollow: true },
          { name: 'After-party', when: '', note: '', toFollow: true },
        ],
      },
    ],
    note: "Timings may shift a little as we finalise everything. We'll update this page.",
  },

  travel: {
    heading: 'Travel & Stay',
    intro: "Everything we know so far about getting to Udaipur and staying with us. We'll add more as it's confirmed.",

    venue: {
      label: "Where we'll be",
      name: 'Royal Retreat Resort and Spa',
      place: 'Udaipur, Rajasthan',
      website: 'https://royalretreatudaipur.in',
      websiteLabel: "The hotel's website",
      mapUrl: '', // e.g. a Google Maps link. Hidden while empty.
      mapLabel: 'Open in maps',
    },

    gettingThere: {
      title: 'Getting there',
      text: "We aren't arranging transport from the airport or train station, so please make your own way to the hotel. To make it easy, we'll share a few taxi drivers we trust, with fixed prices. Our hospitality starts the moment you arrive at the hotel.",
      taxisTitle: 'Taxis we trust',
      // Each: { name: 'Name', phone: '+91 ...', note: 'Fixed price from the airport' }. Hidden while empty.
      taxis: [],
    },

    stay: {
      title: 'Your stay',
      text: "Check-in is on Saturday 6 November and checkout is on Tuesday 9 November. We can't promise early check-in or late checkout yet, so please plan around those dates for now.",
      rooms: 'Room details to follow',
    },

    nearby: {
      title: 'Nearby in Udaipur',
      // Each: { name: 'Place', note: 'A line about it', url: '' }. Hidden while empty.
      items: [],
    },

    holiday: {
      title: 'Making a holiday of it?',
      text: "If you're turning this into a bigger trip, we'd suggest travelling before the wedding rather than after. That way you can experience Diwali in India. Once the wedding is over it's peak wedding season, so hotels and travel can be harder to arrange.",
    },

    inspiration: {
      title: 'Ideas, if you want them',
      intro: "Just suggestions, not a plan. Go wherever you fancy.",
      groups: [
        {
          title: 'In Udaipur',
          items: [
            { name: 'The City Palace', note: 'Right on the water, and worth an unhurried visit.' },
            { name: 'The lakes', note: 'Lake Pichola and Fateh Sagar are lovely for a slow afternoon.' },
          ],
        },
        {
          title: 'Further afield',
          items: [
            { name: 'Jaipur', note: 'The Pink City, with forts, palaces and bazaars.' },
            { name: 'Agra', note: 'Home of the Taj Mahal.' },
            { name: 'Mumbai', note: 'Big, busy and brilliant, right by the sea.' },
            { name: 'Goa', note: 'Beaches and a slower pace.' },
            { name: 'Kerala', note: 'Backwaters, greenery and calm.' },
          ],
        },
      ],
      tip: 'Pro tip: wherever you end up, message Jessica for food recommendations first.',
    },
  },

  faqs: {
    heading: 'Q&A',
    intro: "The things we think you'll ask. If we've missed something, just ask us.",
    items: [
      {
        q: "Who's invited, and can I bring someone?",
        a: "Your invitation is for the people named on it. We've kept things close, and we hope you understand.",
      },
      {
        q: 'Can I bring children?',
        a: "Yes please, we'd love that. Their names should be on your invitation, so there are no surprises.",
      },
      {
        q: 'What will we eat?',
        a: 'The whole wedding is vegetarian. If you have any allergies, let us know in your RSVP.',
      },
      {
        q: "What's the weather like in November?",
        a: 'Days are pleasant and evenings get cooler, so bring a light shawl or layer for the evenings.',
      },
      {
        q: 'Can I change my RSVP?',
        a: "Not here, sorry. Please get in touch with us directly and we'll take care of it.",
      },
      {
        q: 'Who do I contact with questions?',
        a: 'Either of us, any time.',
        showContacts: true,
      },
    ],
    // Each: { name: 'Jessica', phone: '+44 ...', email: '' }. Hidden while empty.
    contacts: [],
  },
};

/* ==========================================================================
   SETTINGS
   ========================================================================== */

const SHEET_NAME = 'RSVPs';

// How long a guest stays signed in on their device.
const SESSION_DAYS = 30;

// Lets the save-the-date site keep sending RSVPs into the same sheet.
// Must match GUEST_PASSPHRASE in save-the-date/script.js.
const SAVE_THE_DATE_PASSPHRASE = 'forever';

// Light rate limiting: after this many failed sign-in attempts for the same
// name or the same phone/email, further attempts are refused for a while.
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_WINDOW_SECONDS = 15 * 60;

const HEADERS = [
  'Timestamp',
  'Name',
  'Contact',
  'Attending',
  'Party size',
  'Other guests',
  'Dietary/allergies',
  'Solo room preference',
  'Pairing gender',
  'Roommate name',
  'Message',
  'Access override',
];

// Must match the solo options in script.js (CONFIG.rsvp.solo.options).
const SOLO_OWN = 'My own room';
const SOLO_SHARE = 'I already have someone to share with';
const SOLO_PAIR = 'Pair me with another solo guest';

const MAX_FIELD_LENGTH = 2000;
const MAX_PARTY = 20;

/* ==========================================================================
   You shouldn't need to edit below this line.
   ========================================================================== */

function doPost(e) {
  let data;
  try {
    data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'bad_request' });
  }
  if (!data || typeof data !== 'object') return json_({ ok: false, error: 'bad_request' });

  try {
    switch (data.action) {
      case 'login':
        return json_(handleLogin_(data));
      case 'session':
        return json_(handleSession_(data));
      case 'rsvp':
        return json_(handleRsvp_(data));
      default:
        // The save-the-date site posts without an action, with its passphrase.
        if (data.passphrase !== undefined) return json_(handleSaveTheDateRsvp_(data));
        return json_({ ok: false, error: 'bad_request' });
    }
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

// Opening the /exec URL in a browser just confirms it's alive. No content here.
function doGet() {
  return json_({ ok: true, message: 'Wedding site endpoint is running.' });
}

// Run once from the editor: authorises the script, creates the session secret,
// and creates (or tidies up) the header row.
function setup() {
  secret_();
  withLock_(function () {
    ensureHeaders_(getSheet_());
  });
}

/* ---------- Sign in ---------- */

function handleLogin_(data) {
  const name = normName_(data.name);
  const contact = normContact_(data.contact);
  if (!name || !contact) return { ok: false, error: 'no_match' };

  if (isRateLimited_(name, contact)) return { ok: false, error: 'slow_down' };

  const guest = findGuest_(name, contact);
  if (!guest || !guest.allowed) {
    recordFailure_(name, contact);
    Utilities.sleep(700); // Make guessing slow and the reply time uninformative.
    return { ok: false, error: 'no_match' };
  }
  return welcome_(name, contact, guest, null);
}

function handleSession_(data) {
  const session = readToken_(data.token);
  if (!session) return { ok: false, error: 'signed_out' };
  const guest = findGuest_(session.n, session.c);
  if (!guest || !guest.allowed) return { ok: false, error: 'signed_out' };
  // Keep the original expiry: a session lasts 30 days from sign-in.
  return welcome_(session.n, session.c, guest, { token: data.token, exp: session.exp });
}

function welcome_(name, contact, guest, existing) {
  const session = existing || makeToken_(name, contact);
  return {
    ok: true,
    token: session.token,
    expires: session.exp,
    content: CONTENT,
    guest: guest.rsvp,
  };
}

/* ---------- RSVP from the main site (signed-in guests only) ---------- */

function handleRsvp_(data) {
  const session = readToken_(data.token);
  if (!session) return { ok: false, error: 'signed_out' };

  if (data.website) return { ok: true }; // Honeypot

  const name = clean_(data.name).replace(/\s+/g, ' ');
  const contactRaw = clean_(data.contact);
  const contact = normContact_(contactRaw);
  const attending = data.attending === 'Yes' ? 'Yes' : data.attending === 'No' ? 'No' : '';
  if (!normName_(name) || !contact || !attending) return { ok: false, error: 'invalid' };

  const yes = attending === 'Yes';
  const partySize = yes ? Math.max(1, Math.min(MAX_PARTY, parseInt(data.partySize, 10) || 1)) : '';
  const solo = yes && partySize === 1 ? [SOLO_OWN, SOLO_SHARE, SOLO_PAIR].indexOf(data.soloPreference) : -1;
  if (yes && partySize === 1 && solo < 0) return { ok: false, error: 'invalid' };

  const fields = {
    Timestamp: new Date(),
    Name: name,
    Contact: contactRaw,
    Attending: attending,
    'Party size': partySize,
    'Other guests': yes && partySize > 1 ? clean_(data.otherGuests) : '',
    'Dietary/allergies': yes ? clean_(data.dietary) : '',
    'Solo room preference': solo >= 0 ? data.soloPreference : '',
    'Pairing gender': solo === 2 ? clean_(data.pairingGender) : '',
    'Roommate name': solo === 1 ? clean_(data.roommateName) : '',
    Message: clean_(data.message),
  };

  withLock_(function () {
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    const table = readTable_(sheet);
    // Same name + contact → that row. Otherwise the signed-in guest's own row
    // (they may have changed their phone or spelling). Otherwise a new row.
    let row = findRow_(table, normName_(name), contact, true);
    if (!row) row = findRow_(table, session.n, session.c, false);
    writeRow_(sheet, table, row, fields);
  });

  const nName = normName_(name);
  const guest = findGuest_(nName, contact);
  if (guest && guest.allowed) {
    const fresh = makeToken_(nName, contact);
    return { ok: true, attending: attending, token: fresh.token, expires: fresh.exp, guest: guest.rsvp };
  }
  return { ok: true, attending: attending, token: null };
}

/* ---------- RSVP from the save-the-date site ---------- */

function handleSaveTheDateRsvp_(data) {
  if (normPlain_(data.passphrase) !== normPlain_(SAVE_THE_DATE_PASSPHRASE)) {
    return { ok: false, error: 'Not invited' };
  }
  if (data.website) return { ok: true }; // Honeypot

  const name = clean_(data.name).replace(/\s+/g, ' ');
  const attending = data.attending === 'Yes' ? 'Yes' : data.attending === 'No' ? 'No' : '';
  if (!name || !attending) return { ok: false, error: 'Missing name or attendance' };

  const yes = attending === 'Yes';
  const partySize = yes ? Math.max(1, Math.min(MAX_PARTY, parseInt(data.partySize, 10) || 1)) : '';
  // The save-the-date form has no contact field, so Contact is left untouched.
  const fields = {
    Timestamp: new Date(),
    Name: name,
    Attending: attending,
    'Party size': partySize,
    'Other guests': yes && partySize > 1 ? clean_(data.otherGuests) : '',
    'Dietary/allergies': yes ? clean_(data.dietary) : '',
    'Solo room preference': yes && partySize === 1 ? clean_(data.soloPreference) : '',
    Message: clean_(data.message),
  };

  let updated = false;
  withLock_(function () {
    const sheet = getSheet_();
    ensureHeaders_(sheet);
    const table = readTable_(sheet);
    const row = findRowByNameOnly_(table, normName_(name));
    updated = Boolean(row);
    writeRow_(sheet, table, row, fields);
  });
  return { ok: true, updated: updated };
}

/* ---------- Looking guests up ---------- */

// Returns { allowed, rsvp } for a normalised name + contact, or null.
function findGuest_(nName, contactKey) {
  const table = readTable_(getSheet_());
  let latest = null;
  let override = false;
  table.rows.forEach(function (row) {
    if (normName_(cell_(table, row, 'Name')) !== nName) return;
    if (contactKeys_(cell_(table, row, 'Contact')).indexOf(contactKey) < 0) return;
    if (isTrue_(cell_(table, row, 'Access override'))) override = true;
    latest = row; // Lower rows are newer.
  });
  if (!latest) return null;

  const attendingYes = /^\s*yes/i.test(String(cell_(table, latest, 'Attending')));
  return {
    allowed: override || attendingYes,
    rsvp: {
      name: String(cell_(table, latest, 'Name')),
      contact: String(cell_(table, latest, 'Contact')),
      attending: attendingYes ? 'Yes' : /^\s*no/i.test(String(cell_(table, latest, 'Attending'))) ? 'No' : '',
      partySize: cell_(table, latest, 'Party size'),
      otherGuests: String(cell_(table, latest, 'Other guests')),
      dietary: String(cell_(table, latest, 'Dietary/allergies')),
      soloPreference: String(cell_(table, latest, 'Solo room preference')),
      pairingGender: String(cell_(table, latest, 'Pairing gender')),
      roommateName: String(cell_(table, latest, 'Roommate name')),
      message: String(cell_(table, latest, 'Message')),
    },
  };
}

// Newest row with this name and contact. With allowBlankContact, a row with
// the same name and NO contact (e.g. from the save-the-date) also counts.
function findRow_(table, nName, contactKey, allowBlankContact) {
  let exact = null;
  let blank = null;
  table.rows.forEach(function (row) {
    if (normName_(cell_(table, row, 'Name')) !== nName) return;
    const keys = contactKeys_(cell_(table, row, 'Contact'));
    if (keys.indexOf(contactKey) >= 0) exact = row;
    else if (allowBlankContact && keys.length === 0) blank = row;
  });
  return exact || blank;
}

function findRowByNameOnly_(table, nName) {
  let found = null;
  table.rows.forEach(function (row) {
    if (normName_(cell_(table, row, 'Name')) === nName) found = row;
  });
  return found;
}

/* ---------- Sheet helpers ---------- */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

// Reads the whole sheet once. Columns are found by header name, so it's fine
// if you add your own columns or reorder them.
function readTable_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { cols: {}, width: 0, rows: [] };
  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const cols = {};
  values[0].forEach(function (h, i) {
    const key = String(h).trim();
    if (key && !(key in cols)) cols[key] = i;
  });
  const rows = [];
  for (let r = 1; r < values.length; r++) rows.push({ index: r + 1, values: values[r] });
  return { cols: cols, width: lastCol, rows: rows };
}

function cell_(table, row, header) {
  const i = table.cols[header];
  return i === undefined ? '' : row.values[i];
}

// Updates only the given columns, so anything else on the row (like a TRUE
// in Access override, or your own notes columns) is kept.
function writeRow_(sheet, table, row, fields) {
  const values = row ? row.values.slice() : new Array(table.width).fill('');
  Object.keys(fields).forEach(function (header) {
    const i = table.cols[header];
    if (i !== undefined) values[i] = fields[header];
  });
  if (row) sheet.getRange(row.index, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);
}

// Makes sure the header row matches HEADERS (in that order). An older sheet
// from the save-the-date (without Contact etc.) is rearranged in place, keeping
// every answer. Any extra columns you've added are kept after ours.
function ensureHeaders_(sheet) {
  const table = readTable_(sheet);
  const current = table.width ? sheet.getRange(1, 1, 1, table.width).getValues()[0].map(function (h) {
    return String(h).trim();
  }) : [];
  const inOrder = HEADERS.every(function (h, i) { return current[i] === h; });
  if (inOrder) return;

  const extras = current.filter(function (h) { return h && HEADERS.indexOf(h) < 0; });
  const headers = HEADERS.concat(extras);
  const out = [headers];
  table.rows.forEach(function (row) {
    out.push(headers.map(function (h) { return cell_(table, row, h); }));
  });
  sheet.clearContents();
  sheet.getRange(1, 1, out.length, headers.length).setValues(out);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/* ---------- Matching ---------- */

// "  Jessica   O'Brien-Smith " and "jessica o brien smith" match.
function normName_(value) {
  return String(value == null ? '' : value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

// Emails: lower case, no spaces. Phones: digits only, compared on the last 10
// digits so "+44 7700 900123", "07700900123" and "447700900123" all match.
function normContact_(value) {
  const s = String(value == null ? '' : value).trim().toLowerCase();
  if (!s) return '';
  if (s.indexOf('@') >= 0) {
    const email = s.replace(/\s+/g, '');
    return /^[^@]+@[^@]+\.[^@]+$/.test(email) ? 'e:' + email : '';
  }
  const digits = s.replace(/\D/g, '');
  if (digits.length < 7) return '';
  return 'p:' + digits.slice(-10);
}

// A Contact cell might hold more than one, e.g. "07700 900123 / jess@example.com".
function contactKeys_(value) {
  return String(value == null ? '' : value)
    .split(/[\n,;|]|\s\/\s|\s+or\s+/i)
    .map(normContact_)
    .filter(Boolean);
}

function normPlain_(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function isTrue_(value) {
  return value === true || /^\s*(true|yes|y|1)\s*$/i.test(String(value));
}

/* ---------- Rate limiting ---------- */

function failKeys_(name, contact) {
  return ['fail:n:' + hash_(name), 'fail:c:' + hash_(contact)];
}

function isRateLimited_(name, contact) {
  const cache = CacheService.getScriptCache();
  return failKeys_(name, contact).some(function (k) {
    return (parseInt(cache.get(k), 10) || 0) >= MAX_FAILED_ATTEMPTS;
  });
}

function recordFailure_(name, contact) {
  const cache = CacheService.getScriptCache();
  failKeys_(name, contact).forEach(function (k) {
    const n = (parseInt(cache.get(k), 10) || 0) + 1;
    cache.put(k, String(n), FAILED_WINDOW_SECONDS);
  });
}

function hash_(s) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
  );
}

/* ---------- Session tokens ---------- */

// The secret is created once and kept in Script Properties. Deleting or
// changing TOKEN_SECRET signs every guest out.
function secret_() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('TOKEN_SECRET');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('TOKEN_SECRET', s);
  }
  return s;
}

function sign_(body) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(body, secret_()));
}

function makeToken_(nName, contactKey) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const body = Utilities.base64EncodeWebSafe(JSON.stringify({ n: nName, c: contactKey, exp: exp }), Utilities.Charset.UTF_8);
  return { token: body + '.' + sign_(body), exp: exp };
}

function readToken_(token) {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  if (!safeEqual_(sign_(parts[0]), parts[1])) return null;
  let payload;
  try {
    payload = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString('UTF-8'));
  } catch (err) {
    return null;
  }
  if (!payload || typeof payload.n !== 'string' || typeof payload.c !== 'string') return null;
  if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  return payload;
}

function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ---------- Output ---------- */

// Trim, cap length, and stop anything being read by Sheets as a formula.
function clean_(value) {
  let s = String(value == null ? '' : value).trim().slice(0, MAX_FIELD_LENGTH);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

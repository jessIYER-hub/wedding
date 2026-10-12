# Jessica & Gaurav · Save the Date

A small, static save-the-date site: plain HTML, CSS and vanilla JS. No framework, no build step. Open `index.html` in a browser, or host the folder anywhere that serves static files.

```
index.html          the three screens + RSVP form
styles.css          all styling; colours and fonts are CSS variables in :root
script.js           all copy and settings in one block at the top
assets/             photo strip crops (strip-1.jpg … strip-6.jpg) and the paper texture
assets/engagement/  the full engagement photos, web-sized
apps-script/Code.gs Google Apps Script that writes RSVPs into a Google Sheet
```

The guest passphrase is **dark sugars** (our first-date hot chocolate place). Capitals, spaces and punctuation don't matter, so "Dark Sugars" and "darksugars" both work.

## How it's laid out

Each of the three screens is a **9:16 card**, the shape of a phone screen. Everything inside a card is sized as a share of the card's width, so the whole design scales together and nothing is ever cut off, whatever the phone. On taller phones there's a little extra paper above and below; on tablets and laptops the card sits in the middle like a printed invitation on linen.

The RSVP form opens as a sheet that slides up over the card, with its own scrolling, so it never pushes anything off screen.

---

## Editing the words

Every line of copy is in the `CONFIG` object at the top of `script.js`: names, the gate, each screen, every form label and hint, the thank-you messages and the sign-off. Change the text between the quotes and save. Nothing else needs touching.

## Swapping the photos

The strips use square crops of our engagement photos:

| File | Photo | Where it shows |
| --- | --- | --- |
| `strip-1.jpg` | holding each other on the bridge | first screen, inside the arch |
| `strip-2.jpg` | laughing on the bench | first screen, inside the arch |
| `strip-3.jpg` | forehead kiss by the lake | first screen, inside the arch |
| `strip-4.jpg` | walking up the steps hand in hand | save-the-date screen, tilted strip |
| `strip-5.jpg` | smiling at each other by the lamppost | save-the-date screen, tilted strip |
| `strip-6.jpg` | the ring | save-the-date screen, tilted strip |

The first strip is the two of us close up; the second tells the story from walking together to the ring. Each photo is used once.

To use a different photo, save a crop at **10:9** (600×540px is ideal, under ~150 KB) over one of these files. Photos are shown exactly as they are, in full colour.

## Adding the flowers / ribbon

The save-the-date screen has two empty slots for your artwork. Drop transparent PNGs into `assets/` and set their paths in `script.js`:

```js
decor: {
  flowers: "assets/flowers.png",
  ribbon:  "assets/ribbon.png",
},
```

Position and size them in `styles.css` under `.decor-slot--flowers` and `.decor-slot--ribbon`.

## Changing colours and fonts

All colours are CSS variables at the top of `styles.css`: the ivory paper, the blues (`--navy`, `--royal`, `--dusty-blue` and friends, taken from our engagement outfits), the gold line work (`--gold`). The garland, arches, countdown, lockets and buttons all pick their colours up from these. The soft paper grain is `assets/paper-texture.png`. Fonts are `--font-script` (Cormorant Garamond in italic, for the names and headings) and `--font-serif` (Cormorant Garamond, for everything else), loaded from Google Fonts in `index.html`.

## Countdown date

At the top of `script.js`:

```js
const WEDDING_START = "2027-11-06T17:00:00+05:30";
```

That's 5pm on 6 November, Udaipur time (`+05:30` is India's offset). Every guest counts down to the same moment, wherever they are.

## The big reveal (venue)

On the third screen an arch draws itself in gold, **6 · 7 · 8 November 2027** fades in, and then **Royal Retreat Resort & Spa** is written in, left to right, with Udaipur underneath. No tapping needed.

- The dates are `CONFIG.reveal.days` and `CONFIG.reveal.month`.
- The venue is `CONFIG.venue.name`. `CONFIG.venue.city` (Udaipur) appears underneath. You can also add `CONFIG.venue.url` for a link to the resort's website.
- Set `const REVEAL_VENUE = false;` to hide the venue again. The arch then shows the dates and the line "Somewhere beautiful, and we can't wait to tell you." Anything in `script.js` can be read by anyone who opens the page source, so if you ever need it truly hidden, empty the venue fields too.

## Petals (optional)

All the decoration is original SVG/CSS, no image files: the toran garland across the top of the first screen, the arch frames, the scalloped oval and the J & G heart lockets. Optional drifting petals are switched off; set `CONFIG.decor.petals` in `script.js` to a number (e.g. `8`) to turn some on.

## The guest passphrase (please read)

The first thing guests see is a box asking for the word you've shared with them. Once they get it right, their browser remembers it, so they're not asked again.

**Be aware this is a curtain, not a lock.** The passphrase lives in `script.js`, so anyone who knows how to view a page's source can find it, and the page content is in the HTML. It keeps casual visitors and link-forwarding out, and stops search engines (there's also a `noindex` tag), but it isn't real security. Don't put anything genuinely private on the site.

The Apps Script also refuses any RSVP that doesn't include the passphrase, so randoms can't fill your sheet by poking the endpoint directly.

To change it, update **both**:
- `GUEST_PASSPHRASE` in `script.js`
- `PASSPHRASE` in `apps-script/Code.gs` (then redeploy, see step 7 below)

It isn't case sensitive.

---

## Connecting the RSVP form to Google Sheets

The form posts straight into a Google Sheet through a tiny Google Apps Script web app.

1. **Create the sheet.** Go to [sheets.new](https://sheets.new) and name it something like "Wedding RSVPs".
2. **Open Apps Script.** In the sheet: **Extensions → Apps Script**.
3. **Paste the code.** Delete what's in `Code.gs` in the editor and paste the whole of `apps-script/Code.gs` from this repo. Check `PASSPHRASE` matches `script.js`. Click **Save** (the disk icon).
4. **Authorise it (optional but tidy).** Choose `setup` in the function dropdown and click **Run**. Google will ask for permission to manage your spreadsheets: click through (**Advanced → Go to … (unsafe)** is normal for your own script). This creates an `RSVPs` tab with the header row:
   `Timestamp | Name | Attending | Party size | Other guests | Dietary/allergies | Solo room preference | Message`
5. **Deploy as a web app.** **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**. Set:
   - Description: `RSVP`
   - **Execute as: Me**
   - **Who has access: Anyone**

   Click **Deploy**, and authorise if asked.
6. **Copy the URL.** Copy the **Web app URL** (it ends in `/exec`) and paste it into `script.js`:
   ```js
   const RSVP_ENDPOINT = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
   You can check it's alive by opening that URL in a browser: you should see `{"ok":true,...}`.
7. **If you change the script later**, go to **Deploy → Manage deployments**, click the pencil on your deployment, pick **Version: New version**, and **Deploy**. This keeps the same URL. (Creating a *new* deployment gives you a new URL, which you'd then need to paste into `script.js` again.)

### What lands in the sheet

- **Attending "No"**: party size, other guests, dietary and room preference are left blank.
- **Party of 1**: "Solo room preference" holds their choice. Larger parties never see that question, so it stays blank.
- **Updating an answer**: if someone submits again **with the same name** (ignoring capitals and extra spaces), their **existing row is overwritten** with the new answer and a fresh timestamp. No duplicate rows. If they spell their name differently the second time, you'll get a second row, so it's worth a glance before you finalise numbers.

### How the request works (CORS)

The form sends JSON as `text/plain`, which browsers treat as a "simple" request, so there's no preflight that Apps Script can't answer. Google replies via a redirect that allows cross-origin reads, so the site can see whether the save worked and shows a gentle error if it didn't. If a browser still blocks reading the reply, the site re-sends in `no-cors` mode; because rows are matched by name, that can never create a duplicate.

---

## Hosting

### Netlify Drop (easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole project folder onto the page.
3. You get a live link straight away. Sign in to keep it and to pick a nicer name under **Site settings → Change site name**.

To update, drag the folder onto the **Deploys** tab of your site.

### GitHub Pages

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, pick your branch (e.g. `main`) and the `/ (root)` folder, then **Save**.
4. After a minute your site is at `https://<username>.github.io/<repo>/`.

Note that on GitHub Pages a public repo makes all the files, including `script.js` with the passphrase, visible on GitHub. A private repo needs a paid GitHub plan for Pages; Netlify Drop avoids this entirely.

---

## Small details

- Screens snap as you scroll. On the first screen, tap anywhere or swipe up to move on.
- Animations are slow and soft: the names write themselves in, the arch draws itself, the strip slides down, the garland sways, the venue is written in and the countdown ticks.
- For anyone with "Reduce Motion" turned on in their phone settings, things still fade in gently, but nothing slides or sways.
- Works offline from a file for previewing, except the RSVP (needs the endpoint) and the fonts (need a connection).

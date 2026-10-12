# Jessica & Gaurav · Save the Date

> **Note:** this site now shares one Apps Script with the main wedding site. Use `apps-script/Code.gs` at the **root of the repo** (it still accepts this form's RSVPs, passphrase and all), and follow the setup steps in the root `README.md`. The old copy that lived here has been removed so the wrong one can't be deployed.

A small, static save-the-date site: plain HTML, CSS and vanilla JS. No framework, no build step. Open `index.html` in a browser, or host the folder anywhere that serves static files.

```
index.html          the three screens + RSVP form
styles.css          all styling; colours and fonts are CSS variables in :root
script.js           all copy and settings in one block at the top
assets/             placeholder photos (strip-1.jpg … strip-6.jpg)
apps-script/Code.gs Google Apps Script that writes RSVPs into a Google Sheet
```

The default guest passphrase is **`forever`**. Change it before you share the link (see below).

---

## Editing the words

Every line of copy is in the `CONFIG` object at the top of `script.js`: names, the gate, each screen, every form label and hint, the thank-you messages and the sign-off. Change the text between the quotes and save. Nothing else needs touching.

## Swapping the photos

Replace the files in `assets/` with your own, keeping the same names:

| File | Where it shows |
| --- | --- |
| `strip-1.jpg`, `strip-2.jpg`, `strip-3.jpg` | photo strip inside the frame on the first screen |
| `strip-4.jpg`, `strip-5.jpg`, `strip-6.jpg` | tilted strip on the save-the-date screen |

Landscape photos (about 4:3) fit best. They get the same soft, warm film look as the main site (`--photo-filter` in `styles.css`). Around 800px wide is plenty; keep them under ~300 KB each so the site loads quickly on phones.

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

Colours and fonts come from the **SHARED THEME** block at the top of `styles.css`, which is identical to the one in the main site's `styles.css`. Fonts are `--font-display` (Instrument Serif) and `--font-sans` (Inter). See the root README.

## Countdown date

At the top of `script.js`:

```js
const WEDDING_START = "2027-11-06T12:00:00+00:00";
```

The `+00:00` is the time zone offset. Once you know where you're getting married, change it to the venue's offset (for example `+05:30` or `+01:00`) and adjust the time if you like.

## The big reveal (venue)

While `REVEAL_VENUE = false` the details screen shows "Somewhere beautiful, and we can't wait to tell you." When you're ready:

1. Fill in `CONFIG.venue.name`, `CONFIG.venue.city` and `CONFIG.venue.url` in `script.js`.
2. Set `const REVEAL_VENUE = true;`
3. Re-upload the site.

Keep the venue fields empty until then: anything in `script.js` can be read by anyone who opens the page source.

## Music (optional)

Put an mp3 in `assets/` and set `music.src` in `script.js` (e.g. `"assets/our-song.mp3"`). A small button appears in the top corner. It's off by default; music only plays when a guest taps it.

---

## The guest passphrase (please read)

The first thing guests see is a box asking for the word you've shared with them. Once they get it right, their browser remembers it, so they're not asked again.

**Be aware this is a curtain, not a lock.** The passphrase lives in `script.js`, so anyone who knows how to view a page's source can find it, and the page content is in the HTML. It keeps casual visitors and link-forwarding out, and stops search engines (there's also a `noindex` tag), but it isn't real security. Don't put anything genuinely private on the site.

The Apps Script also refuses any RSVP that doesn't include the passphrase, so randoms can't fill your sheet by poking the endpoint directly.

To change it, update **both**:
- `GUEST_PASSPHRASE` in `script.js`
- `SAVE_THE_DATE_PASSPHRASE` in the root `apps-script/Code.gs` (then redeploy, see the root README)

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
- Animations are slow and soft, and are switched off completely for anyone with "reduce motion" turned on in their device settings.
- Works offline from a file for previewing, except the RSVP (needs the endpoint) and the fonts (need a connection).

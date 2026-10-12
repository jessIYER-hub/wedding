# Jessica & Gaurav · Wedding website

The main wedding site, linked from the formal invitations. Plain HTML, CSS and vanilla JS. No framework, no build step.

Only guests whose RSVP says **Yes** can see it. The site files contain no wedding details at all: a guest signs in with their name and the phone or email they RSVP'd with, a Google Apps Script checks the RSVP sheet, and only then sends the page content back.

```
index.html            page shell: sign-in screen, menu, empty sections
styles.css            all styling; colours and fonts are CSS variables in :root
script.js             public copy (sign-in screen, menu, RSVP form) + the endpoint URL
_redirects            stops Netlify serving apps-script/ (private content)
assets/               hero.jpg, story-1.jpg … story-4.jpg (placeholders)
apps-script/Code.gs   the Apps Script: private page content, sign-in, RSVPs
save-the-date/        the earlier save-the-date site (unchanged, see its own README)
```

---

## Where the words live

There are two places, on purpose:

| What | Where | Who can read it |
| --- | --- | --- |
| Home, Our Story, Schedule, Travel & Stay, Q&A | `CONTENT` at the top of `apps-script/Code.gs` | Only signed-in guests |
| Sign-in screen, menu labels, RSVP form, footer | `CONFIG` at the top of `script.js` | Anyone (it's public) |

Change the text between the quotes and save. **After editing `Code.gs` you must redeploy it** (see step 7 below), otherwise the site keeps showing the old words.

A few handy bits in `CONTENT`:

- Anything left as `''` or `[]` is hidden on the site. Examples: `dressCode` for each day, `mapUrl`, the taxi list (`travel.gettingThere.taxis`), nearby places (`travel.nearby.items`) and the contact list for the Q&A (`faqs.contacts`).
- In the schedule, `toFollow: true` shows a little "Details to follow" tag on that event. Set it to `false` once you know the details, and fill in `when` and `note`.
- The Our Story text is exactly as you wrote it. Edit it only if you mean to.

Don't put anything in `script.js` that you want kept private. Anyone can read that file.

## Swapping the photos

These are already our engagement photos. To change one, replace the file in `assets/` and keep the same name:

| File | Where it shows | Best shape |
| --- | --- | --- |
| `hero.jpg` | arched frame on the home page | portrait, about 4:5 |
| `story-1.jpg` | polaroid next to the first paragraph | portrait, about 5:6 |
| `story-2.jpg`, `story-3.jpg` | photo-booth strip next to the second paragraph | landscape, about 4:3 |
| `story-4.jpg` | polaroid next to the third paragraph | portrait, about 5:6 |

Around 1200px on the long side is plenty. Keep each under ~300 KB so the site loads quickly on phones. To add a handwritten caption under a polaroid, set `caption` for that photo in `CONTENT.story`. Set `alt` to a short description for screen readers. When a photo is cropped to fit its frame, `focus` (e.g. `'50% 60%'`, across then down) chooses which part is kept. For the home photo it's `heroFocus`.

## The look (shared with the save-the-date)

The style comes from our engagement photos: navy from the dress and shirt, linen and park-stone neutrals, leafy sage greens, and golden-hour light. You'll see it as a warm sun glow in the top corner, a fine film grain, and photos with a soft, warm film finish. The motifs are all original line drawings:
- a band of linked rings, after the Bow Bridge railings
- the flower from the engagement ring, an asymmetrical flower (pointed petals in different sizes around a round stone), used as the divider under every heading, sitting on a fine gold line like the ring's band
- leafy sprigs with the same little flowers

## Colours and fonts

All colours, the page background, the photo finish (`--photo-filter`) and the grain strength (`--grain-opacity`) are CSS variables in the **SHARED THEME** block at the top of `styles.css`. The same block sits at the top of `save-the-date/styles.css`. **Keep the two identical**: if you change one, paste it over the other so both sites stay on the same page. Fonts are `--font-script` (Pinyon Script) and `--font-serif` (Cormorant Garamond). To use Great Vibes instead, swap `Pinyon+Script` for `Great+Vibes` in the Google Fonts link in `index.html`, and put `"Great Vibes"` first in `--font-script`.

## Countdown

In `apps-script/Code.gs`:

```js
countdownTarget: '2027-11-06T12:00:00+05:30',
```

`+05:30` is India time. Change the date or time if you like, then redeploy.

---

## Setting up the Google Sheet and Apps Script

The site, the sign-in and the RSVP form all go through one Apps Script web app attached to your RSVP sheet. The save-the-date site uses the same script, so there's only one sheet and one script.

1. **Open the sheet.** Use your existing RSVP sheet from the save-the-date, or make a new one at [sheets.new](https://sheets.new).
2. **Open Apps Script.** In the sheet: **Extensions → Apps Script**.
3. **Paste the code.** Replace everything in `Code.gs` in the editor with the whole of `apps-script/Code.gs` from this repo. Click **Save**.
4. **Run setup once.** Choose `setup` in the function dropdown and click **Run**. Google will ask for permission: click through (**Advanced → Go to … (unsafe)** is normal for your own script). This:
   - creates an `RSVPs` tab, or tidies up the existing one, with this header row:
     `Timestamp | Name | Contact | Attending | Party size | Other guests | Dietary/allergies | Solo room preference | Pairing gender | Roommate name | Message | Access override`
     If your sheet still has the older save-the-date columns, they're rearranged into this order with every answer kept. Any extra columns you've added yourself are kept at the end.
   - creates the secret used to sign guests' sessions (stored in **Project Settings → Script Properties** as `TOKEN_SECRET`).
5. **Deploy as a web app.** **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**. Set:
   - Description: `Wedding site`
   - **Execute as: Me**
   - **Who has access: Anyone**

   Click **Deploy** and authorise if asked. "Anyone" is needed so guests can reach it without a Google account. It doesn't give anyone access to your sheet, only to what the script chooses to send back.
6. **Copy the URL.** Copy the **Web app URL** (it ends in `/exec`) and paste it at the top of `script.js`:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
   If the save-the-date site was pointing at a different script before, paste the same URL into `RSVP_ENDPOINT` in `save-the-date/script.js` too. Opening the URL in a browser should show `{"ok":true,...}`.
7. **Every time you change `Code.gs`** (new words, a new taxi number, anything): **Deploy → Manage deployments**, click the pencil on your deployment, choose **Version: New version**, then **Deploy**. This keeps the same URL. (A *new* deployment gives a new URL, which you'd have to paste into `script.js` again.)

### How guests sign in

They type their full name and the phone or email they used when they replied. The script looks for a row where:

- the **Name** matches, ignoring capitals, extra spaces, accents and punctuation, and
- the **Contact** matches. Emails ignore capitals and spaces. Phone numbers are compared on their last 10 digits, so `+44 7700 900123`, `07700 900123` and `447700900123` all match. A Contact cell can hold more than one, separated by a comma, `;` or ` / `, and
- **Attending** says `Yes`, **or** **Access override** is `TRUE`.

If someone has several rows, the newest one (lowest in the sheet) decides. A guest who updates their RSVP to "No" loses access.

If they don't match, they see a gentle message that doesn't say whether the name exists. After 5 failed tries for the same name, or the same phone/email, further tries are refused for 15 minutes.

Once in, their device remembers them for 30 days. Each time they come back the site quietly re-checks with the script, so changes to `CONTENT` show up straight away, and if you remove someone from the sheet they're signed out on their next visit. There's a "Not you? Sign out" link at the bottom of the page for shared devices.

### Adding a guest by hand

For someone who RSVP'd to you directly (a call, a message, in person):

1. Add a new row in the `RSVPs` tab.
2. Fill in **Name** (as they'll type it) and **Contact** (their phone or email).
3. Type `TRUE` in **Access override**, or tick it if you've made that column a checkbox.

That's it. They can sign in straight away, and filling in the other columns is optional. Tell them which name and contact you used. Access override also works as a "let them in regardless" for anyone else. Clear it to take it away.

### Guests who replied on the save-the-date

The save-the-date form didn't ask for a phone or email, so those rows have an empty **Contact** and can't sign in yet. Either add their phone or email to the Contact cell yourself, or ask them for it. When a signed-in guest sends the RSVP form with the same name, it fills in that row instead of adding a new one.

### What lands in the sheet

- **Attending "No"**: party size, other guests, dietary and room columns are left blank.
- **Party of 1**: Solo room preference is one of "My own room", "I already have someone to share with" (plus **Roommate name**) or "Pair me with another solo guest" (plus **Pairing gender**). Larger parties never see that question.
- **Updating**: sending the form again with the same name and contact overwrites that row with a fresh timestamp. No duplicates. Your own columns and Access override on that row are left alone.
- Anything a guest types that starts with `=`, `+`, `-` or `@` is stored as plain text, never as a formula.

---

## What this protects, and what it doesn't

Please read this honestly before you rely on it.

**What it does protect**
- None of the wedding details (dates, venue, story, schedule, travel, Q&A) are in the website's files. Viewing the page source, or downloading the site, shows only the sign-in screen, the menu and the RSVP form. The details are sent by the script only after a name and contact match a Yes RSVP (or an override).
- Sessions are signed with a secret only the script knows, so they can't be forged or edited. They expire after 30 days, and are re-checked against the sheet on every visit.
- Nobody can sign up to get in: the RSVP form on this site only works for someone who is already signed in.

**What it doesn't protect**
- **It's only as private as your guests' details.** Anyone who knows a guest's full name and their phone number or email can sign in as them. A family member who knows both can get in, and so can anyone a guest passes their details to. The rate limit slows guessing but doesn't make it impossible.
- **Signed-in guests can share what they see**: screenshots, copy and paste, or simply forwarding. Their device also keeps a copy of the content (in the browser's local storage) so the site opens instantly next time. "Sign out" removes it.
- **Photos are ordinary files.** Anything in `assets/` can be opened by anyone who guesses its address (e.g. `/assets/story-1.jpg`), and on a public GitHub repo they're visible to everyone. Don't use photos you'd mind being seen.
- **The save-the-date passphrase is weak.** The save-the-date's RSVP form is protected by a passphrase that's written in its public `script.js`. Someone could use it to add rows to your sheet. Those rows have no Contact, so they don't let anyone into this site, but keep an eye out for odd entries.
- **Rate limiting is light.** Apps Script can't see visitors' IP addresses, so limits are per name and per phone/email, not per person. A determined attacker trying many different names would only be slowed down. Each failed attempt also waits a moment before answering.
- **Your Google account is the real lock.** Whoever can edit the sheet or the script can see and change everything. Changing or deleting `TOKEN_SECRET` in Script Properties signs every guest out.
- The page has a `noindex` tag so search engines shouldn't list it, but that's a request, not a lock.

In short: it keeps the details away from casual visitors, people who find the link, and search engines, and it's far stronger than a shared password. It isn't bank-grade security, so keep anything truly sensitive (passport details, payments) off the site.

---

## Hosting

### Netlify Drop (easiest)

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the project folder onto the page (see the note below about `apps-script/`). (To host the save-the-date separately, drag the `save-the-date` folder on its own as a second site.)
3. You get a live link straight away. Sign in to keep it, and pick a nicer name under **Site settings → Change site name**.

To update, drag the folder onto the **Deploys** tab of your site.

### GitHub Pages

1. Push this repo to GitHub.
2. In the repo: **Settings → Pages**.
3. Under "Build and deployment", choose **Deploy from a branch**, pick your branch (e.g. `main`) and the `/ (root)` folder, then **Save**.
4. After a minute the main site is at `https://<username>.github.io/<repo>/` and the save-the-date is at `…/<repo>/save-the-date/`.

**Important:** `apps-script/Code.gs` holds all the private content, so it must never be served as part of the website.
- **Netlify:** the `_redirects` file in this folder blocks `/apps-script/` (it returns "not found"), so dragging the whole folder is safe. Leaving `apps-script/` out of the upload altogether is even safer. The site doesn't need it.
- **GitHub Pages** can't block files, so `…/apps-script/Code.gs` *would* be readable by anyone, and a public repo shows everything on GitHub too. If you use Pages, move `Code.gs` out of the repo (keep it only in the Apps Script editor) and keep the repo private, which needs a paid GitHub plan for Pages. Netlify Drop is simpler.

---

## Small details

- Mobile first. The menu is a hamburger on phones and a persistent top bar from 900px wide.
- Sections fade and rise in slowly as you scroll. Anyone with "reduce motion" turned on in their device settings sees everything straight away, with nothing moving.
- To preview locally you need the Apps Script deployed and its URL in `script.js`. Without it the sign-in screen says the site isn't quite ready.

# Jessica & Gaurav · wedding website

One page, in this order: invite code, our names and photo, a countdown, our story, the RSVP form, and then (only after a "yes") the schedule.

Plain HTML, CSS and JavaScript. No framework and nothing to install.

```
index.html             the page: hero, countdown, our story, RSVP
tokens.css             the design tokens: colours, fonts, sizes, spacing, motif rules
styles.css             layout, built only from tokens.css
script.js              the RSVP form, plus every line of form wording at the top
photos/                5 compressed photos (each as .webp and .jpg)
apps-script/Code.gs    the Google script that saves RSVPs into the v2 sheet
dashboard/             the RSVP dashboard (lives on Claude, not on the website)
IDENTITY.md            the identity guide to hand to any vendor
_redirects             keeps apps-script/ and dashboard/ off the public site
```

---

## Going live: the short version

1. **Connect the sheet** (10 minutes, step A below), then send Claude the link it gives you. Claude pastes it in.
2. **Put the site online** (5 minutes, step B below) at **jessica-and-gaurav.netlify.app**.
3. **Claude sends test RSVPs**, you check them in the sheet, then delete them with one click (step C).

---

## A. Connect the RSVP sheet

1. Open the sheet **Jess & Gaurav Wedding – RSVP Tracker (v2)**.
2. Click **Extensions → Apps Script**. A new tab opens.
3. Delete everything in the editor, then paste in the whole of `apps-script/Code.gs`. Click the **Save** icon.
4. In the bar at the top, choose **setup** from the function menu and click **Run**.
   Google asks for permission. Click **Review permissions**, choose your account, then **Advanced → Go to … (unsafe)** → **Allow**. ("Unsafe" just means Google hasn't reviewed your own private script; that's normal.)
   This creates an **RSVPs** tab as the first tab, with the columns from the brief. The empty "Untitled" tab is reused for it.
5. Click **Deploy → New deployment**. Click the gear next to "Select type" and pick **Web app**. Set:
   - **Execute as: Me**
   - **Who has access: Anyone**
   Then click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
6. **Send that URL to Claude.** Or paste it yourself at the top of `script.js`, between the quotes in `const APPS_SCRIPT_URL = "";`.

**If you change `Code.gs` later** (the schedule, the invite code, the guest guide link): **Deploy → Manage deployments**, click the pencil, choose **Version: New version**, then **Deploy**. The URL stays the same.

## B. Put the site online (Netlify, free)

1. Go to [netlify.com](https://www.netlify.com) and sign up free (your Google account works).
2. Download this project folder. On GitHub: the green **Code** button → **Download ZIP**, then unzip it.
3. In Netlify: **Add new site → Deploy manually**, then drag the unzipped folder onto the page.
4. Once it's up: **Site configuration → Change site name** → type `jessica-and-gaurav` → **Save**.
   Your site is now **https://jessica-and-gaurav.netlify.app**. That's the link to send with the save-the-date.

**To update the site later**, open your site in Netlify, go to **Deploys**, and drag the new folder onto the box at the bottom.

**Your own domain (optional, later):** buy one (for example at Namecheap or Squarespace Domains, about £10 a year), then in Netlify go to **Domain management → Add a domain** and follow its steps. It walks you through the two settings to copy into your domain account.

## C. Testing before it goes out

Once the URL is in, Claude submits test RSVPs to the live sheet: a solo guest for each of the three room options, a party of 4, a "can't make it", and an edit of an existing RSVP. Each is marked **test** in the "source" column.

You check them in the sheet. Then, in the sheet's menu bar, click **Wedding → Delete test rows**. (The Wedding menu appears after you reload the sheet once the script is saved.)

---

## Changing things

| What | Where |
| --- | --- |
| Our story, hero line, dates on the page | `index.html` |
| Form questions, hints, error messages, the thank-you note | `COPY` at the top of `script.js` |
| Schedule, "Room details to follow.", guest guide link | `SCHEDULE` at the top of `apps-script/Code.gs` (then redeploy, see A) |
| Invite code | `INVITE_CODE` in `apps-script/Code.gs` (then redeploy). Capitals and spaces never matter. |
| Colours, fonts, sizes | `tokens.css` only |
| Photos | Replace both the `.webp` and `.jpg` with the same name in `photos/` (or send them to Claude to compress) |

## How RSVPs land in the sheet

- One row per lead guest. If someone sends the form again with the **same email**, their row is replaced with the new answers and **updated** says `yes`.
- **room payment status** is yours. The site never writes to it, even when a guest edits their RSVP.
- If you add someone by hand, put `manual` in the **source** column.
- Guests who can't come skip straight to "Message for the couple". Their party, room and food columns stay empty.
- If sending fails (bad signal, say), the guest sees a clear message and a **Try again** button. Their answers stay in the form, and are also saved on their phone until the RSVP goes through.

## The RSVP dashboard

https://claude.ai/artifact/ABN1GKDXFScdw8u9tmFjeu

A private page on Claude that reads the sheet through your Google Drive connection and refreshes every minute. The first time you open it, Claude asks you to allow Google Drive for the page. Only you can open it unless you share it from its Share menu, and whoever you share it with needs Google Drive connected with access to the sheet.

## What the invite code does and doesn't do

- It keeps casual visitors and search engines out (the page also tells search engines not to list it).
- The code is checked by the Google script, so it isn't written anywhere in the website's files. No guest list is in the website either.
- Anyone who has the code can see the page and RSVP, so treat it like a door code, not a password.
- The schedule is only sent to someone who has just RSVP'd yes or looked up a "yes" RSVP by email.
- After 40 wrong codes in 10 minutes, the script pauses new tries for a few minutes.

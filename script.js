/* ==========================================================================
   Jessica & Gaurav · Save the Date

   EVERYTHING YOU'LL WANT TO EDIT IS IN THIS TOP SECTION.
   ========================================================================== */

// true: the doors open onto the venue in CONFIG.venue.
// false: the doors open onto the dates and a teaser line instead.
const REVEAL_VENUE = true;

// The countdown counts down to this moment: the first day of the wedding.
// Change the "+00:00" to the venue's UTC offset once you're ready (e.g. "+05:30", "+01:00").
const WEDDING_START = "2027-11-06T12:00:00+00:00";

// Paste your Google Apps Script web app URL here (ends in /exec). See README.
const RSVP_ENDPOINT = "";

// Shared guest passphrase. Not case sensitive, spaces at either end are ignored.
// Must match PASSPHRASE in apps-script/Code.gs.
const GUEST_PASSPHRASE = "forever";

const CONFIG = {
  names: {
    first: "Jessica",
    second: "Gaurav",
    initials: ["J", "G"],
  },

  venue: {
    name: "Royal Retreat Resort & Spa",
    city: "", // optional, e.g. the town or region
    url: "",  // optional link to the resort's website
    linkLabel: "Take a look",
  },

  gate: {
    title: "Hello, you",
    text: "We made this little page for our favourite people. Pop in the word we sent you and come on in.",
    placeholder: "The word we sent you",
    button: "Come in",
    error: "Not quite. Have another look at our message, it's in there.",
  },

  landing: {
    eyebrow: "We're getting married",
    prompt: "Open invitation",
  },

  saveTheDate: {
    title: "Save the Date",
    date: "06 - 08 . 11 . 27",
    sub: "November 2027",
    line: "Three days with the people we love most. It wouldn't feel right without you, so please keep them free for us.",
  },

  reveal: {
    button: "Open the doors",
    eyebrow: "Join us",
    days: "6 · 7 · 8",
    month: "November 2027",
    teaser: "Somewhere beautiful, and we can't wait to tell you.", // shown when REVEAL_VENUE is false
  },

  details: {
    countdownEyebrow: "Until we see you",
    units: { days: "Days", hours: "Hours", mins: "Mins", secs: "Secs" },
    arrived: "It's today. See you there.",
    formalLine: "Formal invitation to follow in the new year, but please let us know if you are going to be able to make it.",
    rsvpButton: "Share your details",
  },

  rsvp: {
    intro: "It's early, we know. A rough idea now helps us plan something lovely for you.",
    name: {
      label: "Your full name",
      required: "We'll need your name so we know who's coming.",
    },
    attending: {
      label: "Will you be there?",
      hint: "We're celebrating across all three days, so it's all three or none. No pressure either way.",
      yes: "Yes, all three days",
      no: "Sadly, we can't make it",
      required: "Just let us know either way.",
    },
    party: {
      label: "How many of you, including you?",
      max: 6,
      one: "Just me",
      many: (n) => `${n} of us`,
    },
    others: {
      label: "Who's coming with you?",
      hint: "Everyone's full names in one go, please.",
      required: "Tell us who's coming with you so we can save them a seat.",
    },
    dietary: {
      label: "Dietary needs or allergies",
      hint: "The whole wedding is vegetarian. Let us know about anything else, for everyone in your party.",
    },
    solo: {
      label: "Coming on your own?",
      hint: "Room details to follow. For now, just tell us what you'd like.",
      options: [
        "I'd like my own room",
        "I already have someone to share with",
        "I'd like to be paired with another single guest of the same gender",
      ],
      required: "Pick whichever suits you best.",
    },
    message: {
      label: "A little note for us",
      hint: "Optional. A memory, a song you want to dance to, or just hello.",
    },
    submit: "Send to Jessica & Gaurav",
    sending: "Sending…",
    error: "Something went wrong sending that. Please try again in a moment, and if it still won't go, give one of us a shout.",
    notConfigured: "Our RSVP isn't quite ready yet. Please try again soon.",
  },

  thanks: {
    yesTitle: "We can't wait",
    yesText: "You're on our list. Your formal invitation will follow in the new year, with the full schedule and room details.",
    noTitle: "We'll miss you",
    noText: "Thank you for letting us know. We'll be thinking of you, and we'll celebrate together soon.",
    update: "Plans change, and that's okay. Send this again with the same name and we'll update your answer.",
    again: "Update my answer",
  },

  signoff: "With love, Jessica & Gaurav",

  music: {
    src: "", // e.g. "assets/our-song.mp3". The toggle only appears once this is set.
    label: "Play or pause music",
  },

  decor: {
    // Transparent PNGs for the save-the-date screen. Leave empty to show nothing.
    flowers: "", // e.g. "assets/flowers.png"
    ribbon: "",  // e.g. "assets/ribbon.png"
    petals: 12,  // drifting petals; 0 turns them off
  },
};

/* ==========================================================================
   You shouldn't need to edit below this line.
   ========================================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "jg-guest-pass";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const normalisePass = (s) => String(s || "").trim().toLowerCase();

  /* ---------- Copy ---------- */
  function lookup(path) {
    return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), CONFIG);
  }

  function applyCopy() {
    CONFIG.namesLine = `${CONFIG.names.first} & ${CONFIG.names.second}`;
    CONFIG.initialsLine = `${CONFIG.names.initials[0]} & ${CONFIG.names.initials[1]}`;
    $$("[data-copy]").forEach((el) => {
      const value = lookup(el.dataset.copy);
      if (typeof value === "string") el.textContent = value;
    });
    $("#gate-input").placeholder = CONFIG.gate.placeholder;
    document.title = `${CONFIG.namesLine} · Save the Date`;
  }

  /* ---------- Gate ---------- */
  function readStoredPass() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function storePass(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) { /* private mode: fine */ }
  }

  function unlock(animate) {
    const gate = $("#gate");
    document.body.classList.remove("is-locked");
    if (animate && !reduceMotion) {
      gate.classList.add("is-leaving");
      setTimeout(() => { gate.hidden = true; }, 1200);
    } else {
      gate.hidden = true;
    }
    startObservers();
    startPetals();
  }

  function initGate() {
    if (normalisePass(readStoredPass()) === normalisePass(GUEST_PASSPHRASE)) {
      unlock(false);
      return;
    }
    const form = $("#gate-form");
    const input = $("#gate-input");
    const error = $("#gate-error");
    setTimeout(() => input.focus(), 400);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (normalisePass(input.value) === normalisePass(GUEST_PASSPHRASE)) {
        storePass(input.value.trim());
        error.textContent = "";
        input.blur();
        unlock(true);
      } else {
        error.textContent = CONFIG.gate.error;
        input.select();
      }
    });
  }

  /* ---------- Screens & entry animations ---------- */
  function startObservers() {
    const screens = $$(".screen");
    const enter = (s) => {
      s.classList.add("is-in");
      s.dispatchEvent(new CustomEvent("screen:in"));
    };
    if (!("IntersectionObserver" in window)) {
      screens.forEach(enter);
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          enter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { root: $("#screens"), threshold: 0.3 });
    screens.forEach((s) => io.observe(s));
  }

  function scrollToScreen(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  function initLanding() {
    const landing = $("#landing");
    $("#open-prompt").addEventListener("click", (e) => {
      e.preventDefault();
      scrollToScreen("save-the-date");
    });
    // Tap anywhere on the landing (except links/buttons) or swipe up to move on.
    landing.addEventListener("click", (e) => {
      if (e.target.closest("a, button")) return;
      scrollToScreen("save-the-date");
    });
    let startY = null;
    landing.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; }, { passive: true });
    landing.addEventListener("touchend", (e) => {
      if (startY === null) return;
      const dy = startY - e.changedTouches[0].clientY;
      startY = null;
      if (dy > 40) scrollToScreen("save-the-date");
    }, { passive: true });
  }

  /* ---------- Save the date: scalloped oval + decor ---------- */
  function scallopedEllipsePath(cx, cy, rx, ry, count, bulge) {
    const pt = (t, r1, r2) => [cx + r1 * Math.cos(t), cy + r2 * Math.sin(t)];
    const step = (Math.PI * 2) / count;
    let d = "";
    for (let i = 0; i < count; i++) {
      const t0 = i * step - Math.PI / 2;
      const tm = t0 + step / 2;
      const [x0, y0] = pt(t0, rx, ry);
      const [x1, y1] = pt(t0 + step, rx, ry);
      const [qx, qy] = pt(tm, rx + bulge * 2, ry + bulge * 2);
      if (i === 0) d += `M${x0.toFixed(2)} ${y0.toFixed(2)} `;
      d += `Q${qx.toFixed(2)} ${qy.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)} `;
    }
    return d + "Z";
  }

  function initSaveTheDate() {
    $("#oval-scallop").setAttribute("d", scallopedEllipsePath(150, 200, 136, 184, 34, 6));
    [["flowers", "#decor-flowers"], ["ribbon", "#decor-ribbon"]].forEach(([key, sel]) => {
      const src = CONFIG.decor[key];
      if (!src) return;
      const img = new Image();
      img.src = src;
      img.alt = "";
      $(sel).appendChild(img);
    });
  }

  /* ---------- Venue ---------- */
  function initVenue() {
    const v = CONFIG.venue;
    if (!REVEAL_VENUE || !v.name) return;
    $("#venue-teaser").hidden = true;
    $("#venue-revealed").hidden = false;
    $("#venue-name").textContent = v.name;
    if (v.city) {
      $("#venue-city").textContent = v.city;
      $("#venue-city").hidden = false;
    }
    if (v.url) {
      const link = $("#venue-link");
      link.href = v.url;
      link.textContent = v.linkLabel;
      link.hidden = false;
    }
  }

  /* ---------- The big reveal: palace doors ---------- */
  function initRevealDoors() {
    const wrap = $("#reveal-doors");
    const btn = $("#reveal-btn");
    let autoTimer;
    const open = () => {
      clearTimeout(autoTimer);
      if (wrap.classList.contains("is-open")) return;
      wrap.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      btn.tabIndex = -1;
    };
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", open);
    $(".reveal-doors__arch", wrap).addEventListener("click", open);
    // If nobody taps, the doors open by themselves after a moment.
    $("#details").addEventListener("screen:in", () => {
      autoTimer = setTimeout(open, 4500);
    });
  }

  /* ---------- Toran garland ---------- */
  function buildToran() {
    const host = $("#toran");
    const w = host.clientWidth || window.innerWidth;
    const h = host.clientHeight || 64;
    const span = w < 600 ? 44 : 56;
    const count = Math.max(4, Math.round(w / span));
    const step = w / count;
    const sag = h * 0.22;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("preserveAspectRatio", "none");
    let d = `M0 2`;
    let drops = "";
    const leafLen = h * 0.62;
    for (let i = 0; i < count; i++) {
      const x0 = i * step;
      const mid = x0 + step / 2;
      d += ` Q${mid.toFixed(1)} ${(2 + sag * 2).toFixed(1)} ${(x0 + step).toFixed(1)} 2`;
      const y = 2 + sag; // lowest point of the swag
      const delay = `${(-(i * 0.7) % 5.5).toFixed(2)}s`;
      let item;
      if (i % 2 === 0) {
        const L = leafLen;
        const alt = i % 4 === 0 ? "" : " toran__leaf--alt";
        item = `<path class="toran__leaf${alt}" d="M0 0 C${L * 0.26} ${L * 0.28} ${L * 0.24} ${L * 0.7} 0 ${L} C${-L * 0.24} ${L * 0.7} ${-L * 0.26} ${L * 0.28} 0 0 Z"/>` +
               `<path class="toran__rib" d="M0 ${L * 0.12} V${L * 0.88}"/>`;
      } else {
        item = `<path class="toran__string" d="M0 0 V${h * 0.14}"/>` +
               `<circle class="toran__bead" cx="0" cy="${h * 0.22}" r="${h * 0.075}"/>` +
               `<circle class="toran__bead toran__bead--blue" cx="0" cy="${h * 0.36}" r="${h * 0.05}"/>`;
      }
      drops += `<g transform="translate(${mid.toFixed(1)} ${y.toFixed(1)})"><g class="toran__drop" style="--sway-delay:${delay}">${item}</g></g>`;
    }
    svg.innerHTML = `<path class="toran__string" d="${d}"/>${drops}`;
    host.replaceChildren(svg);
  }

  function initToran() {
    buildToran();
    let t;
    let lastW = window.innerWidth;
    window.addEventListener("resize", () => {
      if (window.innerWidth === lastW) return; // ignore mobile URL-bar height changes
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(buildToran, 200);
    });
  }

  /* ---------- Drifting petals ---------- */
  function startPetals() {
    const host = $("#petals");
    if (reduceMotion || !CONFIG.decor.petals || host.childElementCount) return;
    const kinds = ["", "", "petal--blush", "petal--gold"];
    for (let i = 0; i < CONFIG.decor.petals; i++) {
      const p = document.createElement("span");
      p.className = `petal ${kinds[i % kinds.length]}`;
      const rand = (a, b) => a + Math.random() * (b - a);
      p.style.setProperty("--x", `${rand(2, 96).toFixed(1)}vw`);
      p.style.setProperty("--s", `${rand(8, 15).toFixed(1)}px`);
      p.style.setProperty("--d", `${rand(16, 28).toFixed(1)}s`);
      p.style.setProperty("--delay", `${(-rand(0, 26)).toFixed(1)}s`);
      p.style.setProperty("--drift", `${rand(-60, 60).toFixed(0)}px`);
      p.style.setProperty("--r", `${rand(-260, 260).toFixed(0)}deg`);
      host.appendChild(p);
    }
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    const target = new Date(WEDDING_START).getTime();
    const els = {};
    $$("[data-unit]").forEach((el) => { els[el.dataset.unit] = el; });
    const pad = (n, len = 2) => String(n).padStart(len, "0");
    let timer;
    const set = (unit, value) => {
      const el = els[unit];
      if (el.textContent === value) return;
      el.textContent = value;
      el.classList.remove("tick");
      void el.offsetWidth; // restart the animation
      el.classList.add("tick");
    };

    function tick() {
      const diff = Math.max(0, target - Date.now());
      const s = Math.floor(diff / 1000);
      set("days", pad(Math.floor(s / 86400), 3));
      set("hours", pad(Math.floor((s % 86400) / 3600)));
      set("mins", pad(Math.floor((s % 3600) / 60)));
      set("secs", pad(s % 60));
      if (diff === 0) {
        clearInterval(timer);
        $("#countdown").setAttribute("aria-label", CONFIG.details.arrived);
      }
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- RSVP ---------- */
  function initRsvp() {
    const toggle = $("#rsvp-toggle");
    const panel = $("#rsvp-panel");
    const screens = $("#screens");
    const form = $("#rsvp-form");
    const ifAttending = $("#if-attending");
    const party = $("#rsvp-party");
    const othersField = $("#field-others");
    const soloField = $("#field-solo");
    const errorBox = $("#rsvp-error");
    const submit = $("#rsvp-submit");
    const thanks = $("#rsvp-thanks");

    // Party size options
    for (let n = 1; n <= CONFIG.rsvp.party.max; n++) {
      const opt = document.createElement("option");
      opt.value = String(n);
      opt.textContent = n === 1 ? CONFIG.rsvp.party.one : CONFIG.rsvp.party.many(n);
      party.appendChild(opt);
    }

    // Solo room options
    const soloWrap = $("#solo-choices");
    CONFIG.rsvp.solo.options.forEach((text) => {
      const label = document.createElement("label");
      label.className = "choice";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "solo";
      input.value = text;
      const span = document.createElement("span");
      span.textContent = text;
      label.append(input, span);
      soloWrap.appendChild(label);
    });

    function setOpen(open) {
      panel.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      screens.classList.toggle("is-free", open);
      if (open) {
        setTimeout(() => {
          panel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
          if (!thanks.hidden) return;
          $("#rsvp-name").focus({ preventScroll: true });
        }, reduceMotion ? 0 : 450);
      }
    }
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

    function attendingValue() {
      const checked = form.querySelector('input[name="attending"]:checked');
      return checked ? checked.value : "";
    }

    function syncConditional() {
      const yes = attendingValue() === "Yes";
      const size = parseInt(party.value, 10) || 1;
      ifAttending.hidden = !yes;
      othersField.hidden = !(yes && size > 1);
      soloField.hidden = !(yes && size === 1);
    }
    form.addEventListener("change", syncConditional);
    syncConditional();

    function setFieldError(name, message) {
      const el = form.querySelector(`[data-error-for="${name}"]`);
      if (!el) return;
      el.textContent = message || "";
      el.closest(".field").classList.toggle("has-error", Boolean(message));
    }

    function validate(data) {
      let firstBad = null;
      const fail = (name, msg, focusSel) => {
        setFieldError(name, msg);
        if (!firstBad) firstBad = form.querySelector(focusSel);
      };
      ["name", "attending", "otherGuests", "solo"].forEach((n) => setFieldError(n, ""));

      if (!data.name) fail("name", CONFIG.rsvp.name.required, "#rsvp-name");
      if (!data.attending) fail("attending", CONFIG.rsvp.attending.required, 'input[name="attending"]');
      if (data.attending === "Yes") {
        if (data.partySize > 1 && !data.otherGuests) fail("otherGuests", CONFIG.rsvp.others.required, "#rsvp-others");
        if (data.partySize === 1 && !data.soloPreference) fail("solo", CONFIG.rsvp.solo.required, 'input[name="solo"]');
      }
      if (firstBad) firstBad.focus();
      return !firstBad;
    }

    function collect() {
      const fd = new FormData(form);
      const attending = fd.get("attending") || "";
      const yes = attending === "Yes";
      const partySize = yes ? parseInt(fd.get("partySize"), 10) || 1 : 0;
      return {
        passphrase: readStoredPass() || GUEST_PASSPHRASE,
        website: (fd.get("website") || "").trim(), // honeypot
        name: (fd.get("name") || "").trim().replace(/\s+/g, " "),
        attending,
        partySize,
        otherGuests: yes && partySize > 1 ? (fd.get("otherGuests") || "").trim() : "",
        dietary: yes ? (fd.get("dietary") || "").trim() : "",
        soloPreference: yes && partySize === 1 ? (fd.get("solo") || "") : "",
        message: (fd.get("message") || "").trim(),
      };
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.hidden = true;
      const data = collect();
      if (!validate(data)) return;

      if (!RSVP_ENDPOINT) {
        console.warn("RSVP_ENDPOINT is empty. Add your Apps Script web app URL in script.js.");
        showError(CONFIG.rsvp.notConfigured);
        return;
      }

      submit.disabled = true;
      submit.classList.add("is-sending");
      try {
        await sendRsvp(data);
        showThanks(data.attending === "Yes");
      } catch (err) {
        console.error(err);
        showError(CONFIG.rsvp.error);
      } finally {
        submit.disabled = false;
        submit.classList.remove("is-sending");
      }
    });

    function showError(message) {
      errorBox.textContent = message;
      errorBox.hidden = false;
      errorBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    function showThanks(yes) {
      $("#thanks-title").textContent = yes ? CONFIG.thanks.yesTitle : CONFIG.thanks.noTitle;
      $("#thanks-text").textContent = yes ? CONFIG.thanks.yesText : CONFIG.thanks.noText;
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus({ preventScroll: true });
      thanks.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    // Keep their previous answers in the form so updating is easy.
    $("#rsvp-again").addEventListener("click", () => {
      thanks.hidden = true;
      form.hidden = false;
      $("#rsvp-name").focus();
    });
  }

  class RsvpRejected extends Error {}

  /*
   * Apps Script web apps answer a POST with a redirect to googleusercontent.com,
   * which does send CORS headers. Sending the body as text/plain keeps this a
   * "simple" request (no preflight, which Apps Script can't answer), so normally
   * we can read the JSON reply and catch a rejection.
   *
   * If the browser still blocks reading the reply, we fall back to a no-cors POST.
   * That response is opaque, so we can only tell the request left the browser.
   * Because the script updates rows by name, sending twice never duplicates a guest.
   */
  async function sendRsvp(payload) {
    const body = JSON.stringify(payload);
    const headers = { "Content-Type": "text/plain;charset=utf-8" };
    try {
      const res = await fetch(RSVP_ENDPOINT, { method: "POST", body, headers, redirect: "follow" });
      const data = await res.json();
      if (!data || data.ok !== true) throw new RsvpRejected((data && data.error) || "Rejected");
    } catch (err) {
      if (err instanceof RsvpRejected) throw err;
      await fetch(RSVP_ENDPOINT, { method: "POST", mode: "no-cors", body, headers });
    }
  }

  /* ---------- Music ---------- */
  function initMusic() {
    if (!CONFIG.music.src) return;
    const btn = $("#music-toggle");
    const audio = $("#bg-music");
    audio.src = CONFIG.music.src;
    audio.volume = 0.5;
    btn.hidden = false;
    btn.addEventListener("click", async () => {
      if (audio.paused) {
        try {
          await audio.play();
          btn.setAttribute("aria-pressed", "true");
        } catch (e) { /* playback blocked or file missing */ }
      } else {
        audio.pause();
        btn.setAttribute("aria-pressed", "false");
      }
    });
  }

  /* ---------- Go ---------- */
  applyCopy();
  initSaveTheDate();
  initVenue();
  initRevealDoors();
  initToran();
  initCountdown();
  initLanding();
  initRsvp();
  initMusic();
  initGate();
})();

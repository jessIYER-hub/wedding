/* ==========================================================================
   Jessica & Gaurav · Wedding website

   EVERYTHING YOU'LL WANT TO EDIT HERE IS IN THIS TOP SECTION.

   This file is public: anyone can read it. So it only holds the words for the
   sign-in screen, the menu and the RSVP form. The private page content (home,
   story, schedule, travel, Q&A) lives in CONTENT at the top of
   apps-script/Code.gs, and only reaches guests who sign in. See README.md.
   ========================================================================== */

// Paste your Google Apps Script web app URL here (ends in /exec). See README.
const APPS_SCRIPT_URL = "";

const CONFIG = {
  couple: {
    names: "Jessica & Gaurav",
    initials: "J & G",
  },

  gate: {
    line: "We made this for the people we love most, and we're so glad you're here.",
    prompt: "Enter your details to continue",
    nameLabel: "Your full name",
    contactLabel: "Phone (WhatsApp) or email",
    hint: "The same ones you used when you replied to us. If someone replied for your whole group, use their details.",
    button: "Come in",
    checking: "Just a moment…",
    loading: "Just a moment…",
    help: "Having trouble getting in? Message either of us and we'll sort it out.",
    errors: {
      missing: "Please fill in both, so we can find you.",
      noMatch: "We couldn't match those details. Please check they're the ones you used when you replied, and try again.",
      slowDown: "Let's take a little break. Please try again in a few minutes.",
      network: "We couldn't reach the site just now. Please check your connection and try again.",
      notConfigured: "The site isn't quite ready yet. Please try again soon.",
      signedOut: "Please enter your details again to come back in.",
    },
  },

  nav: {
    skip: "Skip to content",
    menu: "Menu",
    items: [
      { id: "home", label: "Home" },
      { id: "story", label: "Our Story" },
      { id: "schedule", label: "Schedule" },
      { id: "travel", label: "Travel" },
      { id: "faqs", label: "Q&A" },
    ],
    rsvp: "Update your RSVP",
  },

  rsvp: {
    heading: "Your RSVP",
    intro: "Here's what you told us. If any of your details have changed, update them below and send it again.",
    name: {
      label: "Your full name",
      required: "We'll need your name so we know who's coming.",
    },
    contact: {
      label: "Phone (WhatsApp) or email",
      hint: "So we can reach you. You'll use this, with your name, to sign in here.",
      required: "Please add a phone number or email we can reach you on.",
    },
    attending: {
      label: "Will you be there?",
      hint: "We're celebrating across all three days, so it's all three or none.",
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
      hint: "The whole wedding is vegetarian. Let us know about any allergies or anything else, for everyone in your party.",
    },
    solo: {
      label: "Coming on your own?",
      hint: "Room details to follow. For now, just tell us what you'd like.",
      // Keep these three exactly in step with SOLO_OWN / SOLO_SHARE / SOLO_PAIR in Code.gs.
      options: [
        "My own room",
        "I already have someone to share with",
        "Pair me with another solo guest",
      ],
      required: "Pick whichever suits you best.",
      roommateLabel: "Who are you sharing with?",
      roommateRequired: "Tell us who you're sharing with.",
      genderLabel: "Your gender",
      genderHint: "So we can pair you with someone you'll be comfortable with.",
      genderChoose: "Choose one",
      genderOptions: ["Woman", "Man", "I'd rather tell you myself"],
      genderRequired: "Please choose one.",
    },
    message: {
      label: "A note for us",
      hint: "Optional. A memory, a song you want to dance to, or just hello.",
    },
    submit: "Send to Jessica & Gaurav",
    sending: "Sending…",
    error: "Something went wrong sending that. Please try again in a moment, and if it still won't go, message one of us.",
  },

  thanks: {
    yesTitle: "Thank you",
    yesText: "That's all updated. We can't wait to see you.",
    noTitle: "We'll miss you",
    noText: "Thank you for letting us know. We'll be thinking of you, and if anything changes, just get in touch.",
    again: "Make another change",
  },

  footer: {
    signoff: "With love, Jessica & Gaurav",
    signOut: "Not you? Sign out",
  },
};

/* ==========================================================================
   You shouldn't need to edit below this line.
   ========================================================================== */

(function () {
  "use strict";

  const SESSION_KEY = "jg-session"; // { token, exp }
  const CACHE_KEY = "jg-content";   // { content, guest } from the last sign-in
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = { entered: false, content: null, guest: null, countdown: null, revealer: null, spy: null };

  /* ---------- Storage (fails quietly in private browsing) ---------- */
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* fine */ }
  }
  function drop(key) {
    try { localStorage.removeItem(key); } catch (e) { /* fine */ }
  }

  /* ---------- Small helpers ---------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        const v = props[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? "" : v);
      });
    }
    kids.flat(Infinity).forEach((kid) => {
      if (kid == null || kid === false || kid === "") return;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    });
    return el;
  }

  const has = (v) => (Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "");

  // Only allow ordinary links and local image paths from the content.
  function safeHref(url) {
    const s = String(url || "").trim();
    return /^(https?:|mailto:|tel:)/i.test(s) ? s : "";
  }
  function safeSrc(url) {
    const s = String(url || "").trim();
    if (/^https?:/i.test(s)) return s;
    return /^[a-z][a-z0-9+.-]*:/i.test(s) ? "" : s;
  }

  function svgUse(id, cls, viewBox) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("class", cls);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const use = document.createElementNS(ns, "use");
    use.setAttribute("href", "#" + id);
    svg.appendChild(use);
    return svg;
  }
  const motif = (extra = "") => svgUse("ring-divider", `motif ${extra}`.trim(), "0 0 120 40");

  function sectionHeading(id, text, eyebrow) {
    return h("header", { class: "section__head reveal" },
      eyebrow ? h("p", { class: "caps eyebrow", text: eyebrow }) : null,
      h("h2", { class: "script section__title", id, text }),
      motif("motif--divider"));
  }

  function scrollToId(id, smooth = true) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: smooth && !reduceMotion ? "smooth" : "auto", block: "start" });
  }

  /* ---------- Public copy ---------- */
  function lookup(path) {
    return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), CONFIG);
  }
  function applyCopy() {
    $$("[data-copy]").forEach((el) => {
      const value = lookup(el.dataset.copy);
      if (typeof value === "string") el.textContent = value;
    });
    document.title = CONFIG.couple.names;
  }

  /* ---------- Talking to the Apps Script ---------- */
  class ApiError extends Error {
    constructor(code) { super(code); this.code = code; }
  }

  // Sent as text/plain so the browser makes a "simple" request (no preflight,
  // which Apps Script can't answer). Google's redirect allows reading the reply.
  async function api(payload) {
    if (!APPS_SCRIPT_URL) {
      console.warn("APPS_SCRIPT_URL is empty. Add your Apps Script web app URL at the top of script.js.");
      throw new ApiError("not_configured");
    }
    let res;
    try {
      res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });
    } catch (e) {
      throw new ApiError("network");
    }
    let data;
    try { data = await res.json(); } catch (e) { throw new ApiError("network"); }
    if (!data || data.ok !== true) throw new ApiError((data && data.error) || "server");
    return data;
  }

  function storeSession(data) {
    save(SESSION_KEY, { token: data.token, exp: data.expires });
  }

  /* ---------- Gate ---------- */
  function showGate(message) {
    const gate = $("#gate");
    gate.hidden = false;
    gate.classList.remove("is-leaving");
    $("#gate-loading").hidden = true;
    $("#gate-form").hidden = false;
    $("#gate-error").textContent = message || "";
    document.body.classList.add("is-locked");
  }

  function showGateLoading() {
    $("#gate-loading").hidden = false;
    $("#gate-form").hidden = true;
  }

  function gateMessageFor(code) {
    const e = CONFIG.gate.errors;
    return { no_match: e.noMatch, slow_down: e.slowDown, not_configured: e.notConfigured, signed_out: e.signedOut }[code] || e.network;
  }

  function initGate() {
    const form = $("#gate-form");
    const error = $("#gate-error");
    const submit = $("#gate-submit");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("#gate-name").value.trim().replace(/\s+/g, " ");
      const contact = $("#gate-contact").value.trim();
      if (!name || !contact) {
        error.textContent = CONFIG.gate.errors.missing;
        return;
      }
      error.textContent = "";
      submit.disabled = true;
      submit.classList.add("is-sending");
      try {
        const data = await api({ action: "login", name, contact });
        storeSession(data);
        save(CACHE_KEY, { content: data.content, guest: data.guest });
        enter(data.content, data.guest, true);
      } catch (err) {
        error.textContent = gateMessageFor(err.code === "signed_out" ? "no_match" : err.code);
      } finally {
        submit.disabled = false;
        submit.classList.remove("is-sending");
      }
    });
  }

  function signOut(message) {
    drop(SESSION_KEY);
    drop(CACHE_KEY);
    state.entered = false;
    state.content = null;
    state.guest = null;
    clearInterval(state.countdown);
    if (state.revealer) state.revealer.disconnect();
    if (state.spy) state.spy.disconnect();
    // Take the private content out of the page, not just out of sight.
    ["home", "story", "schedule", "travel", "faqs", "rsvp"].forEach((id) => { $("#" + id).replaceChildren(); });
    $("#main").hidden = true;
    $("#nav").hidden = true;
    closeMenu();
    showGate(message);
    window.scrollTo(0, 0);
  }

  /* ---------- Entering the site ---------- */
  function enter(content, guest, animate) {
    state.entered = true;
    state.content = content;
    state.guest = guest || null;

    renderAll(content);
    buildRsvp(state.guest);

    const gate = $("#gate");
    document.body.classList.remove("is-locked");
    $("#nav").hidden = false;
    $("#main").hidden = false;
    if (animate && !reduceMotion) {
      gate.classList.add("is-leaving");
      setTimeout(() => { gate.hidden = true; }, 1200);
    } else {
      gate.hidden = true;
    }

    startReveals();
    startScrollSpy();
    const hash = decodeURIComponent(location.hash.slice(1));
    if (hash && document.getElementById(hash)) requestAnimationFrame(() => scrollToId(hash, false));
    else if (animate) window.scrollTo(0, 0);
  }

  async function refresh(session, quiet) {
    try {
      const data = await api({ action: "session", token: session.token });
      storeSession(data);
      save(CACHE_KEY, { content: data.content, guest: data.guest });
      if (!state.entered) {
        enter(data.content, data.guest, true);
        return;
      }
      if (JSON.stringify(data.content) !== JSON.stringify(state.content)) {
        state.content = data.content;
        renderAll(data.content);
        startReveals();
        startScrollSpy();
      }
      state.guest = data.guest || state.guest;
      prefillRsvp(state.guest, false);
    } catch (err) {
      if (err.code === "signed_out") signOut(CONFIG.gate.errors.signedOut);
      else if (!quiet) showGate(gateMessageFor(err.code));
      // Otherwise (offline, say) keep showing what we already have.
    }
  }

  function renderAll(c) {
    renderHome(c.home || {});
    renderStory(c.story || {});
    renderSchedule(c.schedule || {});
    renderTravel(c.travel || {});
    renderFaqs(c.faqs || {});
  }

  /* ---------- Home ---------- */
  function renderHome(c) {
    const names = String(c.names || CONFIG.couple.names).split("&").map((s) => s.trim());
    const title = h("h1", { class: "hero__names script reveal r-rise", id: "home-title" },
      names.length === 2
        ? [h("span", { text: names[0] }), h("span", { class: "hero__amp", text: "&" }), h("span", { text: names[1] })]
        : names.join(" & "));

    const units = c.countdownUnits || { days: "Days", hours: "Hours", mins: "Mins", secs: "Secs" };
    const countdown = has(c.countdownTarget)
      ? h("div", { class: "countdown-wrap reveal r-rise", style: "--delay:0.6s" },
          has(c.countdownLabel) ? h("p", { class: "caps eyebrow", text: c.countdownLabel }) : null,
          h("div", { class: "countdown", id: "countdown", role: "timer", "aria-live": "off" },
            ["days", "hours", "mins", "secs"].map((u) =>
              h("div", { class: "countdown__unit" },
                h("span", { class: "countdown__num", "data-unit": u, text: "00" }),
                h("span", { class: "caps countdown__label", text: units[u] })))),
          h("p", { class: "countdown__done", id: "countdown-done", hidden: true, text: c.countdownDone || "" }))
      : null;

    const photo = has(c.heroImage)
      ? h("figure", { class: "hero__photo reveal r-fade", style: "--delay:0.3s" },
          h("div", { class: "arch" }, h("img", { src: safeSrc(c.heroImage), alt: c.heroAlt || "", loading: "eager", style: focus({ focus: c.heroFocus }) })),
          svgUse("ring-flower", "hero__bloom hero__bloom--a", "0 0 40 40"),
          svgUse("ring-flower", "hero__bloom hero__bloom--b", "0 0 40 40"))
      : null;

    $("#home").replaceChildren(
      svgUse("sprig", "sprig sprig--tl", "0 0 120 120"),
      svgUse("sprig", "sprig sprig--br", "0 0 120 120"),
      h("div", { class: "hero" },
        h("div", { class: "hero__text" },
          has(c.eyebrow) ? h("p", { class: "caps eyebrow reveal r-rise", text: c.eyebrow }) : null,
          title,
          h("span", { class: "rule reveal r-fade", "aria-hidden": "true" }),
          has(c.dates) ? h("p", { class: "hero__dates reveal r-rise", style: "--delay:0.2s", text: c.dates }) : null,
          has(c.venue) ? h("p", { class: "caps hero__venue reveal r-rise", style: "--delay:0.3s", text: c.venue }) : null,
          countdown,
          has(c.welcome) ? h("p", { class: "hero__welcome reveal r-rise", style: "--delay:0.8s", text: c.welcome }) : null,
          h("span", { class: "band reveal r-fade", style: "--delay:1s", "aria-hidden": "true" })),
        photo));

    startCountdown(c.countdownTarget);
  }

  function startCountdown(target) {
    clearInterval(state.countdown);
    const when = new Date(target).getTime();
    if (!target || Number.isNaN(when)) return;
    const els = {};
    $$("[data-unit]", $("#home")).forEach((el) => { els[el.dataset.unit] = el; });
    const pad = (n, len = 2) => String(n).padStart(len, "0");
    function tick() {
      const diff = Math.max(0, when - Date.now());
      const s = Math.floor(diff / 1000);
      els.days.textContent = pad(Math.floor(s / 86400), 3);
      els.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      els.mins.textContent = pad(Math.floor((s % 3600) / 60));
      els.secs.textContent = pad(s % 60);
      if (diff === 0) {
        clearInterval(state.countdown);
        const done = $("#countdown-done");
        if (done && done.textContent) done.hidden = false;
      }
    }
    tick();
    state.countdown = setInterval(tick, 1000);
  }

  /* ---------- Our Story ---------- */
  function renderStory(c) {
    const blocks = (c.blocks || []).filter((b) => has(b.text) || has(b.photos));
    $("#story").replaceChildren(
      sectionHeading("story-title", c.heading || ""),
      h("div", { class: "story" },
        blocks.map((b, i) =>
          h("div", { class: `story-block ${i % 2 ? "story-block--flip" : ""}` },
            has(b.photos) ? h("div", { class: "story-block__media reveal r-rise" }, storyFrame(b, i)) : null,
            has(b.text) ? h("p", { class: "story-block__text reveal r-rise", style: "--delay:0.25s", text: b.text }) : null))));
  }

  // Optional focus point for cropping, e.g. focus: "50% 30%".
  function focus(p) {
    return /^[\d.]+% [\d.]+%$/.test(String(p.focus || "")) ? `object-position:${p.focus}` : null;
  }

  function storyFrame(block, i) {
    const photos = block.photos.filter((p) => has(p.src));
    if (block.frame === "strip") {
      return h("div", { class: "booth-strip" },
        photos.map((p) => h("img", { src: safeSrc(p.src), alt: p.alt || "", loading: "lazy", style: focus(p) })),
        h("span", { class: "booth-strip__caption caps", text: CONFIG.couple.initials }));
    }
    return h("div", { class: "polaroids" },
      photos.map((p, j) =>
        h("figure", { class: `polaroid ${(i + j) % 2 ? "polaroid--right" : "polaroid--left"}` },
          h("img", { src: safeSrc(p.src), alt: p.alt || "", loading: "lazy", style: focus(p) }),
          has(p.caption) ? h("figcaption", { class: "script", text: p.caption }) : h("span", { class: "polaroid__blank", "aria-hidden": "true" }))));
  }

  /* ---------- Schedule ---------- */
  function renderSchedule(c) {
    $("#schedule").replaceChildren(
      sectionHeading("schedule-title", c.heading || ""),
      has(c.intro) ? h("p", { class: "section__intro reveal r-rise", text: c.intro }) : null,
      h("div", { class: "days" },
        (c.days || []).map((day, i) =>
          h("article", { class: "day-card reveal r-rise", style: `--delay:${(i * 0.15).toFixed(2)}s` },
            h("header", { class: "day-card__head" },
              has(day.weekday) ? h("p", { class: "caps day-card__weekday", text: day.weekday }) : null,
              h("h3", { class: "script day-card__date", text: day.date || "" }),
              has(day.dressCode)
                ? h("p", { class: "day-card__dress" }, h("span", { class: "caps", text: (c.dressCodeLabel || "Dress code") + " " }), day.dressCode)
                : null),
            h("ol", { class: "events" },
              (day.events || []).map((ev) =>
                h("li", { class: "event" },
                  h("h4", { class: "event__name", text: ev.name || "" }),
                  has(ev.when) ? h("p", { class: "caps event__when", text: ev.when }) : null,
                  has(ev.note) ? h("p", { class: "event__note", text: ev.note }) : null,
                  ev.toFollow ? h("p", { class: "tbc", text: c.toFollowLabel || "Details to follow" }) : null)))))),
      has(c.note) ? h("p", { class: "note reveal r-rise", text: c.note }) : null);
  }

  /* ---------- Travel & Stay ---------- */
  function card(title, ...body) {
    return h("article", { class: "card reveal r-rise" },
      has(title) ? h("h3", { class: "caps card__title", text: title }) : null,
      body);
  }
  const para = (text, cls = "") => (has(text) ? h("p", { class: cls || null, text }) : null);

  function renderTravel(c) {
    const v = c.venue || {};
    const g = c.gettingThere || {};
    const s = c.stay || {};
    const n = c.nearby || {};
    const hol = c.holiday || {};
    const ins = c.inspiration || {};
    const link = (url, label) => (safeHref(url) && has(label)
      ? h("a", { class: "text-link caps", href: safeHref(url), target: "_blank", rel: "noopener", text: label })
      : null);

    const venueCard = h("article", { class: "card card--venue reveal r-rise" },
      has(v.label) ? h("p", { class: "caps eyebrow", text: v.label }) : null,
      h("h3", { class: "script card__venue-name", text: v.name || "" }),
      has(v.place) ? h("p", { class: "caps card__place", text: v.place }) : null,
      h("p", { class: "card__links" }, link(v.website, v.websiteLabel), link(v.mapUrl, v.mapLabel)));

    const taxis = (g.taxis || []).filter((t) => has(t.name) || has(t.phone));
    const nearby = (n.items || []).filter((i) => has(i.name));

    $("#travel").replaceChildren(
      sectionHeading("travel-title", c.heading || ""),
      has(c.intro) ? h("p", { class: "section__intro reveal r-rise", text: c.intro }) : null,
      venueCard,
      h("div", { class: "cards" },
        card(g.title, para(g.text),
          has(taxis) ? h("div", { class: "subcard" },
            h("h4", { class: "caps subcard__title", text: g.taxisTitle || "" }),
            h("ul", { class: "plain-list" }, taxis.map((t) =>
              h("li", null,
                h("span", { class: "plain-list__name", text: t.name || "" }),
                has(t.phone) ? h("a", { href: "tel:" + String(t.phone).replace(/[^\d+]/g, ""), text: t.phone }) : null,
                has(t.note) ? h("span", { class: "plain-list__note", text: t.note }) : null)))) : null),
        card(s.title, para(s.text), has(s.rooms) ? h("p", { class: "tbc", text: s.rooms }) : null),
        has(nearby) ? card(n.title,
          h("ul", { class: "plain-list" }, nearby.map((i) =>
            h("li", null,
              safeHref(i.url)
                ? h("a", { class: "plain-list__name", href: safeHref(i.url), target: "_blank", rel: "noopener", text: i.name })
                : h("span", { class: "plain-list__name", text: i.name }),
              has(i.note) ? h("span", { class: "plain-list__note", text: i.note }) : null)))) : null,
        has(hol.text) ? card(hol.title, para(hol.text)) : null),
      (ins.groups || []).length
        ? h("div", { class: "inspiration reveal r-rise" },
            h("h3", { class: "script inspiration__title", text: ins.title || "" }),
            para(ins.intro, "section__intro"),
            h("div", { class: "inspiration__groups" },
              ins.groups.filter((gr) => has(gr.items)).map((gr) =>
                h("div", { class: "inspiration__group" },
                  h("h4", { class: "caps", text: gr.title || "" }),
                  h("ul", { class: "plain-list" }, gr.items.map((i) =>
                    h("li", null,
                      h("span", { class: "plain-list__name", text: i.name || "" }),
                      has(i.note) ? h("span", { class: "plain-list__note", text: i.note }) : null)))))),
            has(ins.tip) ? h("p", { class: "tip" }, svgUse("ring-flower", "tip__bloom", "0 0 40 40"), h("span", { text: ins.tip })) : null)
        : null);
  }

  /* ---------- Q&A ---------- */
  function renderFaqs(c) {
    const contacts = (c.contacts || []).filter((p) => has(p.name) && (has(p.phone) || has(p.email)));
    $("#faqs").replaceChildren(
      sectionHeading("faqs-title", c.heading || ""),
      has(c.intro) ? h("p", { class: "section__intro reveal r-rise", text: c.intro }) : null,
      h("div", { class: "faqs" },
        (c.items || []).map((item) =>
          h("details", { class: "faq reveal r-rise" },
            h("summary", { class: "faq__q" }, h("span", { text: item.q || "" }), h("span", { class: "faq__icon", "aria-hidden": "true" })),
            h("div", { class: "faq__a" },
              para(item.a),
              item.showContacts && has(contacts)
                ? h("ul", { class: "plain-list contacts" }, contacts.map((p) =>
                    h("li", null,
                      h("span", { class: "plain-list__name", text: p.name }),
                      has(p.phone) ? h("a", { href: "tel:" + String(p.phone).replace(/[^\d+]/g, ""), text: p.phone }) : null,
                      has(p.email) ? h("a", { href: "mailto:" + String(p.email).trim(), text: p.email }) : null)))
                : null)))));
  }

  /* ---------- RSVP ---------- */
  let rsvpDirty = false;

  function field(id, labelText, control, opts = {}) {
    return h("div", { class: "field", id: opts.wrapId || null, hidden: opts.hidden || null },
      h("label", { class: "field__label caps", for: id, text: labelText }),
      has(opts.hint) ? h("p", { class: "field__hint", id: id + "-hint", text: opts.hint }) : null,
      control,
      h("p", { class: "field__error", "data-error-for": opts.errorFor || control.name }));
  }

  function buildRsvp(guest) {
    const R = CONFIG.rsvp;
    rsvpDirty = false;

    const input = (id, name, type = "text", extra = {}) =>
      h("input", Object.assign({ class: "field__input", id, name, type }, extra));
    const area = (id, name, rows, extra = {}) =>
      h("textarea", Object.assign({ class: "field__input", id, name, rows: String(rows) }, extra));
    const radio = (name, value, label) =>
      h("label", { class: "choice" }, h("input", { type: "radio", name, value }), h("span", { text: label }));

    const party = h("select", { class: "field__input field__select", id: "rsvp-party", name: "partySize" });
    for (let n = 1; n <= R.party.max; n++) {
      party.append(h("option", { value: String(n), text: n === 1 ? R.party.one : R.party.many(n) }));
    }
    const gender = h("select", { class: "field__input field__select", id: "rsvp-gender", name: "pairingGender" },
      h("option", { value: "", text: R.solo.genderChoose }),
      R.solo.genderOptions.map((g) => h("option", { value: g, text: g })));

    const form = h("form", { class: "rsvp", id: "rsvp-form", novalidate: true },
      h("p", { class: "rsvp__intro", text: R.intro }),
      h("div", { class: "hp", "aria-hidden": "true" },
        h("label", { for: "rsvp-website", text: "Website" }),
        input("rsvp-website", "website", "text", { tabindex: "-1", autocomplete: "off" })),
      field("rsvp-name", R.name.label, input("rsvp-name", "name", "text", { autocomplete: "name", required: true })),
      field("rsvp-contact", R.contact.label,
        input("rsvp-contact", "contact", "text", { autocomplete: "email", inputmode: "email", autocapitalize: "none", spellcheck: "false", required: true, "aria-describedby": "rsvp-contact-hint" }),
        { hint: R.contact.hint }),
      h("fieldset", { class: "field" },
        h("legend", { class: "field__label caps", text: R.attending.label }),
        h("p", { class: "field__hint", text: R.attending.hint }),
        h("div", { class: "choices" }, radio("attending", "Yes", R.attending.yes), radio("attending", "No", R.attending.no)),
        h("p", { class: "field__error", "data-error-for": "attending" })),
      h("div", { class: "if-attending", id: "if-attending", hidden: true },
        field("rsvp-party", R.party.label, party),
        field("rsvp-others", R.others.label, area("rsvp-others", "otherGuests", 2, { "aria-describedby": "rsvp-others-hint" }),
          { hint: R.others.hint, wrapId: "field-others", hidden: true }),
        field("rsvp-dietary", R.dietary.label, area("rsvp-dietary", "dietary", 2, { "aria-describedby": "rsvp-dietary-hint" }),
          { hint: R.dietary.hint }),
        h("fieldset", { class: "field", id: "field-solo", hidden: true },
          h("legend", { class: "field__label caps", text: R.solo.label }),
          h("p", { class: "field__hint", text: R.solo.hint }),
          h("div", { class: "choices choices--stacked" }, R.solo.options.map((o) => radio("soloPreference", o, o))),
          h("p", { class: "field__error", "data-error-for": "soloPreference" }),
          field("rsvp-roommate", R.solo.roommateLabel, input("rsvp-roommate", "roommateName", "text", { autocomplete: "off" }),
            { wrapId: "field-roommate", hidden: true }),
          field("rsvp-gender", R.solo.genderLabel, gender,
            { hint: R.solo.genderHint, wrapId: "field-gender", hidden: true }))),
      field("rsvp-message", R.message.label, area("rsvp-message", "message", 3, { "aria-describedby": "rsvp-message-hint" }),
        { hint: R.message.hint }),
      h("p", { class: "rsvp__error", id: "rsvp-error", role: "alert", hidden: true }),
      h("button", { class: "pill pill--solid", id: "rsvp-submit", type: "submit" },
        h("span", { class: "pill__label", text: R.submit }),
        h("span", { class: "pill__sending", text: R.sending })));

    const thanks = h("div", { class: "thanks", id: "rsvp-thanks", hidden: true, tabindex: "-1" },
      h("p", { class: "script thanks__title", id: "thanks-title" }),
      h("p", { class: "thanks__text", id: "thanks-text" }),
      h("span", { class: "rule rule--short", "aria-hidden": "true" }),
      h("button", { class: "link-button caps", id: "rsvp-again", type: "button", text: CONFIG.thanks.again }));

    $("#rsvp").replaceChildren(
      sectionHeading("rsvp-title", R.heading),
      h("div", { class: "rsvp-wrap reveal r-rise" }, form, thanks));

    form.addEventListener("input", () => { rsvpDirty = true; });
    form.addEventListener("change", () => { rsvpDirty = true; syncRsvp(); });
    form.addEventListener("submit", onRsvpSubmit);
    $("#rsvp-again").addEventListener("click", () => {
      thanks.hidden = true;
      form.hidden = false;
      $("#rsvp-name").focus();
    });

    prefillRsvp(guest, true);
  }

  function prefillRsvp(guest, force) {
    const form = $("#rsvp-form");
    if (!form || !guest || (rsvpDirty && !force)) return;
    const set = (name, value) => { if (form.elements[name] && value != null) form.elements[name].value = String(value); };
    set("name", guest.name);
    set("contact", guest.contact);
    $$('input[name="attending"]', form).forEach((r) => { r.checked = r.value === guest.attending; });
    const size = parseInt(guest.partySize, 10);
    if (size >= 1 && size <= CONFIG.rsvp.party.max) set("partySize", size);
    set("otherGuests", guest.otherGuests);
    set("dietary", guest.dietary);
    $$('input[name="soloPreference"]', form).forEach((r) => { r.checked = r.value === guest.soloPreference; });
    set("roommateName", guest.roommateName);
    if (CONFIG.rsvp.solo.genderOptions.includes(guest.pairingGender)) set("pairingGender", guest.pairingGender);
    set("message", guest.message);
    syncRsvp();
  }

  function rsvpValue(name) {
    const form = $("#rsvp-form");
    const el = form.querySelector(`[name="${name}"]:checked`) || form.elements[name];
    return el && (el.type !== "radio" || el.checked) ? String(el.value || "").trim() : "";
  }

  function syncRsvp() {
    const yes = rsvpValue("attending") === "Yes";
    const size = parseInt(rsvpValue("partySize"), 10) || 1;
    const solo = rsvpValue("soloPreference");
    const [, share, pair] = CONFIG.rsvp.solo.options;
    $("#if-attending").hidden = !yes;
    $("#field-others").hidden = !(yes && size > 1);
    $("#field-solo").hidden = !(yes && size === 1);
    $("#field-roommate").hidden = !(yes && size === 1 && solo === share);
    $("#field-gender").hidden = !(yes && size === 1 && solo === pair);
  }

  function looksLikeContact(s) {
    return s.includes("@") ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.replace(/\s+/g, "")) : s.replace(/\D/g, "").length >= 7;
  }

  function collectRsvp() {
    const yes = rsvpValue("attending") === "Yes";
    const partySize = yes ? parseInt(rsvpValue("partySize"), 10) || 1 : 0;
    const solo = yes && partySize === 1 ? rsvpValue("soloPreference") : "";
    const [, share, pair] = CONFIG.rsvp.solo.options;
    return {
      website: rsvpValue("website"),
      name: rsvpValue("name").replace(/\s+/g, " "),
      contact: rsvpValue("contact"),
      attending: rsvpValue("attending"),
      partySize,
      otherGuests: yes && partySize > 1 ? rsvpValue("otherGuests") : "",
      dietary: yes ? rsvpValue("dietary") : "",
      soloPreference: solo,
      roommateName: solo === share ? rsvpValue("roommateName") : "",
      pairingGender: solo === pair ? rsvpValue("pairingGender") : "",
      message: rsvpValue("message"),
    };
  }

  function validateRsvp(d) {
    const R = CONFIG.rsvp;
    const form = $("#rsvp-form");
    const [, share, pair] = R.solo.options;
    let firstBad = null;
    $$("[data-error-for]", form).forEach((el) => {
      el.textContent = "";
      el.closest(".field").classList.remove("has-error");
    });
    const fail = (name, msg, focusSel) => {
      const el = form.querySelector(`[data-error-for="${name}"]`);
      el.textContent = msg;
      el.closest(".field").classList.add("has-error");
      if (!firstBad) firstBad = form.querySelector(focusSel);
    };
    if (!d.name) fail("name", R.name.required, "#rsvp-name");
    if (!looksLikeContact(d.contact)) fail("contact", R.contact.required, "#rsvp-contact");
    if (!d.attending) fail("attending", R.attending.required, 'input[name="attending"]');
    if (d.attending === "Yes") {
      if (d.partySize > 1 && !d.otherGuests) fail("otherGuests", R.others.required, "#rsvp-others");
      if (d.partySize === 1) {
        if (!d.soloPreference) fail("soloPreference", R.solo.required, 'input[name="soloPreference"]');
        if (d.soloPreference === share && !d.roommateName) fail("roommateName", R.solo.roommateRequired, "#rsvp-roommate");
        if (d.soloPreference === pair && !d.pairingGender) fail("pairingGender", R.solo.genderRequired, "#rsvp-gender");
      }
    }
    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  async function onRsvpSubmit(e) {
    e.preventDefault();
    const errorBox = $("#rsvp-error");
    const submit = $("#rsvp-submit");
    errorBox.hidden = true;
    const data = collectRsvp();
    if (!validateRsvp(data)) return;

    const session = load(SESSION_KEY);
    if (!session || !session.token) {
      signOut(CONFIG.gate.errors.signedOut);
      return;
    }

    submit.disabled = true;
    submit.classList.add("is-sending");
    try {
      const res = await api(Object.assign({ action: "rsvp", token: session.token }, data));
      if (res.token) {
        storeSession(res);
        state.guest = res.guest || state.guest;
        save(CACHE_KEY, { content: state.content, guest: state.guest });
      } else {
        // They've said no, so this device won't be let back in next time.
        drop(SESSION_KEY);
        drop(CACHE_KEY);
      }
      rsvpDirty = false;
      showThanks(data.attending === "Yes");
    } catch (err) {
      if (err.code === "signed_out") {
        signOut(CONFIG.gate.errors.signedOut);
        return;
      }
      errorBox.textContent = CONFIG.rsvp.error;
      errorBox.hidden = false;
      errorBox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    } finally {
      submit.disabled = false;
      submit.classList.remove("is-sending");
    }
  }

  function showThanks(yes) {
    const thanks = $("#rsvp-thanks");
    $("#thanks-title").textContent = yes ? CONFIG.thanks.yesTitle : CONFIG.thanks.noTitle;
    $("#thanks-text").textContent = yes ? CONFIG.thanks.yesText : CONFIG.thanks.noText;
    $("#rsvp-again").hidden = !yes;
    $("#rsvp-form").hidden = true;
    thanks.hidden = false;
    thanks.focus({ preventScroll: true });
    thanks.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }

  /* ---------- Nav ---------- */
  function buildNav() {
    $("#nav-list").replaceChildren(...CONFIG.nav.items.map((item) =>
      h("li", null, h("a", { class: "nav__link", href: "#" + item.id, "data-nav": item.id, text: item.label }))));
  }

  function closeMenu() {
    document.body.classList.remove("menu-open");
    $("#nav-toggle").setAttribute("aria-expanded", "false");
  }

  function initNav() {
    const toggle = $("#nav-toggle");
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("menu-open", open);
    });
    $("#nav").addEventListener("click", (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      e.preventDefault();
      const id = a.getAttribute("href").slice(1);
      closeMenu();
      scrollToId(id);
      history.replaceState(null, "", "#" + id);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
        closeMenu();
        toggle.focus();
      }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", (mq) => { if (mq.matches) closeMenu(); });
  }

  function startScrollSpy() {
    if (state.spy) state.spy.disconnect();
    if (!("IntersectionObserver" in window)) return;
    const links = $$("[data-nav]");
    state.spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((l) => {
          const on = l.dataset.nav === entry.target.id;
          l.classList.toggle("is-current", on);
          if (on) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("#main > section").forEach((s) => state.spy.observe(s));
  }

  /* ---------- Reveal on scroll ---------- */
  function startReveals() {
    if (state.revealer) state.revealer.disconnect();
    const items = $$("#main .reveal:not(.is-in)");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    state.revealer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          state.revealer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el) => state.revealer.observe(el));
  }

  /* ---------- Go ---------- */
  applyCopy();
  buildNav();
  initNav();
  initGate();
  $("#sign-out").addEventListener("click", () => signOut(""));

  const session = load(SESSION_KEY);
  if (session && session.token && session.exp > Date.now()) {
    const cached = load(CACHE_KEY);
    if (cached && cached.content) {
      enter(cached.content, cached.guest, false);
      refresh(session, true);
    } else {
      showGateLoading();
      refresh(session, false);
    }
  } else {
    drop(SESSION_KEY);
    drop(CACHE_KEY);
    showGate();
  }
})();

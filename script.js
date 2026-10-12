/* ==========================================================================
   Jessica & Gaurav · wedding site
   Settings and every line the form says are in this top section.
   ========================================================================== */

// Paste your Google Apps Script web app URL here (ends in /exec). See README.
const APPS_SCRIPT_URL = "";

// The countdown counts down to this moment (+05:30 is India time).
const COUNTDOWN_TO = "2027-11-06T00:00:00+05:30";

const COPY = {
  gate: {
    wrong: "That's not quite it. The code is in the message that came with our save-the-date.",
    empty: "Please type the invite code.",
    slow: "Too many tries. Please wait a few minutes and try again.",
    offline: "We couldn't check the code just now. Please check your connection and try again.",
    notReady: "The site isn't connected yet. Please try again soon.",
  },
  steps: {
    count: (n, total) => `Step ${n} of ${total}`,
    next: "Next",
    back: "Back",
    send: "Send RSVP",
    sending: "Sending…",
    retry: "Try again",
  },
  you: {
    title: "About you",
    name: "Your name",
    nameHint: "Full name, please. If you're replying for a group, that's you.",
    email: "Email",
    phone: "Phone or WhatsApp",
    phoneHint: "We'll use these to send you room details later.",
    countryLabel: "Country code",
    numberLabel: "Number",
    errName: "Please add your name.",
    errEmail: "Please check your email address.",
    errPhone: "Please add your phone number, including the area code.",
  },
  attend: {
    title: "Can you make it?",
    hint: "It's all three days, 6 to 8 November, or not at all.",
    yes: "Joyfully attending",
    no: "Sadly can't make it",
    err: "Please choose one.",
  },
  party: {
    title: "Your party",
    size: "How many in your party, including you?",
    errSize: "Please choose a number.",
    others: "Names of everyone else in your party",
    othersHint: "Full names, separated by commas.",
    errOthers: "Please add their names.",
    stay: "Coming on your own? How would you like to stay?",
    stayOptions: {
      own: "My own room",
      roommate: "I already have a roommate in mind",
      pair: "Pair me with another solo guest",
    },
    errStay: "Please choose one.",
    roommate: "Your roommate's name",
    errRoommate: "Please add their name.",
    pairing: "So we can pair you well, you'd prefer to share with:",
    pairingOptions: { woman: "A woman", man: "A man" },
    errPairing: "Please choose one.",
  },
  needs: {
    title: "Food and getting around",
    dietary: "Dietary needs or allergies for anyone in your party",
    dietaryHint: "All the food is vegetarian. Tell us about allergies, if you'd like it non-spicy, or anything you can't eat.",
    help: "Travelling with a baby or with someone who needs extra help getting around?",
    helpHint: "Optional. Tick anything that helps.",
    helpOptions: { cot: "Cot", highchair: "High chair", mobility: "Mobility help" },
    notes: "Anything else we should know?",
  },
  message: {
    title: "One last thing",
    label: "Message for the couple",
    hint: "Optional.",
  },
  sendError: "We couldn't send your RSVP. Please check your connection and press Try again. Your answers are still here.",
  notReady: "RSVPs aren't open yet. Your answers are saved on this phone, so please try again soon.",
  lookup: {
    err: "Please type the email you used.",
    notFound: "We couldn't find an RSVP with that email. You can fill in the form below.",
    found: "We've loaded your answers. Change anything you like and send it again.",
    offline: "We couldn't look that up just now. Please check your connection and try again.",
  },
  done: {
    yesTitle: (name) => `Thank you, ${name}.`,
    yesText: "You're on the list. We can't wait to see you in Udaipur.",
    noTitle: (name) => `Thank you, ${name}.`,
    noText: "We'll miss you, and we'll celebrate together another time.",
    summary: "What you told us",
    edit: "Need to change something? Come back any time, press \"Update your RSVP\" and use the same email.",
    again: "Change my answers",
  },
  summary: {
    name: "Name", email: "Email", phone: "Phone", attending: "Coming",
    yes: "Yes", no: "No", party: "Party size", others: "Also in your party",
    stay: "Room", roommate: "Roommate", pairing: "Prefer to share with",
    dietary: "Dietary needs", help: "Extra help", notes: "Notes", message: "Message for the couple",
  },
};

// Country codes shown in the phone field. Most of our guests are in these.
const COUNTRY_CODES = [
  ["+91", "India"], ["+971", "UAE"], ["+44", "UK"], ["+46", "Sweden"],
  ["+1", "USA / Canada"], ["+34", "Spain"], ["+33", "France"], ["+49", "Germany"],
  ["+31", "Netherlands"], ["+41", "Switzerland"], ["+353", "Ireland"], ["+39", "Italy"],
  ["+45", "Denmark"], ["+47", "Norway"], ["+358", "Finland"], ["+32", "Belgium"],
  ["+43", "Austria"], ["+974", "Qatar"], ["+966", "Saudi Arabia"], ["+968", "Oman"],
  ["+973", "Bahrain"], ["+965", "Kuwait"], ["+65", "Singapore"], ["+852", "Hong Kong"],
  ["+61", "Australia"], ["+64", "New Zealand"], ["+27", "South Africa"], ["+254", "Kenya"],
  ["other", "Other (type the code)"],
];

/* ==========================================================================
   You shouldn't need to edit below this line.
   ========================================================================== */

(function () {
  "use strict";

  const KEYS = { code: "jg-code", draft: "jg-draft", schedule: "jg-schedule" };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Storage (fails quietly in private browsing) ---------- */
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* fine */ } },
    drop(k) { try { localStorage.removeItem(k); } catch (e) { /* fine */ } },
  };

  /* ---------- Element helper (text is always set as text, never HTML) ---------- */
  function h(tag, props, ...kids) {
    const el = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, v]) => {
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    kids.flat(Infinity).forEach((kid) => {
      if (kid == null || kid === false || kid === "") return;
      el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    });
    return el;
  }

  /* ---------- Talking to the Google Apps Script ---------- */
  class ApiError extends Error { constructor(code) { super(code); this.code = code; } }

  // Sent as text/plain so the browser makes a "simple" request, which Apps
  // Script accepts. Google's reply comes back through a redirect we can read.
  async function api(payload) {
    if (!APPS_SCRIPT_URL) throw new ApiError("not_configured");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    let res;
    try {
      res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
        signal: ctrl.signal,
      });
    } catch (e) {
      throw new ApiError("network");
    } finally {
      clearTimeout(timer);
    }
    let data;
    try { data = await res.json(); } catch (e) { throw new ApiError("network"); }
    if (!data || data.ok !== true) throw new ApiError((data && data.error) || "server");
    return data;
  }

  /* ---------- Invite code ---------- */
  function unlock(animate) {
    document.body.classList.remove("is-locked");
    $("#bar").hidden = false;
    $("#site").hidden = false;
    const gate = $("#gate");
    if (animate && !reduceMotion) {
      gate.classList.add("is-leaving");
      setTimeout(() => { gate.hidden = true; }, 1000);
    } else {
      gate.hidden = true;
    }
    startFades();
  }

  function initGate() {
    if (store.get(KEYS.code)) { unlock(false); return; }
    const form = $("#gate-form");
    const input = $("#gate-code");
    const error = $("#gate-error");
    const button = $("#gate-submit");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = input.value.trim();
      if (!code) { error.textContent = COPY.gate.empty; input.focus(); return; }
      error.textContent = "";
      button.disabled = true;
      button.classList.add("is-busy");
      try {
        await api({ action: "check", code });
        store.set(KEYS.code, code);
        unlock(true);
      } catch (err) {
        error.textContent = {
          bad_code: COPY.gate.wrong, slow_down: COPY.gate.slow, not_configured: COPY.gate.notReady,
        }[err.code] || COPY.gate.offline;
        input.select();
      } finally {
        button.disabled = false;
        button.classList.remove("is-busy");
      }
    });
  }

  /* ---------- Countdown ---------- */
  function initCountdown() {
    const target = new Date(COUNTDOWN_TO).getTime();
    const els = {};
    $$("[data-unit]").forEach((el) => { els[el.dataset.unit] = el; });
    const pad = (n) => String(n).padStart(2, "0");
    let timer;
    function tick() {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      els.days.textContent = String(Math.floor(s / 86400));
      els.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      els.mins.textContent = pad(Math.floor((s % 3600) / 60));
      els.secs.textContent = pad(s % 60);
      if (s === 0) clearInterval(timer);
    }
    tick();
    timer = setInterval(tick, 1000);
  }

  /* ---------- RSVP form ---------- */
  const form = $("#rsvp-form");
  let current = "you";

  function field(id, label, control, hint, extraClass) {
    return h("div", { class: `field ${extraClass || ""}`.trim(), id: `f-${id}` },
      h("label", { class: "label", for: id, text: label }),
      hint ? h("p", { class: "hint", id: `${id}-hint`, text: hint }) : null,
      control,
      h("p", { class: "error", id: `${id}-error`, role: "alert" }));
  }
  function group(id, legend, hint, choices, hideLegend) {
    return h("fieldset", { class: "field", id: `f-${id}` },
      h("legend", { class: hideLegend ? "sr" : "label", text: legend }),
      hint ? h("p", { class: "hint", text: hint }) : null,
      choices,
      h("p", { class: "error", id: `${id}-error`, role: "alert" }));
  }
  const input = (id, attrs) => h("input", Object.assign({ class: "input", id, name: id }, attrs));
  const area = (id, attrs) => h("textarea", Object.assign({ class: "input", id, name: id, rows: "3" }, attrs));
  const choice = (type, name, value, label) =>
    h("label", { class: "choice" }, h("input", { type, name, value }), h("span", { text: label }));

  function buildForm() {
    const C = COPY;
    const country = h("select", { class: "input", id: "phoneCode", name: "phoneCode", "aria-label": C.you.countryLabel },
      COUNTRY_CODES.map(([code, label]) => h("option", { value: code, text: code === "other" ? label : `${label} ${code}` })));

    const steps = {
      you: h("fieldset", { class: "step", "data-step": "you" },
        h("p", { class: "step__count" }),
        h("legend", { class: "step__title", text: C.you.title }),
        field("name", C.you.name, input("name", { type: "text", autocomplete: "name", "aria-describedby": "name-hint name-error" }), C.you.nameHint),
        field("email", C.you.email, input("email", { type: "email", autocomplete: "email", inputmode: "email", autocapitalize: "none", spellcheck: "false" })),
        h("div", { class: "field", id: "f-phone" },
          h("label", { class: "label", for: "phoneNumber", text: C.you.phone }),
          h("p", { class: "hint", id: "phone-hint", text: C.you.phoneHint }),
          h("div", { class: "phone" }, country,
            input("phoneNumber", { type: "tel", autocomplete: "tel-national", inputmode: "tel", "aria-describedby": "phone-hint phone-error" })),
          h("p", { class: "error", id: "phone-error", role: "alert" }))),

      attend: h("fieldset", { class: "step", "data-step": "attend" },
        h("p", { class: "step__count" }),
        h("legend", { class: "step__title", text: C.attend.title }),
        group("attending", C.attend.title, C.attend.hint,
          h("div", { class: "choices" }, choice("radio", "attending", "Yes", C.attend.yes), choice("radio", "attending", "No", C.attend.no)), true)),

      party: h("fieldset", { class: "step", "data-step": "party" },
        h("p", { class: "step__count" }),
        h("legend", { class: "step__title", text: C.party.title }),
        group("partySize", C.party.size, null,
          h("div", { class: "chips" }, [1, 2, 3, 4, 5, 6, 7, 8].map((n) =>
            h("label", { class: "chip" }, h("input", { type: "radio", name: "partySize", value: String(n), "aria-label": String(n) }), h("span", { text: String(n) }))))),
        field("others", C.party.others, area("others", { "aria-describedby": "others-hint others-error" }), C.party.othersHint),
        group("stay", C.party.stay, null,
          h("div", { class: "choices" }, Object.entries(C.party.stayOptions).map(([v, l]) => choice("radio", "stay", v, l)))),
        field("roommate", C.party.roommate, input("roommate", { type: "text", autocomplete: "off" })),
        group("pairing", C.party.pairing, null,
          h("div", { class: "choices" }, Object.entries(C.party.pairingOptions).map(([v, l]) => choice("radio", "pairing", v, l))))),

      needs: h("fieldset", { class: "step", "data-step": "needs" },
        h("p", { class: "step__count" }),
        h("legend", { class: "step__title", text: C.needs.title }),
        field("dietary", C.needs.dietary, area("dietary", { "aria-describedby": "dietary-hint" }), C.needs.dietaryHint),
        group("help", C.needs.help, C.needs.helpHint,
          h("div", { class: "choices" }, Object.entries(C.needs.helpOptions).map(([v, l]) => choice("checkbox", "help", v, l)))),
        field("accessNotes", C.needs.notes, area("accessNotes", {}))),

      message: h("fieldset", { class: "step", "data-step": "message" },
        h("p", { class: "step__count" }),
        h("legend", { class: "step__title", text: C.message.title }),
        field("message", C.message.label, area("message", { rows: "4", "aria-describedby": "message-hint" }), C.message.hint)),
    };

    form.append(
      h("div", { class: "hp", "aria-hidden": "true" }, h("label", { for: "website", text: "Website" }), input("website", { type: "text", tabindex: "-1", autocomplete: "off" })),
      ...Object.values(steps),
      h("p", { class: "form__error", id: "form-error", role: "alert", hidden: true }),
      h("div", { class: "step__nav" },
        h("button", { class: "button button--quiet", id: "step-back", type: "button", text: COPY.steps.back }),
        h("button", { class: "button", id: "step-next", type: "submit" },
          h("span", { class: "button__label", id: "step-next-label", text: COPY.steps.next }),
          h("span", { class: "button__busy", text: COPY.steps.sending }))));

    form.addEventListener("change", () => { syncFields(); saveDraft(); });
    form.addEventListener("input", saveDraft);
    form.addEventListener("submit", onNext);
    $("#step-back").addEventListener("click", onBack);
  }

  /* Reading and writing the form */
  function val(name) {
    const els = form.elements[name];
    if (!els) return "";
    if (els instanceof RadioNodeList || (els.length && els[0] && els[0].type)) {
      const list = Array.from(els);
      if (list[0].type === "checkbox") return list.filter((e) => e.checked).map((e) => e.value);
      const on = list.find((e) => e.checked);
      return on ? on.value : "";
    }
    if (els.type === "checkbox") return els.checked ? [els.value] : [];
    if (els.type === "radio") return els.checked ? els.value : "";
    return String(els.value || "").trim();
  }

  function collect() {
    const yes = val("attending") === "Yes";
    const size = yes ? parseInt(val("partySize"), 10) || 0 : 0;
    const stay = yes && size === 1 ? val("stay") : "";
    const code = val("phoneCode");
    const number = val("phoneNumber");
    return {
      website: val("website"),
      name: val("name").replace(/\s+/g, " "),
      email: val("email").toLowerCase(),
      phone: code === "other" ? number : `${code} ${number.replace(/^0+/, "")}`.trim(),
      phoneCode: code,
      phoneNumber: number,
      attending: val("attending"),
      partySize: size,
      others: yes && size > 1 ? val("others") : "",
      stay,
      roommate: stay === "roommate" ? val("roommate") : "",
      pairing: stay === "pair" ? val("pairing") : "",
      dietary: yes ? val("dietary") : "",
      help: yes ? val("help") : [],
      accessNotes: yes ? val("accessNotes") : "",
      message: val("message"),
    };
  }

  function fill(d) {
    if (!d) return;
    const set = (name, v) => { if (form.elements[name] && v != null) form.elements[name].value = v; };
    const check = (name, values) => {
      const list = [].concat(values || []);
      $$(`input[name="${name}"]`, form).forEach((e) => { e.checked = list.includes(e.value); });
    };
    set("name", d.name);
    set("email", d.email);
    if (d.phoneCode && COUNTRY_CODES.some(([c]) => c === d.phoneCode)) {
      set("phoneCode", d.phoneCode);
      set("phoneNumber", d.phoneNumber);
    } else if (d.phone) {
      const hit = COUNTRY_CODES.filter(([c]) => c !== "other").sort((a, b) => b[0].length - a[0].length)
        .find(([c]) => d.phone.replace(/\s/g, "").startsWith(c));
      set("phoneCode", hit ? hit[0] : "other");
      set("phoneNumber", hit ? d.phone.replace(/\s/g, "").slice(hit[0].length) : d.phone);
    }
    check("attending", d.attending);
    check("partySize", d.partySize ? String(d.partySize) : "");
    set("others", d.others);
    check("stay", d.stay);
    set("roommate", d.roommate);
    check("pairing", d.pairing);
    set("dietary", d.dietary);
    check("help", d.help);
    set("accessNotes", d.accessNotes);
    set("message", d.message);
    syncFields();
  }

  function saveDraft() { store.set(KEYS.draft, collect()); }

  /* Which steps apply, and which follow-up questions show */
  function stepOrder() {
    return val("attending") === "No" ? ["you", "attend", "message"] : ["you", "attend", "party", "needs", "message"];
  }

  function syncFields() {
    const size = parseInt(val("partySize"), 10) || 0;
    const stay = val("stay");
    $("#f-others").hidden = !(size > 1);
    $("#f-stay").hidden = size !== 1;
    $("#f-roommate").hidden = !(size === 1 && stay === "roommate");
    $("#f-pairing").hidden = !(size === 1 && stay === "pair");
  }

  function showStep(name, focus) {
    current = name;
    const order = stepOrder();
    const i = order.indexOf(name);
    $$(".step", form).forEach((s) => { s.hidden = s.dataset.step !== name; });
    $(`[data-step="${name}"] .step__count`, form).textContent = COPY.steps.count(i + 1, order.length);
    $("#step-back").hidden = i === 0;
    const last = i === order.length - 1;
    $("#step-next-label").textContent = last ? COPY.steps.send : COPY.steps.next;
    $("#form-error").hidden = true;
    if (focus) {
      const step = $(`[data-step="${name}"]`, form);
      step.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      const first = $("input:not([type=hidden]), textarea, select", step);
      if (first && first.type !== "radio" && first.type !== "checkbox") setTimeout(() => first.focus({ preventScroll: true }), 300);
    }
  }

  function setError(id, msg) {
    const el = $(`#${id}-error`);
    if (el) el.textContent = msg || "";
    const wrap = $(`#f-${id}`);
    if (wrap) wrap.classList.toggle("has-error", Boolean(msg));
  }

  function validStep(name) {
    const d = collect();
    const C = COPY;
    const errs = [];
    const need = (ok, id, msg) => { setError(id, ok ? "" : msg); if (!ok) errs.push(id); };
    if (name === "you") {
      need(d.name.length > 1, "name", C.you.errName);
      need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email), "email", C.you.errEmail);
      const digits = d.phoneNumber.replace(/\D/g, "");
      need(d.phoneCode === "other" ? /^\+?\d[\d\s()-]{6,}$/.test(d.phoneNumber) && digits.length >= 8 : digits.length >= 6 && digits.length <= 14, "phone", C.you.errPhone);
    }
    if (name === "attend") need(Boolean(d.attending), "attending", C.attend.err);
    if (name === "party") {
      need(d.partySize > 0, "partySize", C.party.errSize);
      if (d.partySize > 1) need(Boolean(d.others), "others", C.party.errOthers);
      if (d.partySize === 1) {
        need(Boolean(d.stay), "stay", C.party.errStay);
        if (d.stay === "roommate") need(Boolean(d.roommate), "roommate", C.party.errRoommate);
        if (d.stay === "pair") need(Boolean(d.pairing), "pairing", C.party.errPairing);
      }
    }
    if (errs.length) {
      const first = $(`#f-${errs[0]} input, #f-${errs[0]} textarea, #f-${errs[0]} select`);
      if (first) first.focus();
    }
    return errs.length === 0;
  }

  function onBack() {
    const order = stepOrder();
    const i = order.indexOf(current);
    if (i > 0) showStep(order[i - 1], true);
  }

  async function onNext(e) {
    e.preventDefault();
    if (!validStep(current)) return;
    const order = stepOrder();
    const i = order.indexOf(current);
    if (i < order.length - 1) { showStep(order[i + 1], true); return; }
    await submit();
  }

  async function submit() {
    const btn = $("#step-next");
    const box = $("#form-error");
    const data = collect();
    box.hidden = true;
    btn.disabled = true;
    btn.classList.add("is-busy");
    try {
      const res = await api(Object.assign({ action: "rsvp", code: store.get(KEYS.code) || "", source: "site" }, data));
      store.drop(KEYS.draft);
      if (res.schedule) store.set(KEYS.schedule, res.schedule);
      else store.drop(KEYS.schedule);
      showDone(data, res.schedule);
    } catch (err) {
      if (err.code === "bad_code") {
        // The saved code no longer works: ask for it again, keeping their answers.
        store.drop(KEYS.code);
        location.reload();
        return;
      }
      box.textContent = err.code === "not_configured" ? COPY.notReady : COPY.sendError;
      box.hidden = false;
      $("#step-next-label").textContent = COPY.steps.retry;
      box.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    } finally {
      btn.disabled = false;
      btn.classList.remove("is-busy");
    }
  }

  /* ---------- Confirmation ---------- */
  function summaryRows(d) {
    const S = COPY.summary;
    const P = COPY.party;
    const yes = d.attending === "Yes";
    const rows = [
      [S.name, d.name], [S.email, d.email], [S.phone, d.phone],
      [S.attending, yes ? S.yes : S.no],
    ];
    if (yes) {
      rows.push([S.party, String(d.partySize)]);
      if (d.others) rows.push([S.others, d.others]);
      if (d.stay) rows.push([S.stay, P.stayOptions[d.stay]]);
      if (d.roommate) rows.push([S.roommate, d.roommate]);
      if (d.pairing) rows.push([S.pairing, P.pairingOptions[d.pairing]]);
      if (d.dietary) rows.push([S.dietary, d.dietary]);
      if (d.help.length) rows.push([S.help, d.help.map((k) => COPY.needs.helpOptions[k]).join(", ")]);
      if (d.accessNotes) rows.push([S.notes, d.accessNotes]);
    }
    if (d.message) rows.push([S.message, d.message]);
    return rows;
  }

  function showDone(d, schedule) {
    const yes = d.attending === "Yes";
    const first = d.name.split(" ")[0];
    const done = $("#done");
    done.replaceChildren(
      h("h3", { class: "done__title", text: (yes ? COPY.done.yesTitle : COPY.done.noTitle)(first) }),
      h("p", { class: "lead", text: yes ? COPY.done.yesText : COPY.done.noText }),
      h("p", { class: "label", text: COPY.done.summary }),
      h("dl", { class: "summary" }, summaryRows(d).map(([k, v]) => h("div", null, h("dt", { text: k }), h("dd", { text: v })))),
      h("p", { class: "hint", text: COPY.done.edit }),
      h("p", null, h("button", { class: "link", type: "button", id: "done-edit", text: COPY.done.again })));
    form.hidden = true;
    $("#form-notice").hidden = true;
    done.hidden = false;
    $("#done-edit").addEventListener("click", () => {
      done.hidden = true;
      form.hidden = false;
      fill(d);
      showStep("you", true);
    });
    renderSchedule(yes ? schedule : null);
    done.focus({ preventScroll: true });
    done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  /* ---------- Schedule (only ever comes from the server, after a yes) ---------- */
  function safeUrl(u) { return /^https:\/\//i.test(String(u || "")) ? u : ""; }

  function renderSchedule(s) {
    const sec = $("#schedule");
    if (!s || !Array.isArray(s.days)) {
      sec.hidden = true;
      $("#nav-schedule").hidden = true;
      return;
    }
    const guide = safeUrl(s.guideUrl);
    sec.replaceChildren(
      h("h2", { class: "heading", id: "schedule-title", text: s.title || "Schedule" }),
      s.intro ? h("p", { class: "lead", text: s.intro }) : null,
      h("div", { class: "days" }, s.days.map((day) =>
        h("div", { class: "day" },
          h("h3", { text: day.day }),
          h("ul", null, (day.items || []).map((item) => h("li", { text: item })))))),
      s.note ? h("p", { text: s.note }) : null,
      s.lodging ? h("p", { class: "lead", text: s.lodging }) : null,
      guide ? h("p", null, h("a", { class: "button button--quiet", href: guide, target: "_blank", rel: "noopener", text: s.guideLabel || "Our guest guide" })) : null);
    sec.hidden = false;
    $("#nav-schedule").hidden = false;
  }

  /* ---------- Updating an earlier RSVP ---------- */
  function initLookup() {
    const toggle = $("#edit-open");
    const box = $("#lookup");
    const err = $("#lookup-error");
    const btn = $("#lookup-submit");
    toggle.addEventListener("click", () => {
      const open = box.hidden;
      box.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) $("#lookup-email").focus();
    });
    box.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = $("#lookup-email").value.trim().toLowerCase();
      if (!email) { err.textContent = COPY.lookup.err; return; }
      err.textContent = "";
      btn.disabled = true;
      btn.classList.add("is-busy");
      try {
        const res = await api({ action: "lookup", code: store.get(KEYS.code) || "", email });
        $("#done").hidden = true;
        form.hidden = false;
        fill(res.rsvp);
        if (res.schedule) { store.set(KEYS.schedule, res.schedule); renderSchedule(res.schedule); }
        box.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        notice(COPY.lookup.found);
        showStep("you", true);
      } catch (e2) {
        if (e2.code === "not_found") {
          box.hidden = true;
          toggle.setAttribute("aria-expanded", "false");
          set("email", email);
          notice(COPY.lookup.notFound);
          showStep("you", true);
        } else if (e2.code === "bad_code") {
          store.drop(KEYS.code);
          location.reload();
        } else {
          err.textContent = e2.code === "not_configured" ? COPY.notReady : COPY.lookup.offline;
        }
      } finally {
        btn.disabled = false;
        btn.classList.remove("is-busy");
      }
    });
    function set(name, v) { if (form.elements[name]) form.elements[name].value = v; }
  }

  function notice(text) {
    const n = $("#form-notice");
    n.textContent = text;
    n.hidden = false;
  }

  /* ---------- Gentle entrance for the story ---------- */
  function startFades() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const items = $$(".story__block, .reveal-note");
    document.documentElement.classList.add("js-motion");
    items.forEach((el) => el.classList.add("fade"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- Go ---------- */
  buildForm();
  fill(store.get(KEYS.draft));
  syncFields();
  showStep("you", false);
  renderSchedule(store.get(KEYS.schedule));
  initLookup();
  initCountdown();
  initGate();
})();

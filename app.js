let currentStep = 1;
let selectedTone = "";
let selectedQuestion = "";
let generatedLink = "";
let senderWhatsapp = "";
let latestReplyByType = {};
let currentLang = "hinglish";
let currentTargetStyle = "neutral";
let currentRequestId = "";
let currentSenderToken = "";
let currentReceiverNameHint = "";
let selectedInterest = "";
const moodClasses = ["mood-default", "mood-yes", "mood-softyes", "mood-maybe", "mood-later", "mood-no"];
const DIRECT_ANSWER_API_URL = window.FEELINGS_ANSWER_API_URL || "";
const SUPABASE_URL = window.FEELINGS_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.FEELINGS_SUPABASE_ANON_KEY || "";
const SENT_REQUESTS_KEY = "feelings_sent_requests_v1";
const SENDER_TOKEN_KEY = "feelings_sender_token_v1";
const LOCAL_RESPONSES_KEY = "feelings_local_responses_v1";
let bubbleResizeTimer = null;
const GENDER_QUESTION_BOOST = {
  hinglish: {
    her: [
      "Tumhari smile ke liye aaj ek cute plan banaun?",
      "Aaj tumhe special feel karane ka chance dogi?"
    ],
    him: [
      "Aaj tumhare saath ek strong coffee talk karein?",
      "Ek clean plan hai - tum haan bolo, baaki main sambhal lunga/lungi."
    ]
  },
  english: {
    her: [
      "Can I plan something that makes you feel really special today?",
      "Will you give me one sweet chance to make you smile?"
    ],
    him: [
      "Can we do one solid coffee catch-up today?",
      "Say yes once - I will handle the plan end to end."
    ]
  }
};

function isMobileView() {
  return window.innerWidth <= 768;
}

function switchTab(tab, tabEl) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  if (tabEl) tabEl.classList.add("active");
  else document.querySelector(tab === "sender" ? ".tab:nth-child(1)" : ".tab:nth-child(2)").classList.add("active");

  if (tab === "sender") {
    document.getElementById("sender-view").style.display = "block";
    document.getElementById("receiver-view").style.display = "none";
    setMoodTheme("default");
  } else {
    document.getElementById("sender-view").style.display = "none";
    document.getElementById("receiver-view").style.display = "block";
    loadReceiverFromURL();
  }
}

function goToStep(n) {
  if (n === 2) {
    const rel = document.getElementById("relationship").value;
    if (!rel) return flashError("step-1");
  }
  if (n === 3) {
    const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
    if (!q) return flashError("step-2");
    updatePreview();
  }

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById("step-" + i);
    if (el) el.style.display = i === n ? "block" : "none";
  }
  currentStep = n;
  updateDots();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateDots() {
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById("dot-" + i);
    if (!dot) continue;
    dot.classList.remove("active", "done");
    if (i === currentStep) dot.classList.add("active");
    else if (i < currentStep) dot.classList.add("done");
  }
}

function flashError(id) {
  const el = document.getElementById(id);
  el.style.borderColor = "rgba(232,160,176,0.6)";
  setTimeout(() => (el.style.borderColor = ""), 1200);
}

function setTone(el, tone) {
  document.querySelectorAll(".tone-pill").forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
  selectedTone = tone;
}

function loadQuestions() {
  const rel = document.getElementById("relationship").value;
  const lang = document.getElementById("language").value || "hinglish";
  const target = document.getElementById("target-style").value || "neutral";
  const list = document.getElementById("question-list");
  const byLang = window.QUESTIONS[lang] || window.QUESTIONS.hinglish;
  if (!rel || !byLang[rel]) {
    list.innerHTML = '<div class="q-item">Select a relationship to see questions.</div>';
    return;
  }
  const baseQuestions = byLang[rel].slice();
  const boost = (GENDER_QUESTION_BOOST[lang] && GENDER_QUESTION_BOOST[lang][target]) ? GENDER_QUESTION_BOOST[lang][target] : [];
  const allQuestions = [...baseQuestions, ...boost];
  list.innerHTML = allQuestions.map((q) => `<div class="q-item" onclick="selectQ(this)">${q}</div>`).join("");
  clearQSelection();
}

function selectQ(el) {
  document.querySelectorAll(".q-item").forEach((q) => q.classList.remove("active"));
  el.classList.add("active");
  selectedQuestion = el.textContent;
  document.getElementById("custom-question").value = "";
  updateProgress();
}

function clearQSelection() {
  document.querySelectorAll(".q-item").forEach((q) => q.classList.remove("active"));
  selectedQuestion = "";
}

function toggleMemory() {
  const f = document.getElementById("memory-field");
  f.style.display = f.style.display === "none" ? "block" : "none";
}

function updateProgress() {
  const rel = document.getElementById("relationship").value;
  const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
  let p = 0;
  if (rel) p += 50;
  if (q) p += 50;
  document.getElementById("progress-fill").style.width = p + "%";
}

function updatePreview() {
  const senderGender = document.getElementById("sender-gender").value || "unknown";
  const receiverGender = document.getElementById("receiver-gender").value || "unknown";
  const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
  const mem = document.getElementById("memory-text").value.trim();

  document.getElementById("preview-from-line").textContent = `From ${formatGenderLabel(senderGender)}`;
  document.getElementById("preview-question-text").textContent = `For ${formatGenderLabel(receiverGender)}: ${q}`;

  const memBlock = document.getElementById("preview-memory-block");
  const memText = document.getElementById("preview-memory-text");
  if (mem) {
    memBlock.style.display = "block";
    memText.textContent = `"${mem}"`;
  } else {
    memBlock.style.display = "none";
  }
}

function generateLink() {
  const sn = "";
  const rn = document.getElementById("receiver-name-hint").value.trim();
  const rel = document.getElementById("relationship").value;
  const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
  const mem = document.getElementById("memory-text").value.trim();
  const tone = selectedTone;
  const lang = document.getElementById("language").value || "hinglish";
  const target = document.getElementById("target-style").value || "neutral";
  const senderGender = document.getElementById("sender-gender").value || "unknown";
  const receiverGender = document.getElementById("receiver-gender").value || "unknown";
  const senderWa = document.getElementById("sender-wa").value.trim().replace(/[^\d]/g, "");
  const reqId = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `req_${Date.now()}`;
  currentRequestId = reqId;

  const params = new URLSearchParams({ from: sn, to: rn, rel, q, tone, lang, target, req: reqId, sg: senderGender, rg: receiverGender });
  if (senderWa) params.set("wa", senderWa);
  if (mem) params.set("mem", mem);

  const useShortLink = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
  generatedLink = useShortLink
    ? `${window.location.href.split("?")[0]}?req=${encodeURIComponent(reqId)}`
    : `${window.location.href.split("?")[0]}?${params.toString()}`;
  currentReceiverNameHint = rn;
  document.getElementById("share-url-display").textContent = generatedLink;
  document.getElementById("link-for-name").textContent = rn || formatGenderLabel(receiverGender);
  storeSentRequest({
    request_id: reqId,
    to: rn,
    from: sn,
    receiver_gender: receiverGender,
    sender_gender: senderGender,
    question: q,
    created_at: new Date().toISOString()
  });
  registerRequestInSupabase({
    request_id: reqId,
    sender_name: sn,
    receiver_name: rn,
    question: q,
    relationship: rel,
    tone,
    lang,
    target,
    memory_text: mem,
    sender_gender: senderGender,
    receiver_gender: receiverGender,
    sender_wa: senderWa
  });

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById("step-" + i);
    if (el) el.style.display = "none";
  }
  document.getElementById("share-panel").classList.add("visible");
  updateDots();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function genderTag(g) {
  if (g === "he") return "he";
  if (g === "she") return "she";
  return "";
}

function formatGenderLabel(g) {
  if (g === "he") return "He";
  if (g === "she") return "She";
  return "He/She";
}

function getSenderToken() {
  let token = localStorage.getItem(SENDER_TOKEN_KEY);
  if (!token) {
    token = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : `st_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SENDER_TOKEN_KEY, token);
  }
  return token;
}

async function registerRequestInSupabase(entry) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !currentSenderToken) return;
  const fullPayload = {
    request_id: entry.request_id,
    sender_token: currentSenderToken,
    sender_name: entry.sender_name,
    receiver_name: entry.receiver_name,
    question: entry.question,
    relationship: entry.relationship || null,
    tone: entry.tone || null,
    lang: entry.lang || null,
    target: entry.target || null,
    memory_text: entry.memory_text || null,
    sender_gender: entry.sender_gender || null,
    receiver_gender: entry.receiver_gender || null,
    sender_wa: entry.sender_wa || null,
    created_at: new Date().toISOString()
  };
  const legacyPayload = {
    request_id: entry.request_id,
    sender_token: currentSenderToken,
    sender_name: entry.sender_name || null,
    receiver_name: entry.receiver_name || null,
    question: entry.question || null,
    created_at: new Date().toISOString()
  };
  try {
    const fullRes = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify(fullPayload)
    });
    if (fullRes.ok) return;
    // Backward compatibility for older requests schema.
    if (fullRes.status === 400 || fullRes.status === 404) {
      const legacyRes = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "resolution=merge-duplicates,return=minimal"
        },
        body: JSON.stringify(legacyPayload)
      });
      if (legacyRes.ok) return;
    }
  } catch (_) {
    // Non-blocking: receiver flow still works.
  }
}

function getSentRequests() {
  try {
    const raw = localStorage.getItem(SENT_REQUESTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeSentRequest(entry) {
  const existing = getSentRequests().filter((r) => r.request_id !== entry.request_id);
  existing.unshift(entry);
  localStorage.setItem(SENT_REQUESTS_KEY, JSON.stringify(existing.slice(0, 200)));
}

function getLocalResponses() {
  try {
    const raw = localStorage.getItem(LOCAL_RESPONSES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function storeLocalResponse(entry) {
  const rows = getLocalResponses();
  rows.unshift(entry);
  localStorage.setItem(LOCAL_RESPONSES_KEY, JSON.stringify(rows.slice(0, 500)));
}

function formatAnswerTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function renderInboxRows(rows, sentMap) {
  const list = document.getElementById("answers-inbox-list");
  if (!list) return;
  if (!rows.length) {
    list.innerHTML = "";
    return;
  }
  list.innerHTML = rows.map((r) => {
    const sent = sentMap.get(r.request_id) || {};
    const q = sent.question || r.question || "No question";
    const to = sent.to || r.receiver_name || formatGenderLabel(sent.receiver_gender || "unknown");
    const who = r.receiver_name || to;
    const at = formatAnswerTime(r.created_at);
    return `
      <div class="answer-row">
        <div class="answer-row-top">
          <span class="answer-row-person">${to}</span>
          <span>${at}</span>
        </div>
        <div class="answer-row-question">Q: ${q}</div>
        <div class="answer-row-reply">${who} said <strong>${(r.answer_type || "reply").toUpperCase()}</strong>: ${r.answer_text || ""}</div>
      </div>
    `;
  }).join("");
}

async function loadMyAnswers() {
  const status = document.getElementById("answers-inbox-status");
  const list = document.getElementById("answers-inbox-list");
  const sent = getSentRequests();
  if (!sent.length) {
    if (status) status.textContent = "No sent links found on this device yet.";
    if (list) list.innerHTML = "";
    return;
  }
  const ids = sent.map((s) => s.request_id).filter(Boolean);
  const sentMap = new Map(sent.map((s) => [s.request_id, s]));
  const localRows = getLocalResponses()
    .filter((r) => ids.includes(r.request_id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (localRows.length) {
      if (status) status.textContent = `Found ${localRows.length} answers (local device).`;
      renderInboxRows(localRows, sentMap);
      return;
    }
    if (status) status.textContent = "Supabase config missing in app runtime.";
    return;
  }
  if (status) status.textContent = "Loading answers...";

  try {
    await Promise.all(sent.map((entry) => registerRequestInSupabase({
      request_id: entry.request_id,
      sender_name: entry.from || "",
      receiver_name: entry.to || "",
      question: entry.question || ""
    })));
    const inClause = ids.map((id) => `"${id}"`).join(",");
    const url = new URL(`${SUPABASE_URL}/rest/v1/responses`);
    url.searchParams.set("select", "request_id,answer_type,answer_text,receiver_name,question,created_at");
    url.searchParams.set("request_id", `in.(${inClause})`);
    url.searchParams.set("order", "created_at.desc");
    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "x-sender-token": currentSenderToken
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    const mergedMap = new Map();
    [...rows, ...localRows].forEach((r) => {
      const key = `${r.request_id || ""}|${r.answer_type || ""}|${r.answer_text || ""}|${r.created_at || ""}`;
      if (!mergedMap.has(key)) mergedMap.set(key, r);
    });
    const mergedRows = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    if (status) {
      status.textContent = mergedRows.length
        ? `Found ${mergedRows.length} answers.`
        : "No answers yet for your links.";
    }
    renderInboxRows(mergedRows, sentMap);
  } catch (err) {
    if (localRows.length) {
      if (status) status.textContent = `Supabase blocked. Showing ${localRows.length} local answer(s).`;
      renderInboxRows(localRows, sentMap);
      return;
    }
    if (status) status.textContent = "Failed to load inbox. Check Supabase select policy.";
    if (list) list.innerHTML = "";
  }
}

function shareWhatsApp() {
  const msg = encodeURIComponent(`I want to ask you something\n\n${generatedLink}`);
  window.open(`https://wa.me/?text=${msg}`, "_blank");
}

function copyLink() {
  navigator.clipboard.writeText(generatedLink).then(() => {
    const btn = document.getElementById("copy-btn");
    const old = btn.innerHTML;
    btn.innerHTML = "Copied!";
    setTimeout(() => (btn.innerHTML = old), 2000);
  });
}

function resetSender() {
  document.getElementById("share-panel").classList.remove("visible");
  document.getElementById("step-1").style.display = "block";
  currentStep = 1;
  updateDots();
  document.getElementById("progress-fill").style.width = "0%";
  ["sender-wa", "receiver-name-hint", "custom-question", "memory-text"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("relationship").value = "";
  document.getElementById("language").value = "hinglish";
  document.getElementById("target-style").value = "neutral";
  document.getElementById("sender-gender").value = "unknown";
  document.getElementById("receiver-gender").value = "unknown";
  document.getElementById("memory-field").style.display = "none";
  selectedQuestion = "";
  selectedTone = "";
  currentReceiverNameHint = "";
  setMoodTheme("default");
}

function applyTargetAvatar() {
  const avatar = document.getElementById("receiver-avatar");
  const map = { her: "👧", him: "👦", neutral: "🧑" };
  avatar.textContent = map[currentTargetStyle] || map.neutral;
}

async function loadReceiverFromURL() {
  const params = new URLSearchParams(window.location.search);
  const req = params.get("req") || "";
  let from = params.get("from") || "Someone";
  let to = params.get("to") || "";
  let q = params.get("q") || "Would you want to spend some time with me?";
  let mem = params.get("mem") || "";
  currentLang = params.get("lang") || "hinglish";
  currentTargetStyle = params.get("target") || "neutral";
  currentRequestId = req;
  senderWhatsapp = (params.get("wa") || "").replace(/[^\d]/g, "");
  let senderGender = params.get("sg") || "unknown";
  let receiverGender = params.get("rg") || "unknown";
  let loadedFromReqStore = false;

  if (req && !params.get("q") && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/requests`);
      url.searchParams.set("select", "sender_name,receiver_name,question,memory_text,lang,target,sender_wa,sender_gender,receiver_gender");
      url.searchParams.set("request_id", `eq.${req}`);
      url.searchParams.set("limit", "1");
      const res = await fetch(url.toString(), {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "x-request-id": req
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length) {
          const row = rows[0];
          from = row.sender_name || from;
          to = row.receiver_name || to;
          q = row.question || q;
          mem = row.memory_text || mem;
          currentLang = row.lang || currentLang;
          currentTargetStyle = row.target || currentTargetStyle;
          senderWhatsapp = (row.sender_wa || senderWhatsapp || "").replace(/[^\d]/g, "");
          senderGender = row.sender_gender || senderGender;
          receiverGender = row.receiver_gender || receiverGender;
          loadedFromReqStore = true;
        }
      }
    } catch (_) {
      // Fallback to query params/defaults
    }
  }

  if (req && !loadedFromReqStore) {
    const localReq = getSentRequests().find((item) => item.request_id === req);
    if (localReq) {
      from = formatGenderLabel(localReq.sender_gender || senderGender);
      to = localReq.to || to;
      q = localReq.question || q;
      senderGender = localReq.sender_gender || senderGender;
      receiverGender = localReq.receiver_gender || receiverGender;
    }
  }
  currentReceiverNameHint = to || "";

  const senderFromEl = document.getElementById("r-sender-name");
  const senderLabel = formatGenderLabel(senderGender);
  if (senderFromEl) senderFromEl.textContent = senderLabel;
  const receiverLabel = formatGenderLabel(receiverGender);
  document.getElementById("r-receiver-name").textContent = `For ${receiverLabel}`;
  document.getElementById("r-question").textContent = q;
  applyTargetAvatar();

  const memBlock = document.getElementById("r-memory-block");
  if (mem) {
    memBlock.style.display = "block";
    memBlock.textContent = `"${mem}"`;
  } else {
    memBlock.style.display = "none";
    memBlock.textContent = "";
  }

  if (!params.get("from") && !params.get("req") && !params.get("q")) {
    currentLang = "hinglish";
    currentTargetStyle = "neutral";
    currentRequestId = "";
    senderWhatsapp = "";
    currentReceiverNameHint = "";
    document.getElementById("r-sender-name").textContent = "He/She";
    document.getElementById("r-receiver-name").textContent = "For He/She";
    document.getElementById("r-question").textContent = "Kal coffee pe chalte hain, no excuses?";
    memBlock.style.display = "block";
    memBlock.textContent = '"Remember when we used to talk for hours? Miss that vibe."';
    applyTargetAvatar();
  }
  applyReceiverLanguage();
  selectedInterest = "";
  previewMood("idle");
}

function applyReceiverLanguage() {
  const isHinglish = currentLang === "hinglish";
  const txt = {
    answerLabel: isHinglish ? "Aapka dil kya bol raha hai?" : "How do you feel?",
    yesMain: isHinglish ? "Haan, bilkul" : "Yes, absolutely",
    yesSub: isHinglish ? "Done hai. Chalo pakka karte hain." : "I'm in. Let's make it happen.",
    softMain: isHinglish ? "Haan, par thoda baat karein" : "Yes, but let's talk",
    softSub: isHinglish ? "Mood hai, bas thoda plan karna hai." : "I want to, just need a moment to plan.",
    maybeMain: isHinglish ? "Abhi sure nahi hu" : "I'm not sure yet",
    maybeSub: isHinglish ? "Thoda time do, soch ke batata/batati hu." : "Give me a little time to think.",
    laterMain: isHinglish ? "Abhi nahi, thoda baad" : "Not right now",
    laterSub: isHinglish ? "Timing sahi nahi hai." : "This isn't the right moment.",
    noMain: isHinglish ? "Mujhe thoda space chahiye" : "I need some space",
    noSub: isHinglish ? "Care karta/karti hu, bas abhi nahi." : "I still care, but I can't right now.",
    helper: isHinglish ? "Jo feel ho wahi choose karo - zero pressure." : "Choose what feels real - no pressure.",
    reactIdle: isHinglish ? "Dil se pucho, dil se jawab do." : "Answer with honesty and heart.",
    noPanelTitle: isHinglish ? "Final no se pehle, koi softer option choose karna chahoge?" : "Before final no, want to choose a softer path?",
    noPanelSub: isHinglish ? "Bilkul pressure nahi. Jo sach lage woh choose karo." : "No pressure. Pick what feels true for you.",
    noPanelMaybe: isHinglish ? "Mujhe aur time chahiye" : "I need more time",
    noPanelLater: isHinglish ? "Aaj nahi, baad mein maybe" : "Not today, maybe later",
    noPanelNo: isHinglish ? "Nahi, mujhe space chahiye" : "No, I still need space",
    interestTitle: isHinglish ? "Jo easiest lage, woh vibe choose karo" : "Pick the easiest vibe",
    interestCoffee: isHinglish ? "Quick coffee" : "Quick coffee",
    interestCall: isHinglish ? "10-min call" : "10-min call",
    interestWalk: isHinglish ? "Short walk" : "Short walk",
    interestNote: isHinglish ? "Chota plan = less pressure = happy yes chance high." : "Small plan, low pressure, better chance of a happy yes."
  };
  document.getElementById("answer-label").textContent = txt.answerLabel;
  document.getElementById("ans-yes-main").textContent = txt.yesMain;
  document.getElementById("ans-yes-sub").textContent = txt.yesSub;
  document.getElementById("ans-softyes-main").textContent = txt.softMain;
  document.getElementById("ans-softyes-sub").textContent = txt.softSub;
  document.getElementById("ans-maybe-main").textContent = txt.maybeMain;
  document.getElementById("ans-maybe-sub").textContent = txt.maybeSub;
  document.getElementById("ans-later-main").textContent = txt.laterMain;
  document.getElementById("ans-later-sub").textContent = txt.laterSub;
  document.getElementById("ans-no-main").textContent = txt.noMain;
  document.getElementById("ans-no-sub").textContent = txt.noSub;
  document.getElementById("receiver-helper").textContent = txt.helper;
  document.getElementById("react-text").textContent = txt.reactIdle;
  const t = document.querySelector("#no-gentle-panel .no-gentle-title");
  const s = document.querySelector("#no-gentle-panel .no-gentle-sub");
  const btns = document.querySelectorAll("#no-gentle-panel .no-gentle-btn");
  if (t) t.textContent = txt.noPanelTitle;
  if (s) s.textContent = txt.noPanelSub;
  if (btns[0]) btns[0].textContent = txt.noPanelMaybe;
  if (btns[1]) btns[1].textContent = txt.noPanelLater;
  if (btns[2]) btns[2].textContent = txt.noPanelNo;
  const iTitle = document.getElementById("interest-title");
  const iCoffee = document.getElementById("interest-coffee");
  const iCall = document.getElementById("interest-call");
  const iWalk = document.getElementById("interest-walk");
  const iNote = document.getElementById("interest-note");
  if (iTitle) iTitle.textContent = txt.interestTitle;
  if (iCoffee) iCoffee.textContent = txt.interestCoffee;
  if (iCall) iCall.textContent = txt.interestCall;
  if (iWalk) iWalk.textContent = txt.interestWalk;
  if (iNote) iNote.textContent = txt.interestNote;
}

function setInterest(el, interestKey) {
  document.querySelectorAll(".interest-chip").forEach((chip) => chip.classList.remove("active"));
  if (el) el.classList.add("active");
  selectedInterest = interestKey;
  const note = document.getElementById("interest-note");
  const map = {
    coffee: currentLang === "hinglish" ? "Easy plan selected: quick coffee vibe." : "Easy plan selected: quick coffee vibe.",
    call: currentLang === "hinglish" ? "Low effort, warm connect: 10-min call." : "Low effort, warm connect: 10-min call.",
    walk: currentLang === "hinglish" ? "Soft reconnect mode: short walk." : "Soft reconnect mode: short walk."
  };
  if (note) note.textContent = map[interestKey] || note.textContent;
}

function handleNoAttempt() {
  previewMood("no");
  const panel = document.getElementById("no-gentle-panel");
  if (!panel) return submitAnswer("no");
  panel.style.display = "block";
  setMoodTheme("later");
  playOutcomeFx("later");
}

function previewMood(type) {
  const emoji = document.getElementById("react-emoji");
  const text = document.getElementById("react-text");
  const isHinglish = currentLang === "hinglish";
  const byTarget = {
    her: { yes: "💃", softyes: "😊", maybe: "🤔", later: "⏳", no: "🫶" },
    him: { yes: "🕺", softyes: "🙂", maybe: "🤔", later: "⏳", no: "🫶" },
    neutral: { yes: "😍", softyes: "😊", maybe: "🤔", later: "⏳", no: "🫶" }
  };
  const pick = byTarget[currentTargetStyle] || byTarget.neutral;
  const map = {
    idle: [isHinglish ? "💫" : "✨", isHinglish ? "Dil se pucho, dil se jawab do." : "Answer with honesty and heart."],
    yes: [pick.yes, isHinglish ? "Aree wah, pure green signal vibes!" : "That feels like a happy green signal."],
    softyes: [pick.softyes, isHinglish ? "Cute yes... thoda patience aur." : "A soft yes - patience will help."],
    maybe: [pick.maybe, isHinglish ? "Soch chal rahi hai, hope alive hai." : "Thinking mode, hope is alive."],
    later: [pick.later, isHinglish ? "Timing off hai, connection off nahi." : "Timing is off, connection is not."],
    no: [pick.no, isHinglish ? "Respect mode on - yahi real care hai." : "Respect mode on - this is real care."]
  };
  const current = map[type] || map.idle;
  emoji.textContent = current[0];
  text.textContent = current[1];
  emoji.classList.remove("pop");
  void emoji.offsetWidth;
  emoji.classList.add("pop");
}

function setMoodTheme(type) {
  moodClasses.forEach((c) => document.body.classList.remove(c));
  const mood = type ? `mood-${type}` : "mood-default";
  document.body.classList.add(mood);
  recolorBubbles(type || "default");
}

function clearFxLayer() {
  const layer = document.getElementById("fx-layer");
  if (!layer) return null;
  layer.innerHTML = "";
  return layer;
}

function playOutcomeFx(type) {
  const layer = clearFxLayer();
  if (!layer) return;
  const mobile = isMobileView();

  if (type === "yes") {
    const total = mobile ? 10 : 16;
    for (let i = 0; i < total; i++) {
      const h = document.createElement("span");
      h.className = "fx-heart";
      h.textContent = Math.random() > 0.5 ? "❤" : "✨";
      h.style.left = "50%";
      h.style.top = "45%";
      const angle = (Math.PI * 2 * i) / total;
      const dist = mobile ? 60 + Math.random() * 70 : 80 + Math.random() * 120;
      h.style.setProperty("--tx", `${Math.cos(angle) * dist}px`);
      h.style.setProperty("--ty", `${Math.sin(angle) * dist}px`);
      h.style.animationDelay = `${Math.random() * 0.2}s`;
      layer.appendChild(h);
    }
  } else if (type === "softyes") {
    const shimmer = document.createElement("div");
    shimmer.className = "fx-shimmer";
    layer.appendChild(shimmer);
  } else if (type === "maybe") {
    const total = mobile ? 7 : 12;
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.className = "fx-thought";
      dot.style.left = `${20 + Math.random() * 60}%`;
      dot.style.top = `${65 + Math.random() * 25}%`;
      dot.style.width = `${8 + Math.random() * 12}px`;
      dot.style.height = dot.style.width;
      dot.style.animationDelay = `${Math.random() * 0.6}s`;
      layer.appendChild(dot);
    }
  } else if (type === "later" || type === "no") {
    const calm = document.createElement("div");
    calm.className = "fx-calm";
    layer.appendChild(calm);
  }

  setTimeout(() => {
    if (layer) layer.innerHTML = "";
  }, 2600);
}

function recolorBubbles(type) {
  const palette = {
    default: ["#a090d0", "#e8a0b0", "#d4a078", "#88c8a8"],
    yes: ["#88c8a8", "#a5e0c1", "#d4a078", "#f5ede0"],
    softyes: ["#e8a0b0", "#f1bdd0", "#d4a078", "#f3ddc8"],
    maybe: ["#a090d0", "#c0b4ea", "#e8a0b0", "#d2caf5"],
    later: ["#e8a0b0", "#a090d0", "#d8a4ba", "#c4b8e9"],
    no: ["#d4a078", "#e8c4a0", "#b7b7c8", "#f0e8e0"]
  };
  const colors = palette[type] || palette.default;
  document.querySelectorAll(".mood-bubble").forEach((bubble) => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    bubble.style.background = color;
  });
}

function initMoodBubbles() {
  const layer = document.getElementById("mood-bubbles");
  if (!layer) return;
  layer.innerHTML = "";
  const count = isMobileView() ? 10 : 18;
  for (let i = 0; i < count; i++) {
    const bubble = document.createElement("span");
    bubble.className = "mood-bubble";
    const size = isMobileView() ? Math.floor(Math.random() * 44) + 20 : Math.floor(Math.random() * 70) + 24;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.animationDuration = isMobileView()
      ? `${Math.random() * 8 + 11}s`
      : `${Math.random() * 10 + 10}s`;
    bubble.style.animationDelay = `${Math.random() * 8}s`;
    layer.appendChild(bubble);
  }
  recolorBubbles("default");
}

function submitAnswer(type) {
  const sn = document.getElementById("r-sender-name").textContent;
  document.getElementById("receiver-answers").style.display = "none";
  document.getElementById("receiver-hero").style.display = "none";
  const panel = document.getElementById("no-gentle-panel");
  if (panel) panel.style.display = "none";

  const replies = {
    yes: [`Haan ${sn}, full yes. Tumhare saath yeh moment special hoga.`, "Yes! Dil se yes - let's make it beautiful."],
    softyes: ["Haan, aur pyaar se plan karte hain. Thoda sa time do.", "I am in. Bas thoda sa warm-up and we do this right."],
    maybe: ["No nahi hai. Bas dil ko thoda waqt chahiye.", "I care - give me a little time, then let's do this."],
    later: ["Aaj mushkil hai, par feeling same hai. Baad mein karte hain.", "Right now not possible, but this matters to me."],
    no: ["Mujhe abhi space chahiye. Respect karne ke liye thank you.", "I care, but I need space right now."]
  };
  const msg = replies[type][Math.floor(Math.random() * replies[type].length)];
  const interestLine = selectedInterest
    ? (currentLang === "hinglish"
      ? ` Chalo ${selectedInterest === "coffee" ? "quick coffee" : selectedInterest === "call" ? "10-min call" : "short walk"} se start karte hain.`
      : ` Let's start with a ${selectedInterest === "coffee" ? "quick coffee" : selectedInterest === "call" ? "10-min call" : "short walk"}.`)
    : "";
  const finalMsg = `${msg}${interestLine}`;
  latestReplyByType[type] = finalMsg;

  ["yes", "softyes", "maybe", "later", "no"].forEach((id) => {
    const el = document.getElementById("outcome-" + id);
    if (el) el.style.display = "none";
  });
  const outcomeEl = document.getElementById("outcome-" + type);
  outcomeEl.style.display = "block";
  outcomeEl.classList.add("active");

  const copyEl = document.getElementById("outcome-" + type + "-copy");
  if (copyEl) copyEl.innerHTML = `<span>"${finalMsg}"</span>`;

  const sendBackBtn = document.getElementById("send-back-" + type);
  if (sendBackBtn) sendBackBtn.style.display = senderWhatsapp ? "block" : "none";
  submitDirectAnswer(type, finalMsg);

  if (type === "yes") launchConfetti();
  setMoodTheme(type);
  playOutcomeFx(type);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setDirectStatus(type, text) {
  ["yes", "softyes", "maybe", "later", "no"].forEach((id) => {
    const el = document.getElementById(`direct-save-status-${id}`);
    if (el) el.textContent = id === type ? text : "";
  });
}

async function submitDirectAnswer(type, answerText) {
  const payload = {
    request_id: currentRequestId || null,
    answer_type: type,
    answer_text: answerText,
    sender_name: document.getElementById("r-sender-name")?.textContent || "",
    receiver_name: currentReceiverNameHint || (document.getElementById("r-receiver-name")?.textContent || "").replace("For ", ""),
    question: document.getElementById("r-question")?.textContent || "",
    lang: currentLang,
    target: currentTargetStyle,
    created_at: new Date().toISOString()
  };
  storeLocalResponse(payload);

  const hasSupabase = SUPABASE_URL && SUPABASE_ANON_KEY;
  const hasCustomApi = DIRECT_ANSWER_API_URL;
  if (!hasSupabase && !hasCustomApi) {
    setDirectStatus(type, "Direct save is off. Configure Supabase or FEELINGS_ANSWER_API_URL.");
    return;
  }

  setDirectStatus(type, "Saving answer...");
  try {
    let res;
    if (hasSupabase) {
      res = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch(DIRECT_ANSWER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: payload.request_id,
          answerType: payload.answer_type,
          answerText: payload.answer_text,
          senderName: payload.sender_name,
          receiverName: payload.receiver_name,
          question: payload.question,
          lang: payload.lang,
          target: payload.target,
          timestamp: payload.created_at
        })
      });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setDirectStatus(type, hasSupabase ? "Answer saved to Supabase." : "Answer saved directly in app backend.");
  } catch (err) {
    setDirectStatus(type, "Direct save failed. Receiver can still send via WhatsApp.");
  }
}

function copyReply(type) {
  const copyEl = document.getElementById("outcome-" + type + "-copy");
  const text = copyEl ? copyEl.textContent.replace(/"/g, "") : "";
  navigator.clipboard.writeText(text);
  const btn = window.event ? window.event.target : null;
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = "Copied ✓";
  setTimeout(() => (btn.textContent = orig), 2000);
}

function sendReplyBack(type) {
  if (!senderWhatsapp) return;
  const sn = document.getElementById("r-sender-name").textContent || "you";
  const msg = latestReplyByType[type] || "Sharing my answer with care.";
  const text = encodeURIComponent(`Hi ${sn},\n\n${msg}\n\nSent from Feelings Studio.`);
  window.open(`https://wa.me/${senderWhatsapp}?text=${text}`, "_blank");
}

function copyRecovery(key) {
  const msgs = {
    whenever: "Whenever you're ready, I'll be here.",
    understand: "I understand. No rush at all.",
    miss: "I just miss you. That's all this was.",
    respect: "I completely understand. Take all the space you need.",
    care: "No pressure ever. I care about you - that does not change.",
    here: "I hear you. I am here if you want to talk."
  };
  navigator.clipboard.writeText(msgs[key] || "");
  const btn = window.event ? window.event.target : null;
  if (!btn) return;
  const orig = btn.textContent;
  btn.textContent = "✓ Copied to clipboard";
  setTimeout(() => (btn.textContent = orig), 2000);
}

function launchConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#d4a078", "#e8c4a0", "#e8a0b0", "#a090d0", "#88c8a8", "#f5ede0"];
  const particles = Array.from({ length: isMobileView() ? 56 : 100 }, () => ({
    x: Math.random() * canvas.width,
    y: -20,
    vx: (Math.random() - 0.5) * 3,
    vy: Math.random() * 3 + 1,
    r: Math.random() * 5 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * 360,
    va: (Math.random() - 0.5) * 5,
    shape: Math.random() > 0.5 ? "circle" : "rect"
  }));

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.va;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.angle * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - frame / 180);
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r);
      }
      ctx.restore();
    });
    frame++;
    if (frame < 200) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

window.addEventListener("load", () => {
  currentSenderToken = getSenderToken();
  initMoodBubbles();
  setMoodTheme("default");
  if (
    window.location.search.includes("from=") ||
    window.location.search.includes("q=") ||
    window.location.search.includes("req=")
  ) {
    switchTab("receiver");
  }
  loadQuestions();
});

window.addEventListener("resize", () => {
  clearTimeout(bubbleResizeTimer);
  bubbleResizeTimer = setTimeout(() => {
    initMoodBubbles();
  }, 220);
});

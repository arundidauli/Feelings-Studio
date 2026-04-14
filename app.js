let currentStep = 1;
let selectedTone = "";
let selectedQuestion = "";
let generatedLink = "";
let senderWhatsapp = "";
let latestReplyByType = {};
let currentLang = "hinglish";
let currentTargetStyle = "neutral";
const moodClasses = ["mood-default", "mood-yes", "mood-softyes", "mood-maybe", "mood-later", "mood-no"];

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
    const sn = document.getElementById("sender-name").value.trim();
    const rn = document.getElementById("receiver-name-input").value.trim();
    const rel = document.getElementById("relationship").value;
    if (!sn || !rn || !rel) return flashError("step-1");
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
  const list = document.getElementById("question-list");
  const byLang = window.QUESTIONS[lang] || window.QUESTIONS.hinglish;
  if (!rel || !byLang[rel]) {
    list.innerHTML = '<div class="q-item">Select a relationship to see questions.</div>';
    return;
  }
  list.innerHTML = byLang[rel].map((q) => `<div class="q-item" onclick="selectQ(this)">${q}</div>`).join("");
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
  const sn = document.getElementById("sender-name").value.trim();
  const rn = document.getElementById("receiver-name-input").value.trim();
  const rel = document.getElementById("relationship").value;
  const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
  let p = 0;
  if (sn) p += 25;
  if (rn) p += 25;
  if (rel) p += 25;
  if (q) p += 25;
  document.getElementById("progress-fill").style.width = p + "%";
}

function updatePreview() {
  const sn = document.getElementById("sender-name").value.trim();
  const rn = document.getElementById("receiver-name-input").value.trim();
  const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
  const mem = document.getElementById("memory-text").value.trim();

  document.getElementById("preview-from-line").textContent = `From ${sn}, with love`;
  document.getElementById("preview-question-text").textContent = `${rn}, ${q}`;

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
  const sn = document.getElementById("sender-name").value.trim();
  const rn = document.getElementById("receiver-name-input").value.trim();
  const rel = document.getElementById("relationship").value;
  const q = document.getElementById("custom-question").value.trim() || selectedQuestion;
  const mem = document.getElementById("memory-text").value.trim();
  const tone = selectedTone;
  const lang = document.getElementById("language").value || "hinglish";
  const target = document.getElementById("target-style").value || "neutral";
  const senderWa = document.getElementById("sender-wa").value.trim().replace(/[^\d]/g, "");

  const params = new URLSearchParams({ from: sn, to: rn, rel, q, tone, lang, target });
  if (senderWa) params.set("wa", senderWa);
  if (mem) params.set("mem", mem);

  generatedLink = `${window.location.href.split("?")[0]}?${params.toString()}`;
  document.getElementById("share-url-display").textContent = generatedLink;
  document.getElementById("link-for-name").textContent = rn;

  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById("step-" + i);
    if (el) el.style.display = "none";
  }
  document.getElementById("share-panel").classList.add("visible");
  updateDots();
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  ["sender-name", "sender-wa", "receiver-name-input", "custom-question", "memory-text"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("relationship").value = "";
  document.getElementById("language").value = "hinglish";
  document.getElementById("target-style").value = "neutral";
  document.getElementById("memory-field").style.display = "none";
  selectedQuestion = "";
  selectedTone = "";
  setMoodTheme("default");
}

function applyTargetAvatar() {
  const avatar = document.getElementById("receiver-avatar");
  const map = { her: "👧", him: "👦", neutral: "🧑" };
  avatar.textContent = map[currentTargetStyle] || map.neutral;
}

function loadReceiverFromURL() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get("from") || "Someone";
  const to = params.get("to") || "";
  const q = params.get("q") || "Would you want to spend some time with me?";
  const mem = params.get("mem") || "";
  currentLang = params.get("lang") || "hinglish";
  currentTargetStyle = params.get("target") || "neutral";
  senderWhatsapp = (params.get("wa") || "").replace(/[^\d]/g, "");

  document.getElementById("r-sender-name").textContent = from;
  document.getElementById("r-receiver-name").textContent = to ? `For ${to}` : "";
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

  if (!params.get("from")) {
    currentLang = "hinglish";
    currentTargetStyle = "neutral";
    senderWhatsapp = "";
    document.getElementById("r-sender-name").textContent = "Priya";
    document.getElementById("r-receiver-name").textContent = "For Arjun";
    document.getElementById("r-question").textContent = "Kal coffee pe chalte hain, no excuses?";
    memBlock.style.display = "block";
    memBlock.textContent = '"Remember when we used to talk for hours? Miss that vibe."';
    applyTargetAvatar();
  }
  applyReceiverLanguage();
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
    noPanelNo: isHinglish ? "Nahi, mujhe space chahiye" : "No, I still need space"
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

  if (type === "yes") {
    for (let i = 0; i < 16; i++) {
      const h = document.createElement("span");
      h.className = "fx-heart";
      h.textContent = Math.random() > 0.5 ? "❤" : "✨";
      h.style.left = "50%";
      h.style.top = "45%";
      const angle = (Math.PI * 2 * i) / 16;
      const dist = 80 + Math.random() * 120;
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
    for (let i = 0; i < 12; i++) {
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
  const count = 18;
  for (let i = 0; i < count; i++) {
    const bubble = document.createElement("span");
    bubble.className = "mood-bubble";
    const size = Math.floor(Math.random() * 70) + 24;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.animationDuration = `${Math.random() * 10 + 10}s`;
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
    yes: [`Haan ${sn}, done. Let's do this.`, "Yes! This sounds good to me."],
    softyes: ["Haan, but thoda plan karke karte hain.", "I am in, bas thoda time do."],
    maybe: ["Main soch raha/rahi hu, jaldi batata/batati hu.", "Not no. Bas thoda time."],
    later: ["Abhi right time nahi hai, par baad mein possible hai.", "Aaj nahi, but I appreciate this."],
    no: ["Mujhe abhi space chahiye. Hope you understand.", "I care, but right now I need space."]
  };
  const msg = replies[type][Math.floor(Math.random() * replies[type].length)];
  latestReplyByType[type] = msg;

  ["yes", "softyes", "maybe", "later", "no"].forEach((id) => {
    const el = document.getElementById("outcome-" + id);
    if (el) el.style.display = "none";
  });
  const outcomeEl = document.getElementById("outcome-" + type);
  outcomeEl.style.display = "block";
  outcomeEl.classList.add("active");

  const copyEl = document.getElementById("outcome-" + type + "-copy");
  if (copyEl) copyEl.innerHTML = `<span>"${msg}"</span>`;

  const sendBackBtn = document.getElementById("send-back-" + type);
  if (sendBackBtn) sendBackBtn.style.display = senderWhatsapp ? "block" : "none";

  if (type === "yes") launchConfetti();
  setMoodTheme(type);
  playOutcomeFx(type);
  window.scrollTo({ top: 0, behavior: "smooth" });
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
  const particles = Array.from({ length: 100 }, () => ({
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
  initMoodBubbles();
  setMoodTheme("default");
  if (window.location.search.includes("from=") || window.location.search.includes("q=")) {
    switchTab("receiver");
  }
  loadQuestions();
});

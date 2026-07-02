// ── TEAM COLOURS ──────────────────────────────────────────────────────────────
const TEAM_COLOURS = [
  "#4f6ef7","#34d399","#f87171","#fbbf24","#a78bfa","#fb923c","#38bdf8","#f472b6"
];

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const COLS = 6, ROWS = 4, TOTAL = COLS * ROWS;

// Max points per difficulty
const DIFF_PTS = { easy: 10, medium: 20, hard: 30, expert: 50 };
// Points deducted per tile revealed
const DIFF_COST = { easy: 1, medium: 2, hard: 3, expert: 5 };
const DIFF_POOL = {
  easy: ["easy", "medium", "hard", "expert"],
  medium: ["medium", "hard", "expert"],
  hard: ["hard", "expert"],
  expert: ["expert"]
};

// ── STATE ─────────────────────────────────────────────────────────────────────
let teams = [], currentTeamIdx = 0, round = 1;
let current = null, revealed = [], diffLevel = "easy";
let shuffleOrder = [], shuffleIdx = 0;
let done = false, diffLocked = false;
let usedFlags = [];

// ── SETUP ─────────────────────────────────────────────────────────────────────
function updateTeamNameInputs() {
  const n = parseInt(document.getElementById("teamCount").value);
  const grid = document.getElementById("teamNamesGrid");
  grid.innerHTML = "";
  for (let i = 0; i < n; i++) {
    const row = document.createElement("div"); row.className = "team-name-row";
    const dot = document.createElement("div"); dot.className = "team-dot";
    dot.style.background = TEAM_COLOURS[i];
    const inp = document.createElement("input"); inp.className = "name-input";
    inp.type = "text"; inp.placeholder = "Team " + (i + 1); inp.value = "Team " + (i + 1);
    inp.id = "teamName" + i;
    row.appendChild(dot); row.appendChild(inp);
    grid.appendChild(row);
  }
}

function startGame() {
  const n = parseInt(document.getElementById("teamCount").value);
  teams = [];
  for (let i = 0; i < n; i++) {
    const inp = document.getElementById("teamName" + i);
    teams.push({ name: inp.value.trim() || "Team " + (i + 1), colour: TEAM_COLOURS[i], score: 0 });
  }
  currentTeamIdx = 0; round = 1; usedFlags = [];
  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("gameScreen").style.display = "flex";
  renderScoreboard();
  startRound();
}

// ── ROUND ─────────────────────────────────────────────────────────────────────
function startRound() {
  done = false; diffLocked = false; revealed = [];

  // pick flag from the current difficulty pool, then avoid repeats until the pool is exhausted
  const pool = DIFF_POOL[diffLevel] || DIFF_POOL.easy;
  let eligible = FLAGS.filter((flag, i) => pool.includes(flag.difficulty) && !usedFlags.includes(i));
  if (!eligible.length) {
    usedFlags = [];
    eligible = FLAGS.filter(flag => pool.includes(flag.difficulty));
  }
  current = eligible[Math.floor(Math.random() * eligible.length)];
  usedFlags.push(FLAGS.indexOf(current));

  document.getElementById("roundVal").textContent = round;

  // load flag image
  const img = document.getElementById("flagImg");
  img.src = flagUrl(current.code);
  img.alt = current.name + " flag";

  // tiles
  const grid = document.getElementById("gridOverlay");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${COLS},1fr)`;
  grid.style.gridTemplateRows = `repeat(${ROWS},1fr)`;
  for (let i = 0; i < TOTAL; i++) {
    const t = document.createElement("div"); t.className = "tile"; t.id = "t" + i; grid.appendChild(t);
  }

  // reset overlays & border
  document.getElementById("answerOverlay").textContent = "";
  document.getElementById("answerOverlay").className = "answer-overlay";
  document.getElementById("flagWrap").style.border = "1px solid #0f1117";

  // reset controls
  document.getElementById("guessInput").value = "";
  document.getElementById("guessInput").disabled = false;
  document.getElementById("btnGuess").disabled = false;
  document.getElementById("feedback").textContent = "";
  document.getElementById("feedback").className = "feedback";
  document.getElementById("autocomplete").style.display = "none";
  document.getElementById("btnNext").className = "btn-next";
  resetPrimaryRevealButton();
  document.getElementById("btnR1").disabled = false;
  document.getElementById("btnRA").disabled = false;
  document.getElementById("btnAns").disabled = false;

  // re-enable difficulty buttons
  ["easy", "medium", "hard", "expert"].forEach(x => {
    document.getElementById("d" + x[0].toUpperCase() + x.slice(1)).disabled = false;
  });
  document.querySelectorAll(".pts-chip").forEach(c => c.classList.remove("locked"));

  shuffleOrder = shuffledArr(); shuffleIdx = 0;

  setDiff(diffLevel); // keep the current difficulty selection active
  updateBanner();
  updateProgress();
  updatePtsMeter();
}

function shuffledArr() {
  const a = Array.from({ length: TOTAL }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ── DIFFICULTY ────────────────────────────────────────────────────────────────
function setDiff(d) {
  if (diffLocked) return;
  diffLevel = d;
  ["easy", "medium", "hard", "expert"].forEach(x => {
    document.getElementById("d" + x[0].toUpperCase() + x.slice(1)).className =
      "diff-btn" + (d === x ? " active-" + x : "");
  });
  document.querySelectorAll(".pts-chip").forEach(c => {
    // match chip by its onclick attribute
    const onclick = c.getAttribute("onclick") || "";
    c.classList.toggle("selected", onclick.includes("'" + d + "'"));
  });
  updateDiffBadge();
  updatePtsMeter();
}

function lockDiff() {
  if (diffLocked) return;
  diffLocked = true;
  ["easy", "medium", "hard", "expert"].forEach(x => {
    document.getElementById("d" + x[0].toUpperCase() + x.slice(1)).disabled = true;
  });
  document.querySelectorAll(".pts-chip").forEach(c => c.classList.add("locked"));
}

// ── REVEAL ────────────────────────────────────────────────────────────────────
function revealOne() {
  if (shuffleIdx >= shuffleOrder.length) return;
  const idx = shuffleOrder[shuffleIdx++];
  if (!revealed.includes(idx)) {
    revealed.push(idx);
    const t = document.getElementById("t" + idx);
    if (t) t.classList.add("revealed");
  }
}

function revealTiles(n) {
  if (done) return;
  lockDiff();
  document.getElementById("flagWrap").style.border = "1px solid rgba(255,255,255,0.15)";
  for (let i = 0; i < n; i++) revealOne();
  if (revealed.length >= TOTAL) disableReveal();
  updateProgress(); updatePtsMeter();
}

function _revealAllTiles() {
  lockDiff();
  document.getElementById("flagWrap").style.border = "1px solid rgba(255,255,255,0.15)";
  while (shuffleIdx < shuffleOrder.length) revealOne();
  disableReveal();
  updateProgress();
}

function revealAll() {
  if (done) return;
  _revealAllTiles();
  updatePtsMeter();
}

function disableReveal() {
  document.getElementById("btnR1").disabled = true;
  document.getElementById("btnRA").disabled = true;
}

function setPrimaryRevealButton(mode) {
  const btn = document.getElementById("btnR1");
  if (!btn) return;

  if (mode === "next") {
    btn.disabled = false;
    btn.onclick = nextTurn;
    btn.innerHTML = `
      Next
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    `;
    return;
  }

  btn.disabled = false;
  btn.onclick = function () { revealTiles(1); };
  btn.innerHTML = `
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    Reveal 1 tile
  `;
}

function resetPrimaryRevealButton() {
  setPrimaryRevealButton("reveal");
}

// ── GIVE UP ───────────────────────────────────────────────────────────────────
function showAnswer() {
  if (done) return;
  done = true;
  lockDiff();
  const penalty = DIFF_PTS[diffLevel];
  teams[currentTeamIdx].score -= penalty;
  _revealAllTiles();
  setMeterFinal(-penalty);
  const ao = document.getElementById("answerOverlay");
  ao.textContent = current.name; ao.className = "answer-overlay visible";
  const fb = document.getElementById("feedback");
  fb.textContent = `The answer was ${current.name} — penalty of −${penalty} points.`;
  fb.className = "feedback answer show";
  document.getElementById("btnAns").disabled = true;
  document.getElementById("guessInput").disabled = true;
  document.getElementById("btnGuess").disabled = true;
  document.getElementById("btnNext").className = "btn-next visible";
  setPrimaryRevealButton("next");
  renderScoreboard();
}

// ── GUESS ─────────────────────────────────────────────────────────────────────
function calcPts() {
  return DIFF_PTS[diffLevel] - (revealed.length * DIFF_COST[diffLevel]);
}

function submitGuess() {
  if (done) return;
  const val = document.getElementById("guessInput").value.trim();
  if (!val) return;
  document.getElementById("autocomplete").style.display = "none";
  lockDiff();

  const fb = document.getElementById("feedback");

  if (val.toLowerCase() === current.name.toLowerCase()) {
    const pts = calcPts();
    teams[currentTeamIdx].score += pts;
    _revealAllTiles();
    setMeterFinal(pts);
    const ao = document.getElementById("answerOverlay");
    ao.textContent = current.name; ao.className = "answer-overlay visible";
    const sign = pts >= 0 ? "+" : "";
    fb.textContent = `Correct! ${sign}${pts} pts — ${current.name}`;
    fb.className = "feedback correct show";
    done = true;
    document.getElementById("btnAns").disabled = true;
    document.getElementById("guessInput").disabled = true;
    document.getElementById("btnGuess").disabled = true;
    document.getElementById("btnNext").className = "btn-next visible";
    setPrimaryRevealButton("next");
  } else {
    const penalty = DIFF_PTS[diffLevel];
    teams[currentTeamIdx].score -= penalty;
    done = true;
    _revealAllTiles();
    setMeterFinal(-penalty);
    const ao = document.getElementById("answerOverlay");
    ao.textContent = current.name; ao.className = "answer-overlay visible";
    fb.textContent = `Wrong! The answer was ${current.name} — penalty of −${penalty} points.`;
    fb.className = "feedback wrong show";
    document.getElementById("btnAns").disabled = true;
    document.getElementById("guessInput").disabled = true;
    document.getElementById("btnGuess").disabled = true;
    document.getElementById("btnNext").className = "btn-next visible";
    setPrimaryRevealButton("next");
  }
  document.getElementById("guessInput").value = "";
  renderScoreboard();
}

function nextTurn() {
  currentTeamIdx = (currentTeamIdx + 1) % teams.length;
  if (currentTeamIdx === 0) round++;
  startRound();
}

// ── UI ────────────────────────────────────────────────────────────────────────
function updateBanner() {
  const t = teams[currentTeamIdx];
  document.getElementById("bannerDot").style.background = t.colour;
  document.getElementById("bannerName").textContent = t.name + "'s turn";
  document.getElementById("bannerSub").textContent = "Choose difficulty, then reveal tiles";
}

function updateProgress() {
  const pct = Math.round(revealed.length / TOTAL * 100);
  document.getElementById("progFill").style.width = pct + "%";
  document.getElementById("progLabel").textContent = revealed.length + " / " + TOTAL;
}

function updatePtsMeter() {
  const pts = calcPts();
  const el = document.getElementById("ptsMeter");
  el.textContent = pts;
  el.className = "pts-meter-val " + (pts > 0 ? "positive" : pts < 0 ? "negative" : "zero");
  const cost = DIFF_COST[diffLevel];
  document.getElementById("ptsMeterSub").textContent =
    revealed.length === 0
      ? `No tiles revealed yet\n(−${cost} pt${cost > 1 ? "s" : ""} per tile)`
      : `${revealed.length} tile${revealed.length !== 1 ? "s" : ""} revealed\n(−${cost} pt${cost > 1 ? "s" : ""} each)`;
}

function setMeterFinal(pts) {
  const el = document.getElementById("ptsMeter");
  el.textContent = (pts >= 0 ? "+" : "") + pts;
  el.className = "pts-meter-val " + (pts > 0 ? "positive" : pts < 0 ? "negative" : "zero");
  document.getElementById("ptsMeterSub").textContent = "Points earned this round";
}

function updateDiffBadge() {
  const map = { easy: ["Easy", "badge-easy"], medium: ["Medium", "badge-medium"], hard: ["Hard", "badge-hard"], expert: ["Expert", "badge-expert"] };
  const [label, cls] = map[diffLevel];
  const b = document.getElementById("diffBadge");
  b.textContent = label; b.className = "diff-badge " + cls;
}

function renderScoreboard() {
  const sorted = [...teams].map((t, i) => ({ ...t, idx: i })).sort((a, b) => b.score - a.score);
  const sb = document.getElementById("sbTeams"); sb.innerHTML = "";
  sorted.forEach((t, rank) => {
    const div = document.createElement("div");
    div.className = "sb-team" + (t.idx === currentTeamIdx ? " active-team" : "");
    const scClass = t.score > 0 ? "pos" : t.score < 0 ? "neg" : "zero";
    const leadBadge = rank === 0 && teams.length > 1 ? `<span class="sb-team-badge">🥇 Leading</span>` : "";
    const curBadge = t.idx === currentTeamIdx ? `<span class="sb-team-badge current">Playing now</span>` : "";
    div.innerHTML = `
      <div class="sb-team-dot" style="background:${t.colour}"></div>
      <div class="sb-team-name">${t.name}</div>
      ${leadBadge}${curBadge}
      <div class="sb-team-score ${scClass}">${t.score}</div>
    `;
    sb.appendChild(div);
  });
}

// ── FINISH ────────────────────────────────────────────────────────────────────
function openFinishModal() {
  const sorted = [...teams].map((t, i) => ({ ...t, idx: i })).sort((a, b) => b.score - a.score);
  const winners = sorted.filter(t => t.score === sorted[0].score);
  document.getElementById("modalSub").textContent =
    `After ${round} round${round !== 1 ? "s" : ""} — final standings`;
  if (winners.length > 1) {
    document.getElementById("winnerName").textContent = winners.map(w => w.name).join(" & ");
    document.getElementById("winnerScore").textContent = `Tied on ${sorted[0].score} points`;
  } else {
    document.getElementById("winnerName").textContent = sorted[0].name;
    document.getElementById("winnerScore").textContent = sorted[0].score + " points";
  }
  const lb = document.getElementById("modalLeaderboard"); lb.innerHTML = "";
  sorted.forEach((t, i) => {
    const scClass = t.score > 0 ? "pos" : t.score < 0 ? "neg" : "zero";
    const div = document.createElement("div"); div.className = "ml-row";
    div.innerHTML = `
      <div class="ml-pos">${i + 1}.</div>
      <div class="ml-dot" style="background:${t.colour}"></div>
      <div class="ml-name">${t.name}</div>
      <div class="ml-score ${scClass}">${t.score}</div>
    `;
    lb.appendChild(div);
  });
  document.getElementById("finishModal").className = "modal-backdrop open";
}

function playAgain() {
  document.getElementById("finishModal").className = "modal-backdrop";
  document.getElementById("gameScreen").style.display = "none";
  document.getElementById("setupScreen").style.display = "block";
  updateTeamNameInputs();
}

// ── AUTOCOMPLETE ──────────────────────────────────────────────────────────────
let acSuppressHide = false;

function onType() {
  const input = document.getElementById("guessInput");
  const val = input.value.trim().toLowerCase();
  const box = document.getElementById("autocomplete");
  if (!val) { box.style.display = "none"; return; }
  const matches = FLAGS.map(f => f.name).filter(n => n.toLowerCase().startsWith(val));
  if (!matches.length) { box.style.display = "none"; return; }

  box.innerHTML = "";
  matches.slice(0, 8).forEach(n => {
    const item = document.createElement("div");
    item.className = "ac-item";
    item.textContent = n;
    item.addEventListener("mousedown", function (e) {
      e.preventDefault();
      acSuppressHide = true;
    });
    item.addEventListener("mouseup", function () {
      acSuppressHide = false;
      document.getElementById("guessInput").value = n;
      document.getElementById("autocomplete").style.display = "none";
      submitGuess();
    });
    box.appendChild(item);
  });

  const r = input.getBoundingClientRect();
  box.style.left = r.left + "px";
  box.style.top = (r.bottom + 4) + "px";
  box.style.width = r.width + "px";
  box.style.display = "block";
}

document.addEventListener("click", e => {
  if (acSuppressHide) return;
  if (!e.target.closest(".guess-wrap") && !e.target.closest(".autocomplete")) {
    document.getElementById("autocomplete").style.display = "none";
  }
});
window.addEventListener("scroll", () => { document.getElementById("autocomplete").style.display = "none"; }, true);
window.addEventListener("resize", () => { document.getElementById("autocomplete").style.display = "none"; });

// ── BOOT ──────────────────────────────────────────────────────────────────────
updateTeamNameInputs();
/**
 * MINI GOOGLE - PRE-1998 VS PAGERANK (1,000,000 RANDOM SURFER SIMULATION)
 * Data and logic implementation for class activity
 */

// 1. Dataset definition exactly matching user prompt
const WEBSITES_DATA = [
  {
    id: 1,
    url: "pune-food-guide.com",
    title: "Pune Food Guide",
    content: "Where to eat in Pune - vada pav and biryani and pizza",
    outgoing: [2],
    color: "#4285f4",
    x: 180,
    y: 160
  },
  {
    id: 2,
    url: "best-pizza-pune.com",
    title: "Best Pizza Pune",
    content: "Fresh wood-fired pizza made daily - try our cheese pizza",
    outgoing: [1, 3],
    color: "#fbbc05", // Authority hub
    x: 480,
    y: 260
  },
  {
    id: 3,
    url: "college-canteen-blog.com",
    title: "College Canteen Blog",
    content: "Student reviews of canteen food and chai and Friday pizza",
    outgoing: [2, 4],
    color: "#34a853",
    x: 760,
    y: 160
  },
  {
    id: 4,
    url: "pizza-recipes-home.com",
    title: "Pizza Recipes Home",
    content: "Make pizza at home - pizza dough and pizza sauce",
    outgoing: [2, 5],
    color: "#9d4edd",
    x: 740,
    y: 400
  },
  {
    id: 5,
    url: "cheap-eats-pune.com",
    title: "Cheap Eats Pune",
    content: "Good food under 100 rupees - misal and dosa and pizza slices",
    outgoing: [2],
    color: "#00f2fe",
    x: 480,
    y: 440
  },
  {
    id: 6,
    url: "pizza-pizza-pizza.com",
    title: "Pizza Pizza Pizza (Keyword Spammer)",
    content: "pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza",
    outgoing: [1],
    color: "#ea4335", // Spam site
    x: 180,
    y: 380
  }
];

// Precompute incoming links
WEBSITES_DATA.forEach(site => {
  site.incoming = [];
});
WEBSITES_DATA.forEach(site => {
  site.outgoing.forEach(targetId => {
    const target = WEBSITES_DATA.find(s => s.id === targetId);
    if (target && !target.incoming.includes(site.id)) {
      target.incoming.push(site.id);
    }
  });
});

// App State
const state = {
  searchQuery: "pizza",
  dampingFactor: 0.85,
  targetMoves: 1000000,
  currentMoves: 0,
  surferNodeId: 1,
  visits: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
  isRunningTurbo: false,
  isLiveSurfing: false,
  liveSurferTimer: null,
  liveSpeedMs: 50,
  // Animation coordinates for surfer on canvas
  surferPos: { x: 180, y: 160 },
  surferTargetPos: { x: 180, y: 160 },
  surferHopProgress: 1, // 0 to 1
  ripples: [],
  lastHopType: "Initial start"
};

// Canvas references
let canvas, ctx;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initDOM();
  initCanvas();
  renderAllViews();
  setupEventListeners();
  // Auto-run a modest seed of 1,000 moves so user lands on interactive data right away
  runBatchMoves(1000);
});

function initDOM() {
  document.getElementById("searchInput").value = state.searchQuery;
  updateSearchLabels();
}

function updateSearchLabels() {
  const query = state.searchQuery.trim().toLowerCase();
  document.getElementById("currentSearchDisplay").textContent = query || "pizza";
  document.querySelectorAll(".dynamic-query").forEach(el => {
    el.textContent = query || "pizza";
  });
}

function countKeywords(text, query) {
  if (!query) return 0;
  const cleanText = text.toLowerCase();
  const cleanQuery = query.toLowerCase().trim();
  if (!cleanQuery) return 0;

  // Regex for word boundary or occurrence
  const regex = new RegExp(`\\b${cleanQuery}\\b`, "gi");
  const matches = cleanText.match(regex);
  if (matches) return matches.length;

  // Fallback to substring matching if query is inside words
  let count = 0;
  let pos = cleanText.indexOf(cleanQuery);
  while (pos !== -1) {
    count++;
    pos = cleanText.indexOf(cleanQuery, pos + cleanQuery.length);
  }
  return count;
}

// ==========================================
// PAGERANK / RANDOM SURFER ENGINE
// ==========================================

function getNextSurferStep(currentNodeId) {
  const currentNode = WEBSITES_DATA.find(s => s.id === currentNodeId);
  const teleport = Math.random() > state.dampingFactor || !currentNode.outgoing || currentNode.outgoing.length === 0;

  let nextId;
  let hopType = "";

  if (teleport) {
    // 15% probability: Teleport uniformly to ANY random node (1..6)
    const randomIndex = Math.floor(Math.random() * WEBSITES_DATA.length);
    nextId = WEBSITES_DATA[randomIndex].id;
    hopType = `Teleported (15% random jump) to Node ${nextId}`;
  } else {
    // 85% probability: Follow a random outgoing hyperlink from current node
    const randomLinkIndex = Math.floor(Math.random() * currentNode.outgoing.length);
    nextId = currentNode.outgoing[randomLinkIndex];
    hopType = `Followed link ${currentNode.id} &rarr; ${nextId}`;
  }

  return { nextId, hopType };
}

function runBatchMoves(numMoves) {
  let curr = state.surferNodeId;
  for (let i = 0; i < numMoves; i++) {
    const step = getNextSurferStep(curr);
    curr = step.nextId;
    state.visits[curr]++;
  }
  state.surferNodeId = curr;
  state.currentMoves += numMoves;
  updateSurferUI();
  renderAllViews();
}

function run1MillionMovesAsync() {
  if (state.isRunningTurbo) return;
  if (state.isLiveSurfing) stopLiveSurfer();

  state.isRunningTurbo = true;
  document.getElementById("btnRun1M").disabled = true;
  document.getElementById("surferStatus").textContent = "Computing 1,000,000 Walks...";
  document.getElementById("surferStatus").className = "stat-value status-badge running";

  const totalNeeded = state.targetMoves;
  const startTime = performance.now();
  const batchSize = 40000; // chunk size for high-speed responsiveness with smooth UI updates

  function stepTurbo() {
    if (state.currentMoves < totalNeeded) {
      const remaining = totalNeeded - state.currentMoves;
      const count = Math.min(batchSize, remaining);
      runBatchMoves(count);
      requestAnimationFrame(stepTurbo);
    } else {
      state.isRunningTurbo = false;
      document.getElementById("btnRun1M").disabled = false;
      const duration = ((performance.now() - startTime) / 1000).toFixed(2);
      document.getElementById("surferStatus").textContent = `1M Moves Done (${duration}s)`;
      document.getElementById("surferStatus").className = "stat-value status-badge";
      document.getElementById("lastActionText").innerHTML = `Completed 1,000,000 random walks. Converged to steady-state PageRank!`;
      addRipple(WEBSITES_DATA.find(s => s.id === 2)); // Ripple best site
    }
  }

  requestAnimationFrame(stepTurbo);
}

function toggleLiveSurfer() {
  if (state.isLiveSurfing) {
    stopLiveSurfer();
  } else {
    startLiveSurfer();
  }
}

function startLiveSurfer() {
  if (state.isRunningTurbo) return;
  state.isLiveSurfing = true;
  document.getElementById("liveBtnText").textContent = "Pause Live Surfer";
  document.querySelector(".indicator-dot").classList.add("active");
  document.getElementById("surferStatus").textContent = "Live Hopping";
  document.getElementById("surferStatus").className = "stat-value status-badge running";

  performSingleLiveHop();
}

function stopLiveSurfer() {
  state.isLiveSurfing = false;
  clearTimeout(state.liveSurferTimer);
  document.getElementById("liveBtnText").textContent = "Watch Live Animated Surfer";
  document.querySelector(".indicator-dot").classList.remove("active");
  document.getElementById("surferStatus").textContent = "Paused";
  document.getElementById("surferStatus").className = "stat-value status-badge";
}

function performSingleLiveHop() {
  if (!state.isLiveSurfing) return;

  const current = WEBSITES_DATA.find(s => s.id === state.surferNodeId);
  const step = getNextSurferStep(state.surferNodeId);
  const target = WEBSITES_DATA.find(s => s.id === step.nextId);

  state.lastHopType = step.hopType;
  state.surferNodeId = step.nextId;
  state.visits[step.nextId]++;
  state.currentMoves++;

  // Trigger visual ripple at target
  addRipple(target);

  // Animate surfer particle from current to target
  state.surferPos = { x: current.x, y: current.y };
  state.surferTargetPos = { x: target.x, y: target.y };
  state.surferHopProgress = 0;

  updateSurferUI();
  renderAllViews();

  state.liveSurferTimer = setTimeout(performSingleLiveHop, state.liveSpeedMs);
}

function resetSimulation() {
  stopLiveSurfer();
  state.currentMoves = 0;
  state.visits = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  state.surferNodeId = 1;
  state.surferPos = { x: WEBSITES_DATA[0].x, y: WEBSITES_DATA[0].y };
  state.surferTargetPos = { x: WEBSITES_DATA[0].x, y: WEBSITES_DATA[0].y };
  state.surferHopProgress = 1;
  state.ripples = [];
  document.getElementById("surferStatus").textContent = "Reset";
  document.getElementById("surferStatus").className = "stat-value status-badge";
  document.getElementById("lastActionText").textContent = "Simulation reset to zero moves.";

  updateSurferUI();
  renderAllViews();
}

function updateSurferUI() {
  const moves = state.currentMoves;
  document.getElementById("currentMovesCounter").textContent = moves.toLocaleString();

  const pct = Math.min(100, (moves / state.targetMoves) * 100);
  document.getElementById("progressFill").style.width = `${pct}%`;
  document.getElementById("progressText").textContent = `${pct.toFixed(1)}% Complete (${moves.toLocaleString()} / 1,000,000)`;

  const currNode = WEBSITES_DATA.find(s => s.id === state.surferNodeId);
  if (currNode) {
    document.getElementById("activeNodeName").textContent = `Node ${currNode.id}: ${currNode.url}`;
  }
  if (state.lastHopType) {
    document.getElementById("lastActionText").innerHTML = state.lastHopType;
  }
}

// ==========================================
// SEARCH & RANKING ALGORITHMS
// ==========================================

function computeRankings() {
  const query = state.searchQuery.trim().toLowerCase();
  const totalMoves = Math.max(1, state.currentMoves);

  // Compute metrics for each site
  const items = WEBSITES_DATA.map(site => {
    const kwCount = countKeywords(site.content, query);
    const visits = state.visits[site.id] || 0;
    const pageRankScore = visits / totalMoves;

    return {
      ...site,
      keywordCount: kwCount,
      visits: visits,
      pageRankScore: pageRankScore,
      inDegree: site.incoming.length,
      outDegree: site.outgoing.length
    };
  });

  // 1. Old Way (Pre-1998): Rank strictly by keyword frequency descending
  // If tied, tie-break by ID
  const oldRanked = [...items].sort((a, b) => {
    if (b.keywordCount !== a.keywordCount) {
      return b.keywordCount - a.keywordCount;
    }
    return a.id - b.id;
  });

  // 2. New Way (1998+ PageRank):
  // Google combined relevance (contains query) with PageRank authority
  // For queries matching content: PageRank dictates the authoritative ordering
  // We sort by PageRank score descending!
  const newRanked = [...items].sort((a, b) => {
    // If user searched for something, pages containing the term get prioritized, then ranked by PageRank
    const aHasQuery = query === "" || a.keywordCount > 0;
    const bHasQuery = query === "" || b.keywordCount > 0;

    if (aHasQuery && !bHasQuery) return -1;
    if (!aHasQuery && bHasQuery) return 1;

    return b.pageRankScore - a.pageRankScore;
  });

  // Assign ranks for table reference
  const oldRankMap = {};
  oldRanked.forEach((s, idx) => { oldRankMap[s.id] = idx + 1; });

  const newRankMap = {};
  newRanked.forEach((s, idx) => { newRankMap[s.id] = idx + 1; });

  return { oldRanked, newRanked, oldRankMap, newRankMap, items };
}

function renderAllViews() {
  const { oldRanked, newRanked, oldRankMap, newRankMap, items } = computeRankings();
  renderOldRankingList(oldRanked);
  renderNewRankingList(newRanked);
  renderTelemetryTable(items, oldRankMap, newRankMap);
}

function renderOldRankingList(rankedList) {
  const container = document.getElementById("oldRankingList");
  container.innerHTML = "";

  rankedList.forEach((site, index) => {
    const rank = index + 1;
    const isSpamWinner = site.id === 6 && rank === 1;

    const el = document.createElement("div");
    el.className = `rank-item rank-${rank}`;
    el.onclick = () => openSiteModal(site.id);

    el.innerHTML = `
      <div class="rank-badge">${rank}</div>
      <div class="rank-info">
        <div class="rank-title">
          <span>${site.title}</span>
          ${isSpamWinner ? `<span class="spam-warning-pill">&#9888; KEYWORD SPAM WINNER</span>` : ""}
        </div>
        <div class="url-subtext">${site.url}</div>
        <div class="rank-snippet">${highlightKeywords(site.content, state.searchQuery)}</div>
      </div>
      <div class="rank-metric">
        <div class="metric-val" style="color: ${site.id === 6 ? '#ff4d4d' : '#fff'}">${site.keywordCount}</div>
        <div class="metric-lbl">Keyword Hits</div>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderNewRankingList(rankedList) {
  const container = document.getElementById("newRankingList");
  container.innerHTML = "";

  rankedList.forEach((site, index) => {
    const rank = index + 1;
    const isAuthorityWinner = site.id === 2 && rank === 1;
    const isSpamDefeated = site.id === 6;
    const pct = (site.pageRankScore * 100).toFixed(2);

    const el = document.createElement("div");
    el.className = `rank-item rank-${rank}`;
    el.onclick = () => openSiteModal(site.id);

    el.innerHTML = `
      <div class="rank-badge">${rank}</div>
      <div class="rank-info">
        <div class="rank-title">
          <span>${site.title}</span>
          ${isAuthorityWinner ? `<span class="authority-pill">&#9733; #1 AUTHORITY (PAGERANK)</span>` : ""}
          ${isSpamDefeated ? `<span class="spam-warning-pill" style="border-color:#666; color:#999;">Spam Defeated (0 Inlinks)</span>` : ""}
        </div>
        <div class="url-subtext">${site.url}</div>
        <div class="rank-snippet">${highlightKeywords(site.content, state.searchQuery)}</div>
      </div>
      <div class="rank-metric">
        <div class="metric-val" style="color: ${site.id === 2 ? '#fbbc05' : 'var(--accent-cyan)'}">${pct}%</div>
        <div class="metric-lbl">${site.visits.toLocaleString()} visits</div>
      </div>
    `;
    container.appendChild(el);
  });
}

function renderTelemetryTable(items, oldRankMap, newRankMap) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  items.forEach(site => {
    const tr = document.createElement("tr");
    tr.onclick = () => openSiteModal(site.id);

    const prPct = (site.pageRankScore * 100).toFixed(2);
    const isBestPizza = site.id === 2;
    const isSpammer = site.id === 6;

    tr.innerHTML = `
      <td><strong>#${site.id}</strong></td>
      <td>
        <span class="table-url">${site.url}</span>
        ${isBestPizza ? ` <span class="authority-pill">&#9733; Hub</span>` : ""}
        ${isSpammer ? ` <span class="spam-warning-pill">Spammer</span>` : ""}
      </td>
      <td style="max-width:240px; font-size:0.8rem;">${site.content}</td>
      <td style="font-weight:700; color:${isSpammer ? '#ff4d4d' : '#fff'}">${site.keywordCount}</td>
      <td><code>[${site.outgoing.join(", ")}]</code></td>
      <td><code>${site.incoming.length > 0 ? '[' + site.incoming.join(", ") + ']' : 'None (0)'}</code></td>
      <td style="font-family:'Fira Code',monospace">${site.visits.toLocaleString()}</td>
      <td style="font-family:'Fira Code',monospace; font-weight:700; color:${isBestPizza ? '#fbbc05' : '#00f2fe'}">${prPct}%</td>
      <td><span class="rank-badge" style="width:24px;height:24px;font-size:0.75rem;display:inline-flex;">${oldRankMap[site.id]}</span></td>
      <td><span class="rank-badge" style="width:24px;height:24px;font-size:0.75rem;display:inline-flex;background:var(--google-blue);">${newRankMap[site.id]}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function highlightKeywords(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, `<span style="background: rgba(251, 188, 5, 0.3); color: #fff; padding: 1px 4px; border-radius: 3px; font-weight: 700;">$1</span>`);
}

// ==========================================
// INTERACTIVE CANVAS GRAPH VISUALIZATION
// ==========================================

function initCanvas() {
  canvas = document.getElementById("networkCanvas");
  ctx = canvas.getContext("2d");

  // Handle high-DPI displays
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Start smooth animation loop
  requestAnimationFrame(canvasLoop);
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  // Dynamically position nodes according to canvas aspect ratio
  adjustNodePositions(rect.width, rect.height);
}

function adjustNodePositions(w, h) {
  // Balanced elliptical / hub-and-spoke layout:
  // Node 2 (Best Pizza Pune - the authority) centered prominently
  const centerX = w / 2;
  const centerY = h / 2;

  // Position Site 2 in middle right, surrounded by guides and blogs
  WEBSITES_DATA[0].x = centerX - w * 0.30; WEBSITES_DATA[0].y = centerY - h * 0.28; // 1: Pune Food Guide
  WEBSITES_DATA[1].x = centerX;             WEBSITES_DATA[1].y = centerY - h * 0.05; // 2: Best Pizza Pune (Center Hub)
  WEBSITES_DATA[2].x = centerX + w * 0.32; WEBSITES_DATA[2].y = centerY - h * 0.28; // 3: College Canteen Blog
  WEBSITES_DATA[3].x = centerX + w * 0.28; WEBSITES_DATA[3].y = centerY + h * 0.30; // 4: Pizza Recipes Home
  WEBSITES_DATA[4].x = centerX - w * 0.05; WEBSITES_DATA[4].y = centerY + h * 0.35; // 5: Cheap Eats Pune
  WEBSITES_DATA[5].x = centerX - w * 0.36; WEBSITES_DATA[5].y = centerY + h * 0.24; // 6: Pizza Pizza Pizza (Spam)
}

function addRipple(node) {
  state.ripples.push({
    x: node.x,
    y: node.y,
    radius: 20,
    maxRadius: 55,
    opacity: 0.9,
    color: node.color
  });
}

function canvasLoop() {
  const rect = canvas.parentElement.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  // 1. Draw subtle background coordinate grid
  drawGrid(width, height);

  // 2. Draw directed hyperlink edges
  drawEdges();

  // 3. Draw active ripples
  drawRipples();

  // 4. Draw website nodes
  drawNodes();

  // 5. Draw animated random surfer particle
  drawSurferParticle();

  requestAnimationFrame(canvasLoop);
}

function drawGrid(w, h) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
  ctx.lineWidth = 1;
  const step = 40;
  for (let x = 0; x < w; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEdges() {
  WEBSITES_DATA.forEach(source => {
    source.outgoing.forEach(targetId => {
      const target = WEBSITES_DATA.find(s => s.id === targetId);
      if (!target) return;

      const isStarEdge = target.id === 2; // Edge pointing to Best Pizza Pune
      ctx.save();

      // Calculate control points for gentle curve
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Offset curve based on edge direction
      const normalX = -dy / dist;
      const normalY = dx / dist;
      const curvature = 24;
      const cx = (source.x + target.x) / 2 + normalX * curvature;
      const cy = (source.y + target.y) / 2 + normalY * curvature;

      // Stroke style
      if (isStarEdge) {
        ctx.strokeStyle = "rgba(251, 188, 5, 0.65)";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "rgba(251, 188, 5, 0.4)";
        ctx.shadowBlur = 8;
      } else {
        ctx.strokeStyle = "rgba(66, 133, 244, 0.35)";
        ctx.lineWidth = 1.6;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.quadraticCurveTo(cx, cy, target.x, target.y);
      ctx.stroke();

      // Draw directional arrow on quadratic curve
      drawArrowOnCurve(source.x, source.y, cx, cy, target.x, target.y, isStarEdge);

      ctx.restore();
    });
  });
}

function drawArrowOnCurve(x0, y0, cx, cy, x1, y1, isStarEdge) {
  // Arrow placed at 80% along the curve towards target
  const t = 0.78;
  const invT = 1 - t;
  const px = invT * invT * x0 + 2 * invT * t * cx + t * t * x1;
  const py = invT * invT * y0 + 2 * invT * t * cy + t * t * y1;

  // Tangent derivative vector
  const tangentX = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
  const tangentY = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
  const angle = Math.atan2(tangentY, tangentX);

  const arrowSize = isStarEdge ? 9 : 7;

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.fillStyle = isStarEdge ? "#fbbc05" : "#4285f4";
  ctx.beginPath();
  ctx.moveTo(arrowSize, 0);
  ctx.lineTo(-arrowSize, -arrowSize * 0.6);
  ctx.lineTo(-arrowSize * 0.5, 0);
  ctx.lineTo(-arrowSize, arrowSize * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRipples() {
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = r.opacity;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    r.radius += 1.8;
    r.opacity -= 0.035;

    if (r.opacity <= 0 || r.radius >= r.maxRadius) {
      state.ripples.splice(i, 1);
    }
  }
}

function drawNodes() {
  const totalMoves = Math.max(1, state.currentMoves);

  WEBSITES_DATA.forEach(node => {
    const visits = state.visits[node.id] || 0;
    const score = visits / totalMoves; // PageRank probability (0 to 1)

    // Base radius scales with PageRank visits!
    // Minimum radius 26px, scales up to 48px for top site
    const baseRadius = 24;
    const dynamicRadius = baseRadius + Math.min(26, score * 50);

    const isCurrent = node.id === state.surferNodeId;
    const isAuthority = node.id === 2;
    const isSpam = node.id === 6;

    ctx.save();

    // Node Glow & Shadow
    if (isAuthority) {
      ctx.shadowColor = "rgba(251, 188, 5, 0.75)";
      ctx.shadowBlur = 24;
    } else if (isSpam) {
      ctx.shadowColor = "rgba(234, 67, 53, 0.5)";
      ctx.shadowBlur = 14;
    } else {
      ctx.shadowColor = "rgba(66, 133, 244, 0.45)";
      ctx.shadowBlur = 14;
    }

    // Node Fill Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, dynamicRadius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(node.x - 6, node.y - 6, 2, node.x, node.y, dynamicRadius);
    grad.addColorStop(0, "#1e293b");
    grad.addColorStop(1, isAuthority ? "#332a0d" : (isSpam ? "#311018" : "#0d1b2a"));
    ctx.fillStyle = grad;
    ctx.fill();

    // Node Border Ring
    ctx.strokeStyle = isAuthority ? "#fbbc05" : (isSpam ? "#ea4335" : node.color);
    ctx.lineWidth = isCurrent ? 3.5 : 2;
    ctx.stroke();

    // Extra pulse ring for current surfer position
    if (isCurrent) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, dynamicRadius + 6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 242, 254, 0.6)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    // Text & Labels
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Node ID in center
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.floor(dynamicRadius * 0.65)}px 'Fira Code', monospace`;
    ctx.fillText(`#${node.id}`, node.x, node.y - 2);

    // URL Label below node
    ctx.font = "bold 12px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#f8fafc";
    ctx.fillText(node.url, node.x, node.y + dynamicRadius + 16);

    // PageRank percentage & In-Degree below URL
    const pct = (score * 100).toFixed(1);
    ctx.font = "11px 'Fira Code', monospace";
    ctx.fillStyle = isAuthority ? "#fbbc05" : "var(--accent-cyan)";
    ctx.fillText(`PR: ${pct}% (${node.incoming.length} in-links)`, node.x, node.y + dynamicRadius + 30);

    ctx.restore();
  });
}

function drawSurferParticle() {
  if (state.surferHopProgress < 1) {
    // Increment hop interpolation
    state.surferHopProgress += 0.08;
    if (state.surferHopProgress > 1) state.surferHopProgress = 1;
  }

  const p = state.surferHopProgress;
  // Quadratic easing for fluid movement
  const ease = p * (2 - p);

  const curX = state.surferPos.x + (state.surferTargetPos.x - state.surferPos.x) * ease;
  const curY = state.surferPos.y + (state.surferTargetPos.y - state.surferPos.y) * ease;

  ctx.save();
  // Outer surfer aura
  ctx.shadowColor = "#00f2fe";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#00f2fe";
  ctx.beginPath();
  ctx.arc(curX, curY, 8, 0, Math.PI * 2);
  ctx.fill();

  // Inner core
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(curX, curY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==========================================
// MODAL INSPECTOR & USER INTERACTIONS
// ==========================================

function openSiteModal(siteId) {
  const site = WEBSITES_DATA.find(s => s.id === siteId);
  if (!site) return;

  const { items } = computeRankings();
  const currentItem = items.find(s => s.id === siteId);

  document.getElementById("modalAddressBar").textContent = `http://${site.url}`;

  const isAuthority = site.id === 2;
  const isSpammer = site.id === 6;

  document.getElementById("modalBody").innerHTML = `
    <div style="margin-bottom: 16px;">
      <h3 style="font-size: 1.4rem; color: #fff; margin-bottom: 4px;">${site.title}</h3>
      <div style="color: var(--google-blue); font-family: 'Fira Code', monospace; font-size: 0.85rem;">
        URL: http://${site.url}
      </div>
    </div>

    <div style="background: rgba(0,0,0,0.4); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 20px;">
      <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; font-weight: 700;">Page Content (What Crawlers Read):</div>
      <p style="font-size: 1rem; color: #fff; font-style: italic; line-height: 1.6;">
        "${site.content}"
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px;">
        <span style="font-size: 0.75rem; color: var(--text-dim); display: block;">INCOMING HYPERLINKS (${site.incoming.length})</span>
        <strong style="color: #4ade80; font-family: 'Fira Code', monospace; font-size: 0.95rem;">
          ${site.incoming.length > 0 ? site.incoming.map(id => `Node #${id}`).join(", ") : 'None (Orphan page)'}
        </strong>
      </div>
      <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px;">
        <span style="font-size: 0.75rem; color: var(--text-dim); display: block;">OUTGOING HYPERLINKS (${site.outgoing.length})</span>
        <strong style="color: var(--google-blue); font-family: 'Fira Code', monospace; font-size: 0.95rem;">
          ${site.outgoing.map(id => `Node #${id}`).join(", ")}
        </strong>
      </div>
    </div>

    <div style="background: ${isAuthority ? 'rgba(251, 188, 5, 0.1)' : (isSpammer ? 'rgba(234, 67, 53, 0.1)' : 'rgba(66, 133, 244, 0.1)')}; padding: 14px; border-radius: 8px; border-left: 4px solid ${isAuthority ? '#fbbc05' : (isSpammer ? '#ea4335' : '#4285f4')};">
      <strong style="color: #fff; font-size: 0.9rem; display: block; margin-bottom: 4px;">
        ${isAuthority ? '🌟 Authority Hub Analysis' : (isSpammer ? '⚠️ Spam Exploit Breakdown' : 'ℹ️ Page Graph Context')}
      </strong>
      <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5;">
        ${isAuthority
          ? 'Site #2 is referenced by almost every other Pune food page (Nodes 1, 3, 4, 5). In PageRank, incoming links act as votes of confidence from other webmasters, propelling it to the top position.'
          : (isSpammer
            ? 'Site #6 repeats the word "pizza" 10 times with zero helpful info. Before 1998, search engines ranked it #1. However, nobody on the web links to it (0 in-links), so Google PageRank renders it completely harmless.'
            : `Site #${site.id} serves as part of the Pune web ecosystem, linking to Best Pizza Pune while receiving organic traffic.`
          )
        }
      </p>
    </div>
  `;

  document.getElementById("siteModal").classList.add("open");
}

function closeSiteModal() {
  document.getElementById("siteModal").classList.remove("open");
}

function setupEventListeners() {
  // Search Bar
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  const performSearch = () => {
    state.searchQuery = searchInput.value;
    updateSearchLabels();
    renderAllViews();
  };

  searchBtn.addEventListener("click", performSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") performSearch();
  });

  // Query chips
  document.querySelectorAll(".chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      searchInput.value = chip.getAttribute("data-query");
      performSearch();
    });
  });

  // Simulator Buttons
  document.getElementById("btnRun1M").addEventListener("click", run1MillionMovesAsync);
  document.getElementById("btnLiveSurfer").addEventListener("click", toggleLiveSurfer);
  document.getElementById("btnReset").addEventListener("click", resetSimulation);

  // Speed slider
  const speedSlider = document.getElementById("speedSlider");
  const speedValue = document.getElementById("speedValue");
  speedSlider.addEventListener("input", (e) => {
    state.liveSpeedMs = parseInt(e.target.value);
    speedValue.textContent = `${state.liveSpeedMs} ms`;
  });

  // Modal close
  document.getElementById("modalClose").addEventListener("click", closeSiteModal);
  document.getElementById("siteModal").addEventListener("click", (e) => {
    if (e.target.id === "siteModal") closeSiteModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSiteModal();
  });

  // Canvas click detection on nodes
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    WEBSITES_DATA.forEach(node => {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= 35) {
        openSiteModal(node.id);
      }
    });
  });
}

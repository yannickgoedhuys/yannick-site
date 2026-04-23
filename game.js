// ═══════════════════════════════════════════════════════════
//  Yannick's Office — Side-scrolling pixel art portfolio
// ═══════════════════════════════════════════════════════════

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ── Dimensions (base, will scale) ─────────────────────────
let W = 1200;
let H = 600;
const ASPECT = W / H; // 2:1
const FLOOR_Y = 460;       // where the floor starts
const WORLD_W = 2400;      // total scrollable width
const PLAYER_SPEED = 3.2;

// ── Responsive resize ─────────────────────────────────────
function resize() {
  const pad = 36; // room for HUD
  const maxW = window.innerWidth;
  const maxH = window.innerHeight - pad;
  let w = maxW;
  let h = w / ASPECT;
  if (h > maxH) { h = maxH; w = h * ASPECT; }
  canvas.style.width = Math.floor(w) + 'px';
  canvas.style.height = Math.floor(h) + 'px';
  // Update HUD width to match
  document.getElementById('hud').style.maxWidth = Math.floor(w) + 'px';
  document.getElementById('hud').style.width = Math.floor(w) + 'px';
}
canvas.width = W;
canvas.height = H;
resize();
window.addEventListener('resize', resize);

// ── Palette (brighter) ────────────────────────────────────
const C = {
  bg:         '#d8d4c8',
  wall:       '#c4c0b4',
  wallLine:   '#b0ac9e',
  floor:      '#c0b898',
  floorLine:  '#aca888',
  ceiling:    '#dedad0',
  wood:       '#7a6240',
  woodDk:     '#6a5234',
  woodLt:     '#8e764e',
  gold:       '#f0d878',
  screen:     '#82c8f0',
  screenDk:   '#5a9ac0',
  white:      '#f0f0f0',
  paper:      '#e4e4d8',
  red:        '#e07070',
  blue:       '#6a8ae0',
  green:      '#5ad88a',
  coffee:     '#8a6038',
  coffeeMach: '#6a6a88',
  skin:       '#f0d8b0',
  hair:       '#5a4a32',
  shirt:      '#5a8ae0',
  pants:      '#4a4a70',
  shadow:     'rgba(0,0,0,0.14)',
  plant:      '#3a8a50',
  plantDk:    '#2a7040',
  pot:        '#a08050',
  purple:     '#8070a0',
  purpleDk:   '#605080',
  cork:       '#a08a60',
  corkDk:     '#907a52',
  gray:       '#8080a0',
  grayDk:     '#606080',
  grayLt:     '#a0a0c0',
};

// ── Camera ─────────────────────────────────────────────────
let camX = 0;

// ── Input ──────────────────────────────────────────────────
const keys = {};
let dialogOpen = false;

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if ((k === 'e' || e.key === 'Escape') && dialogOpen) {
    closeDialog(); e.preventDefault(); return;
  }
  if (k === 'e' && !dialogOpen) tryInteract();
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
});
document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

// ── Dialog ─────────────────────────────────────────────────
const dialogEl = document.getElementById('dialog');
const dialogTitle = document.getElementById('dialog-title');
const dialogBody = document.getElementById('dialog-body');

function openDialog(title, body) {
  dialogTitle.textContent = title;
  dialogBody.innerHTML = body;
  dialogEl.classList.remove('hidden');
  dialogOpen = true;
}
function closeDialog() {
  dialogEl.classList.add('hidden');
  dialogOpen = false;
}

// ── Player (bigger!) ──────────────────────────────────────
const player = {
  x: 280, y: FLOOR_Y,
  w: 28, h: 56,
  vx: 0, vy: 0,
  dir: 1,       // 1=right, -1=left
  frame: 0,
  frameTick: 0,
  moving: false,
  grounded: true,
};

// ── Interactable objects (world-space x) ───────────────────
const objects = [
  {
    x: 200, y: FLOOR_Y, w: 120, h: 140,
    type: 'coffee',
    label: 'Coffee Machine',
    title: '☕ Coffee Machine',
    body: `While the espresso brews...

<b>Name:</b> Yannick Goedhuys
<b>Location:</b> Belgium
<b>Role:</b> Data Engineer
<b>Company:</b> DataSense → Vinçotte

I take my coffee seriously — espresso
gear is one of my hobbies. Currently
dialing in shots and exploring different
single-origin beans.

<i>"First, solve the data problem.
 Then, have coffee."</i>`,
  },
  {
    x: 520, y: FLOOR_Y, w: 210, h: 120,
    type: 'desk',
    label: 'Work Station',
    title: '💻 Work Station',
    body: `<b>Yannick Goedhuys</b>
Data Engineer @ DataSense (Hasselt, BE)
Currently deployed at Vinçotte

<b>Day to day:</b>
→ Building & maintaining data pipelines
→ Analytics infrastructure
→ Microsoft Fabric / Azure environment

<b>Tech stack:</b>
  Python · SQL · Git · Azure · Fabric
  Databricks · Power BI · DevOps`,
  },
  {
    x: 880, y: 180, w: 200, h: 120,
    type: 'board',
    label: 'Notice Board',
    title: '📌 Interests & Hobbies',
    body: `<b>👟 Sneakers</b>
  Collector & enthusiast

<b>☕ Espresso & Coffee</b>
  Gear, beans, and the perfect shot

<b>⚡ Electric Vehicles</b>
  Following the EV revolution

<b>🖥️ Mac Setup</b>
  Lean & optimized workflow
  Raycast · Finicky · Ice

<b>🤖 AI Tools</b>
  Coding, writing & documentation`,
  },
  {
    x: 1240, y: FLOOR_Y, w: 110, h: 200,
    type: 'bookshelf',
    label: 'Bookshelf',
    title: '📚 Skills & Tools',
    body: `<b>Languages & Data:</b>
  Python · SQL · PySpark · DAX

<b>Cloud & Platform:</b>
  Azure · Microsoft Fabric
  Databricks · Data Factory
  Azure DevOps

<b>Tools:</b>
  Git · VS Code · Power BI
  Docker · Jupyter

<b>Practices:</b>
  ETL/ELT pipelines · Data modeling
  CI/CD for data · Lakehouse architecture`,
  },
  {
    x: 1500, y: FLOOR_Y, w: 90, h: 170,
    type: 'server',
    label: 'Server Rack',
    title: '🖧 Data Infrastructure',
    body: `<b>What I build & maintain:</b>

→ End-to-end data pipelines
→ Lakehouse on Microsoft Fabric
→ Automated ingestion workflows
→ Data quality monitoring
→ Analytics-ready datasets

<b>Philosophy:</b>
  Keep it simple. Automate everything.
  Make data accessible & reliable.

<i>"Data pipelines should be boring —
 that means they're working."</i>`,
  },
  {
    x: 1740, y: 190, w: 180, h: 110,
    type: 'whiteboard',
    label: 'Whiteboard',
    title: '📋 Connect With Me',
    body: `<b>Find me online:</b>

<a href="https://github.com/yannickgoedhuys" target="_blank">→ GitHub: yannickgoedhuys</a>

<a href="https://linkedin.com/in/yannickgoedhuys" target="_blank">→ LinkedIn: yannickgoedhuys</a>

<b>Based in:</b> Belgium 🇧🇪

<i>Feel free to walk around the office
and check out the other items!</i>`,
  },
  {
    x: 2050, y: FLOOR_Y, w: 170, h: 90,
    type: 'couch',
    label: 'Couch',
    title: '🛋️ About This Site',
    body: `Built as a pixel-art office you can
explore — because portfolios don't
have to be boring.

<b>Made with:</b>
  Vanilla JS · HTML5 Canvas
  Zero dependencies

<b>Controls:</b>
  A / D → Walk left / right
  E → Interact with objects

<i>Crafted with help from Claude ✦</i>`,
  },
];

// Decorations (non-interactive)
const decorations = [
  { x: 90,   type: 'plant' },
  { x: 800,  type: 'plant' },
  { x: 1420, type: 'plant' },
  { x: 1980, type: 'plant' },
  { x: 440,  type: 'window' },
  { x: 1440, type: 'window' },
];

// ── Pixel drawing helpers ──────────────────────────────────
function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - camX), Math.round(y), w, h);
}

function rectAbs(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function border(x, y, w, h, color, t = 1) {
  ctx.strokeStyle = color;
  ctx.lineWidth = t;
  ctx.strokeRect(Math.round(x - camX) + 0.5, Math.round(y) + 0.5, w - 1, h - 1);
}

// ── Draw background ────────────────────────────────────────
function drawRoom() {
  // Back wall
  rectAbs(0, 0, W, FLOOR_Y, C.wall);
  // Wallpaper stripe pattern
  for (let wx = -camX % 80; wx < W; wx += 80) {
    rectAbs(wx, 0, 2, FLOOR_Y, C.wallLine);
  }
  // Baseboard
  rectAbs(0, FLOOR_Y - 8, W, 8, C.woodDk);
  rectAbs(0, FLOOR_Y - 8, W, 3, C.woodLt);
  // Ceiling trim
  rectAbs(0, 0, W, 5, C.ceiling);
  rectAbs(0, 5, W, 3, C.wallLine);

  // Floor
  rectAbs(0, FLOOR_Y, W, H - FLOOR_Y, C.floor);
  // Floor tile lines
  for (let fx = -camX % 60; fx < W; fx += 60) {
    rectAbs(fx, FLOOR_Y, 1, H - FLOOR_Y, C.floorLine);
  }
  // Floor highlight
  rectAbs(0, FLOOR_Y, W, 2, C.floorLine);
}

// ── Draw decorations ───────────────────────────────────────
function drawWindow(x) {
  const sx = x - camX;
  const wy = 140; // lowered windows
  // Frame
  rectAbs(sx, wy, 130, 150, C.grayDk);
  // Glass
  rectAbs(sx + 7, wy + 7, 116, 136, '#4a7a9a');
  // Cross bars
  rectAbs(sx + 62, wy + 7, 5, 136, C.gray);
  rectAbs(sx + 7, wy + 72, 116, 5, C.gray);
  // Sky gradient in glass
  const grad = ctx.createLinearGradient(0, wy + 7, 0, wy + 143);
  grad.addColorStop(0, 'rgba(120,180,240,0.35)');
  grad.addColorStop(1, 'rgba(80,120,180,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(sx + 7, wy + 7, 116, 136);
  // Light beam
  ctx.fillStyle = 'rgba(255,250,210,0.05)';
  ctx.beginPath();
  ctx.moveTo(sx + 14, wy + 143);
  ctx.lineTo(sx + 116, wy + 143);
  ctx.lineTo(sx + 150, FLOOR_Y + 100);
  ctx.lineTo(sx - 20, FLOOR_Y + 100);
  ctx.fill();
  // Sill
  rectAbs(sx - 5, wy + 150, 140, 8, C.gray);
}

function drawPlant(x) {
  const sx = x - camX;
  const by = FLOOR_Y;
  // Pot
  rectAbs(sx, by - 40, 40, 40, C.pot);
  rectAbs(sx - 4, by - 44, 48, 8, C.pot);
  rectAbs(sx + 3, by - 44, 34, 4, C.woodDk);
  // Leaves
  const leaves = [[10,-48],[24,-54],[5,-64],[30,-58],[16,-72],[0,-56],[34,-50],[18,-80]];
  for (const [lx, ly] of leaves) {
    rectAbs(sx + lx, by + ly, 14, 10, C.plant);
    rectAbs(sx + lx + 3, by + ly + 2, 8, 6, C.plantDk);
  }
  // Stem
  rectAbs(sx + 17, by - 60, 4, 18, C.plantDk);
}

// ── Draw furniture ─────────────────────────────────────────
function drawCoffeeMachine(obj) {
  const x = obj.x, by = obj.y;
  // Table
  rect(x, by - 54, 120, 10, C.wood);
  rect(x, by - 48, 120, 6, C.woodDk);
  // Table legs
  rect(x + 8, by - 42, 8, 42, C.woodDk);
  rect(x + 104, by - 42, 8, 42, C.woodDk);
  // Machine body
  rect(x + 26, by - 118, 68, 64, C.coffeeMach);
  rect(x + 26, by - 118, 68, 8, C.grayLt);
  rect(x + 26, by - 58, 68, 5, C.grayDk);
  // Display
  rect(x + 36, by - 104, 26, 14, '#1a2a1a');
  rect(x + 39, by - 101, 20, 8, '#2a6a2a');
  // Buttons
  rect(x + 70, by - 102, 10, 10, C.red);
  rect(x + 70, by - 88, 10, 10, C.green);
  // Drip nozzle
  rect(x + 50, by - 60, 18, 8, C.grayDk);
  // Cup
  rect(x + 46, by - 66, 14, 14, C.white);
  rect(x + 48, by - 64, 10, 6, C.coffee);
  // Steam
  const t = Date.now() / 500;
  for (let i = 0; i < 3; i++) {
    const sx = x + 51 + Math.sin(t + i * 1.8) * 5;
    const sy = by - 72 - i * 10;
    ctx.fillStyle = `rgba(210,210,230,${0.4 - i * 0.12})`;
    ctx.fillRect(Math.round(sx - camX), Math.round(sy), 5, 5);
  }
}

function drawDesk(obj) {
  const x = obj.x, by = obj.y;
  // Desk surface
  rect(x, by - 46, 210, 10, C.wood);
  rect(x, by - 38, 210, 5, C.woodDk);
  // Legs
  rect(x + 10, by - 33, 8, 33, C.woodDk);
  rect(x + 192, by - 33, 8, 33, C.woodDk);
  // Drawer
  rect(x + 158, by - 33, 44, 24, C.wood);
  rect(x + 174, by - 22, 12, 3, C.gold);
  // Chair
  rect(x + 80, by - 28, 52, 8, C.purpleDk);
  rect(x + 84, by - 20, 6, 20, C.grayDk);
  rect(x + 122, by - 20, 6, 20, C.grayDk);
  rect(x + 76, by - 60, 58, 34, C.purple);
  rect(x + 80, by - 56, 50, 26, '#8a7aaa');
  // Monitor
  rect(x + 46, by - 98, 66, 46, '#2a2a42');
  rect(x + 52, by - 92, 54, 34, C.screen);
  // Code on screen
  const lines = [18, 36, 26, 14, 32, 24, 20, 30];
  for (let i = 0; i < lines.length; i++) {
    rect(x + 58, by - 86 + i * 4, lines[i], 2, '#4aa0d0');
    if (i % 2 === 0) rect(x + 58 + lines[i] + 3, by - 86 + i * 4, 10, 2, '#a0d04a');
  }
  // Monitor stand
  rect(x + 72, by - 52, 18, 6, '#2a2a42');
  rect(x + 66, by - 48, 30, 4, '#3a3a52');
  // MacBook (closed) next to monitor
  rect(x + 132, by - 54, 40, 4, C.grayDk);
  rect(x + 135, by - 56, 34, 4, C.gray);
  // Coffee mug
  rect(x + 18, by - 60, 16, 14, C.white);
  rect(x + 20, by - 58, 12, 6, C.coffee);
  // Small plant
  rect(x + 184, by - 62, 18, 16, C.pot);
  rect(x + 186, by - 70, 14, 10, C.plant);
}

function drawNoticeBoard(obj) {
  const x = obj.x, y = obj.y;
  // Board frame
  rect(x, y, 200, 120, C.wood);
  // Cork
  rect(x + 7, y + 7, 186, 106, C.corkDk);
  rect(x + 10, y + 10, 180, 100, C.cork);
  // Pinned notes
  const notes = [
    { nx: 14, ny: 14, nw: 52, nh: 36, color: '#f0e8b0', pin: C.red,  label: '👟' },
    { nx: 72, ny: 12, nw: 48, nh: 40, color: '#b0d8f0', pin: C.blue, label: '☕' },
    { nx: 128, ny: 14, nw: 52, nh: 34, color: '#c8f0c8', pin: C.green, label: '⚡' },
    { nx: 16, ny: 58, nw: 56, nh: 40, color: '#f0d0d0', pin: C.gold,  label: '🖥️' },
    { nx: 80, ny: 60, nw: 48, nh: 38, color: C.paper,   pin: C.red,   label: '🤖' },
    { nx: 136, ny: 56, nw: 48, nh: 42, color: '#d8c8f0', pin: C.blue,  label: '🎮' },
  ];
  for (const n of notes) {
    rect(x + n.nx, y + n.ny, n.nw, n.nh, n.color);
    // Pin
    rect(x + n.nx + n.nw / 2 - 4, y + n.ny - 3, 8, 8, n.pin);
    // "text" lines
    for (let i = 0; i < 3; i++) {
      rect(x + n.nx + 5, y + n.ny + 12 + i * 7, n.nw - 10 - i * 8, 2, 'rgba(0,0,0,0.12)');
    }
  }
}

function drawBookshelf(obj) {
  const x = obj.x, by = obj.y;
  const shelfH = 200;
  // Frame
  rect(x, by - shelfH, 110, shelfH, C.wood);
  rect(x + 3, by - shelfH + 3, 104, shelfH - 6, C.woodDk);
  // Shelves
  const count = 4;
  const slotH = shelfH / count;
  const bookColors = [C.red, C.blue, C.green, C.gold, C.purple, '#d88060', '#60d0d0', C.screen];
  for (let s = 0; s < count; s++) {
    const sy = by - shelfH + s * slotH;
    // Shelf board
    rect(x + 3, sy + slotH - 4, 104, 5, C.woodLt);
    // Books
    let bx = x + 8;
    for (let b = 0; b < 5 + (s % 2); b++) {
      const bw = 8 + ((b * 7 + s * 13) % 7);
      const bh = 34 + ((b * 3 + s * 5) % 10);
      const color = bookColors[(b + s * 3) % bookColors.length];
      rect(bx, sy + slotH - 5 - bh, bw, bh, color);
      rect(bx + 2, sy + slotH - 5 - bh + 5, bw - 4, 3, 'rgba(255,255,255,0.2)');
      bx += bw + 3;
      if (bx > x + 98) break;
    }
  }
  border(x, by - shelfH, 110, shelfH, C.woodLt, 2);
}

function drawServer(obj) {
  const x = obj.x, by = obj.y;
  const rackH = 170;
  // Rack frame
  rect(x, by - rackH, 90, rackH, '#4a4a5a');
  border(x, by - rackH, 90, rackH, C.grayDk, 2);
  // Units
  for (let i = 0; i < 5; i++) {
    const uy = by - rackH + 6 + i * 32;
    rect(x + 8, uy, 74, 26, '#323244');
    // Blinking lights
    const t = Date.now() / 400;
    rect(x + 14, uy + 8, 6, 6, Math.sin(t + i * 1.7) > 0 ? '#5af05a' : '#1a4a1a');
    rect(x + 24, uy + 8, 6, 6, Math.sin(t + i * 2.3) > 0.3 ? C.gold : '#4a4a32');
    rect(x + 34, uy + 8, 6, 6, Math.sin(t + i * 0.9) > 0.5 ? C.screen : '#1a3a4a');
    // Vent lines
    for (let v = 0; v < 3; v++) {
      rect(x + 50 + v * 10, uy + 6, 6, 16, '#4a4a5a');
    }
  }
}

function drawWhiteboard(obj) {
  const x = obj.x, y = obj.y;
  // Frame
  rect(x, y, 180, 110, C.gray);
  // White surface
  rect(x + 6, y + 6, 168, 88, C.white);
  // Marker tray
  rect(x + 12, y + 98, 156, 8, C.grayDk);
  rect(x + 20, y + 96, 24, 5, C.red);
  rect(x + 52, y + 96, 24, 5, C.blue);
  rect(x + 84, y + 96, 24, 5, '#2a2a2a');
  // Diagram on board
  rect(x + 18, y + 18, 38, 20, 'rgba(100,140,220,0.25)');
  border(x + 18, y + 18, 38, 20, C.blue, 1);
  rect(x + 72, y + 18, 38, 20, 'rgba(100,140,220,0.25)');
  border(x + 72, y + 18, 38, 20, C.blue, 1);
  rect(x + 126, y + 18, 38, 20, 'rgba(100,140,220,0.25)');
  border(x + 126, y + 18, 38, 20, C.blue, 1);
  // Arrows
  rect(x + 56, y + 26, 16, 4, C.blue);
  rect(x + 110, y + 26, 16, 4, C.blue);
  // Labels
  rect(x + 20, y + 48, 50, 3, 'rgba(220,100,100,0.4)');
  rect(x + 20, y + 56, 38, 3, 'rgba(220,100,100,0.4)');
  rect(x + 20, y + 64, 62, 3, 'rgba(220,100,100,0.4)');
  rect(x + 20, y + 72, 28, 3, 'rgba(220,100,100,0.4)');
  // Link hints
  rect(x + 100, y + 50, 46, 14, 'rgba(100,140,220,0.15)');
  rect(x + 100, y + 70, 46, 14, 'rgba(100,140,220,0.15)');
}

function drawCouch(obj) {
  const x = obj.x, by = obj.y;
  // Shadow
  rect(x + 8, by - 2, 170, 8, C.shadow);
  // Base/seat
  rect(x, by - 48, 170, 32, C.purpleDk);
  // Back
  rect(x + 6, by - 78, 158, 34, C.purple);
  rect(x + 10, by - 74, 150, 26, '#8a7aaa');
  // Arms
  rect(x - 6, by - 66, 16, 54, C.purpleDk);
  rect(x + 160, by - 66, 16, 54, C.purpleDk);
  // Cushion lines
  rect(x + 56, by - 46, 3, 28, C.purpleDk);
  rect(x + 113, by - 46, 3, 28, C.purpleDk);
  // Pillow
  rect(x + 18, by - 56, 30, 22, C.gold);
  rect(x + 20, by - 53, 26, 5, '#d0c068');
  // Legs
  rect(x + 10, by - 16, 8, 16, C.grayDk);
  rect(x + 152, by - 16, 8, 16, C.grayDk);
}

// ── Draw player (side view, bigger) ───────────────────────
function drawPlayer() {
  const px = Math.round(player.x - camX);
  const by = Math.round(player.y);
  const d = player.dir;
  const bounce = player.moving ? Math.sin(player.frameTick * 0.3) * 3 : 0;
  const legSwing = player.moving ? Math.sin(player.frameTick * 0.35) * 8 : 0;

  // Shadow
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(px + 14, by + 3, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  rectAbs(px + 3, by - 18 + legSwing * 0.5, 8, 18, C.pants);
  rectAbs(px + 17, by - 18 - legSwing * 0.5, 8, 18, C.pants);
  // Shoes (sneakers!)
  rectAbs(px + 1, by - 3 + legSwing * 0.5, 10, 6, C.white);
  rectAbs(px + 17, by - 3 - legSwing * 0.5, 10, 6, C.white);
  // Shoe accent
  rectAbs(px + 1, by + 1 + legSwing * 0.5, 10, 3, C.red);
  rectAbs(px + 17, by + 1 - legSwing * 0.5, 10, 3, C.blue);

  // Body / shirt
  rectAbs(px + 1, by - 38 - bounce, 26, 22, C.shirt);
  // Shirt collar
  rectAbs(px + 8, by - 40 - bounce, 12, 4, '#4a78d0');
  // Shirt detail
  rectAbs(px + 11, by - 36 - bounce, 6, 16, '#4a78d0');

  // Arms
  const armSwing = player.moving ? Math.sin(player.frameTick * 0.35) * 5 : 0;
  if (d === 1) {
    rectAbs(px + 24, by - 36 - bounce + armSwing, 6, 16, C.shirt);
    rectAbs(px + 24, by - 22 - bounce + armSwing, 6, 6, C.skin);
  } else {
    rectAbs(px - 2, by - 36 - bounce + armSwing, 6, 16, C.shirt);
    rectAbs(px - 2, by - 22 - bounce + armSwing, 6, 6, C.skin);
  }

  // Head
  rectAbs(px + 2, by - 58 - bounce, 24, 22, C.skin);
  // Hair
  rectAbs(px, by - 62 - bounce, 28, 10, C.hair);
  if (d === 1) {
    rectAbs(px, by - 58 - bounce, 6, 16, C.hair);
  } else {
    rectAbs(px + 22, by - 58 - bounce, 6, 16, C.hair);
  }
  // Eyes
  if (d === 1) {
    rectAbs(px + 17, by - 52 - bounce, 5, 5, '#2a2a42');
    // Eye highlight
    rectAbs(px + 19, by - 52 - bounce, 2, 2, '#4a4a6a');
  } else {
    rectAbs(px + 6, by - 52 - bounce, 5, 5, '#2a2a42');
    rectAbs(px + 7, by - 52 - bounce, 2, 2, '#4a4a6a');
  }
  // Mouth
  rectAbs(px + (d === 1 ? 16 : 7), by - 43 - bounce, 5, 3, '#d0a888');
}

// ── Interaction prompts ────────────────────────────────────
function drawPrompts() {
  if (dialogOpen) return;
  const ppx = player.x + player.w / 2;
  for (const obj of objects) {
    const ox = obj.x + obj.w / 2;
    const dist = Math.abs(ppx - ox);
    if (dist < 80) {
      // In range — show E prompt
      const bob = Math.sin(Date.now() / 400) * 4;
      const sx = ox - camX;
      const sy = (obj.type === 'board' || obj.type === 'whiteboard') ? obj.y - 20 : obj.y - obj.h - 24;
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] ' + obj.label, sx, sy + bob);
      // Glow
      ctx.fillStyle = 'rgba(240, 216, 120, 0.1)';
      ctx.beginPath();
      ctx.arc(sx, sy + 40, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = 'left';
    } else if (dist < 200) {
      // Nearby sparkle
      const sparkle = Math.sin(Date.now() / 300 + obj.x) > 0.7;
      if (sparkle) {
        const sx = ox - camX;
        const sy = (obj.type === 'board' || obj.type === 'whiteboard') ? obj.y + obj.h / 2 : obj.y - obj.h / 2;
        ctx.fillStyle = 'rgba(240, 216, 120, 0.6)';
        ctx.fillRect(sx - 3, sy - 3, 6, 6);
        ctx.fillRect(sx + 10, sy - 10, 4, 4);
      }
    }
  }
}

// ── Interaction ────────────────────────────────────────────
function tryInteract() {
  const ppx = player.x + player.w / 2;
  let closest = null, closestDist = Infinity;
  for (const obj of objects) {
    const ox = obj.x + obj.w / 2;
    const dist = Math.abs(ppx - ox);
    if (dist < 80 && dist < closestDist) {
      closest = obj;
      closestDist = dist;
    }
  }
  if (closest) openDialog(closest.title, closest.body);
}

// ── Update ─────────────────────────────────────────────────
function update() {
  if (dialogOpen) return;

  let dx = 0;
  if (keys['a'] || keys['arrowleft'])  { dx = -1; player.dir = -1; }
  if (keys['d'] || keys['arrowright']) { dx = 1; player.dir = 1; }

  player.moving = dx !== 0;
  player.x += dx * PLAYER_SPEED;

  // Clamp to world
  if (player.x < 40) player.x = 40;
  if (player.x > WORLD_W - 40) player.x = WORLD_W - 40;

  // Animation tick
  if (player.moving) {
    player.frameTick++;
  } else {
    player.frameTick = 0;
  }

  // Camera follows player (smooth)
  const targetCam = player.x - W / 2 + player.w / 2;
  camX += (targetCam - camX) * 0.08;
  if (camX < 0) camX = 0;
  if (camX > WORLD_W - W) camX = WORLD_W - W;
}

// ── Ceiling lights ─────────────────────────────────────────
function drawLights() {
  for (let lx = 250; lx < WORLD_W; lx += 400) {
    const sx = lx - camX;
    // Fixture
    rectAbs(sx - 10, 8, 20, 8, C.grayDk);
    rectAbs(sx - 3, 16, 6, 10, C.grayDk);
    rectAbs(sx - 16, 24, 32, 5, C.grayLt);
    // Light glow
    const grad = ctx.createRadialGradient(sx, 29, 6, sx, 29, 220);
    grad.addColorStop(0, 'rgba(255,250,220,0.09)');
    grad.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 220, 29, 440, FLOOR_Y - 29);
  }
}

// ── Draw everything sorted by depth ───────────────────────
function drawScene() {
  // Windows (behind everything)
  for (const d of decorations) {
    if (d.type === 'window') drawWindow(d.x);
  }

  drawLights();

  // Wall-mounted objects
  for (const obj of objects) {
    if (obj.type === 'board') drawNoticeBoard(obj);
    if (obj.type === 'whiteboard') drawWhiteboard(obj);
  }

  // Tall furniture (behind player)
  for (const obj of objects) {
    if (obj.type === 'bookshelf') drawBookshelf(obj);
    if (obj.type === 'server') drawServer(obj);
  }

  // Other furniture
  for (const obj of objects) {
    if (obj.type === 'desk') drawDesk(obj);
    if (obj.type === 'coffee') drawCoffeeMachine(obj);
    if (obj.type === 'couch') drawCouch(obj);
  }

  // Plants
  for (const d of decorations) {
    if (d.type === 'plant') drawPlant(d.x);
  }

  // Player
  drawPlayer();

  // Prompts on top
  drawPrompts();
}

// ── Welcome ────────────────────────────────────────────────
setTimeout(() => {
  openDialog('👋 Welcome!', `Welcome to <b>Yannick's Office</b>!

Walk around and interact with the objects
to learn more about me.

<b>Controls:</b>
  A / D  or  ← / →  to walk
  E  to interact with glowing objects

<i>Tip: Look for the golden sparkles!</i>`);
}, 400);

// ── Game loop ──────────────────────────────────────────────
function gameLoop() {
  update();
  ctx.clearRect(0, 0, W, H);
  drawRoom();
  drawScene();
  requestAnimationFrame(gameLoop);
}

gameLoop();

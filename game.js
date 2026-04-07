// ═══════════════════════════════════════════════════════════
//  Yannick's Office — Side-scrolling pixel art portfolio
// ═══════════════════════════════════════════════════════════

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ── Dimensions ─────────────────────────────────────────────
const W = 800;
const H = 450;
canvas.width = W;
canvas.height = H;

const FLOOR_Y = 340;       // where the floor starts
const GRAVITY = 0.5;
const WORLD_W = 1800;      // total scrollable width
const PLAYER_SPEED = 2.8;

// ── Palette ────────────────────────────────────────────────
const C = {
  bg:         '#1a1a2e',
  wall:       '#2e2e4a',
  wallLine:   '#3a3a5c',
  floor:      '#3d3d5c',
  floorLine:  '#4a4a6a',
  ceiling:    '#252540',
  wood:       '#5c4a32',
  woodDk:     '#4a3a28',
  woodLt:     '#6e5a3e',
  gold:       '#e0c872',
  screen:     '#72b8e0',
  screenDk:   '#4a8ab0',
  white:      '#e8e8e8',
  paper:      '#d4d4c8',
  red:        '#c85a5a',
  blue:       '#5a7ac8',
  green:      '#4ac87a',
  coffee:     '#6e4a2a',
  coffeeMach: '#555570',
  skin:       '#e8c8a0',
  hair:       '#4a3a2a',
  shirt:      '#4a7ac8',
  pants:      '#3a3a5c',
  shadow:     'rgba(0,0,0,0.18)',
  plant:      '#2d6e3f',
  plantDk:    '#1e5a30',
  pot:        '#8a6a4a',
  purple:     '#6a5a8a',
  purpleDk:   '#4a3a6a',
  cork:       '#8a7a5a',
  corkDk:     '#7a6a4a',
  gray:       '#6a6a8a',
  grayDk:     '#4a4a6a',
  grayLt:     '#8a8aaa',
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

// ── Player ─────────────────────────────────────────────────
const player = {
  x: 200, y: FLOOR_Y,
  w: 16, h: 32,
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
    x: 160, y: FLOOR_Y, w: 90, h: 110,
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
    x: 400, y: FLOOR_Y, w: 160, h: 90,
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
    x: 680, y: 100, w: 160, h: 100,
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
    x: 950, y: FLOOR_Y, w: 80, h: 160,
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
    x: 1140, y: FLOOR_Y, w: 70, h: 130,
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
    x: 1330, y: 110, w: 140, h: 90,
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
    x: 1560, y: FLOOR_Y, w: 130, h: 70,
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
  { x: 70,   type: 'plant' },
  { x: 620,  type: 'plant' },
  { x: 1080, type: 'plant' },
  { x: 1500, type: 'plant' },
  { x: 340,  type: 'window' },
  { x: 1100, type: 'window' },
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
  for (let wx = -camX % 64; wx < W; wx += 64) {
    rectAbs(wx, 0, 2, FLOOR_Y, C.wallLine);
  }
  // Baseboard
  rectAbs(0, FLOOR_Y - 6, W, 6, C.woodDk);
  rectAbs(0, FLOOR_Y - 6, W, 2, C.woodLt);
  // Ceiling trim
  rectAbs(0, 0, W, 4, C.ceiling);
  rectAbs(0, 4, W, 2, C.wallLine);

  // Floor
  rectAbs(0, FLOOR_Y, W, H - FLOOR_Y, C.floor);
  // Floor tile lines
  for (let fx = -camX % 48; fx < W; fx += 48) {
    rectAbs(fx, FLOOR_Y, 1, H - FLOOR_Y, C.floorLine);
  }
  // Floor highlight
  rectAbs(0, FLOOR_Y, W, 2, C.floorLine);
}

// ── Draw decorations ───────────────────────────────────────
function drawWindow(x) {
  const sx = x - camX;
  // Frame
  rectAbs(sx, 80, 100, 120, C.grayDk);
  // Glass
  rectAbs(sx + 6, 86, 88, 108, '#3a5a7a');
  // Cross bars
  rectAbs(sx + 48, 86, 4, 108, C.gray);
  rectAbs(sx + 6, 136, 88, 4, C.gray);
  // Sky gradient in glass
  const grad = ctx.createLinearGradient(0, 86, 0, 194);
  grad.addColorStop(0, 'rgba(100,160,220,0.3)');
  grad.addColorStop(1, 'rgba(60,100,160,0.1)');
  ctx.fillStyle = grad;
  ctx.fillRect(sx + 6, 86, 88, 108);
  // Light beam
  ctx.fillStyle = 'rgba(255,245,200,0.04)';
  ctx.beginPath();
  ctx.moveTo(sx + 10, 194);
  ctx.lineTo(sx + 90, 194);
  ctx.lineTo(sx + 120, FLOOR_Y + 80);
  ctx.lineTo(sx - 20, FLOOR_Y + 80);
  ctx.fill();
  // Sill
  rectAbs(sx - 4, 198, 108, 6, C.gray);
}

function drawPlant(x) {
  const sx = x - camX;
  const by = FLOOR_Y;
  // Pot
  rectAbs(sx, by - 30, 30, 30, C.pot);
  rectAbs(sx - 3, by - 32, 36, 6, C.pot);
  rectAbs(sx + 2, by - 32, 26, 3, C.woodDk);
  // Leaves
  const leaves = [[8,-36],[18,-40],[4,-48],[22,-44],[12,-54],[0,-42],[26,-38]];
  for (const [lx, ly] of leaves) {
    rectAbs(sx + lx, by + ly, 10, 8, C.plant);
    rectAbs(sx + lx + 2, by + ly + 2, 6, 4, C.plantDk);
  }
  // Stem
  rectAbs(sx + 13, by - 44, 3, 14, C.plantDk);
}

// ── Draw furniture ─────────────────────────────────────────
function drawCoffeeMachine(obj) {
  const x = obj.x, by = obj.y;
  // Table
  rect(x, by - 40, 90, 8, C.wood);
  rect(x, by - 36, 90, 4, C.woodDk);
  // Table legs
  rect(x + 6, by - 32, 6, 32, C.woodDk);
  rect(x + 78, by - 32, 6, 32, C.woodDk);
  // Machine body
  rect(x + 20, by - 90, 50, 50, C.coffeeMach);
  rect(x + 20, by - 90, 50, 6, C.grayLt);
  rect(x + 20, by - 44, 50, 4, C.grayDk);
  // Display
  rect(x + 28, by - 80, 20, 10, '#1a2a1a');
  rect(x + 30, by - 78, 16, 6, '#2a5a2a');
  // Buttons
  rect(x + 52, by - 78, 8, 8, C.red);
  rect(x + 52, by - 66, 8, 8, C.green);
  // Drip nozzle
  rect(x + 38, by - 46, 14, 6, C.grayDk);
  // Cup
  rect(x + 35, by - 50, 10, 10, C.white);
  rect(x + 36, by - 49, 8, 4, C.coffee);
  // Steam
  const t = Date.now() / 500;
  for (let i = 0; i < 3; i++) {
    const sx = x + 38 + Math.sin(t + i * 1.8) * 4;
    const sy = by - 54 - i * 8;
    ctx.fillStyle = `rgba(200,200,220,${0.35 - i * 0.1})`;
    ctx.fillRect(Math.round(sx - camX), Math.round(sy), 4, 4);
  }
}

function drawDesk(obj) {
  const x = obj.x, by = obj.y;
  // Desk surface
  rect(x, by - 34, 160, 8, C.wood);
  rect(x, by - 28, 160, 4, C.woodDk);
  // Legs
  rect(x + 8, by - 24, 6, 24, C.woodDk);
  rect(x + 146, by - 24, 6, 24, C.woodDk);
  // Drawer
  rect(x + 120, by - 24, 34, 18, C.wood);
  rect(x + 132, by - 16, 10, 2, C.gold);
  // Chair
  rect(x + 60, by - 20, 40, 6, C.purpleDk);
  rect(x + 64, by - 14, 4, 14, C.grayDk);
  rect(x + 92, by - 14, 4, 14, C.grayDk);
  rect(x + 58, by - 44, 44, 26, C.purple);
  rect(x + 60, by - 42, 40, 22, '#7a6a9a');
  // Monitor
  rect(x + 36, by - 72, 50, 34, '#222238');
  rect(x + 40, by - 68, 42, 26, C.screen);
  // Code on screen
  const lines = [14, 28, 20, 10, 24, 18];
  for (let i = 0; i < lines.length; i++) {
    rect(x + 44, by - 64 + i * 4, lines[i], 2, '#4a9ac8');
    if (i % 2 === 0) rect(x + 44 + lines[i] + 2, by - 64 + i * 4, 8, 2, '#9ac84a');
  }
  // Monitor stand
  rect(x + 54, by - 38, 14, 4, '#222238');
  rect(x + 50, by - 36, 22, 3, '#333348');
  // MacBook (closed) next to monitor
  rect(x + 100, by - 40, 30, 3, C.grayDk);
  rect(x + 102, by - 42, 26, 3, C.gray);
  // Coffee mug
  rect(x + 14, by - 44, 12, 10, C.white);
  rect(x + 15, by - 43, 10, 4, C.coffee);
  // Small plant
  rect(x + 140, by - 46, 14, 12, C.pot);
  rect(x + 141, by - 52, 12, 8, C.plant);
}

function drawNoticeBoard(obj) {
  const x = obj.x, y = obj.y;
  // Board frame
  rect(x, y, 160, 100, C.wood);
  // Cork
  rect(x + 6, y + 6, 148, 88, C.corkDk);
  rect(x + 8, y + 8, 144, 84, C.cork);
  // Pinned notes
  const notes = [
    { nx: 12, ny: 12, nw: 40, nh: 30, color: '#e8e0a0', pin: C.red,  label: '👟' },
    { nx: 58, ny: 10, nw: 36, nh: 34, color: '#a0c8e8', pin: C.blue, label: '☕' },
    { nx: 100, ny: 12, nw: 42, nh: 28, color: '#c0e8c0', pin: C.green, label: '⚡' },
    { nx: 14, ny: 48, nw: 44, nh: 32, color: '#e8c0c0', pin: C.gold,  label: '🖥️' },
    { nx: 64, ny: 50, nw: 38, nh: 30, color: C.paper,   pin: C.red,   label: '🤖' },
    { nx: 108, ny: 46, nw: 36, nh: 34, color: '#d0c0e8', pin: C.blue,  label: '🎮' },
  ];
  for (const n of notes) {
    rect(x + n.nx, y + n.ny, n.nw, n.nh, n.color);
    // Pin
    rect(x + n.nx + n.nw / 2 - 3, y + n.ny - 2, 6, 6, n.pin);
    // "text" lines
    for (let i = 0; i < 3; i++) {
      rect(x + n.nx + 4, y + n.ny + 10 + i * 6, n.nw - 8 - i * 6, 2, 'rgba(0,0,0,0.12)');
    }
  }
}

function drawBookshelf(obj) {
  const x = obj.x, by = obj.y;
  // Frame
  rect(x, by - 160, 80, 160, C.wood);
  rect(x + 2, by - 158, 76, 156, C.woodDk);
  // Shelves
  const shelfY = [by - 158, by - 118, by - 78, by - 38];
  const bookColors = [C.red, C.blue, C.green, C.gold, C.purple, '#c8725a', '#5ac8c8', C.screen];
  for (let s = 0; s < 4; s++) {
    const sy = shelfY[s];
    // Shelf board
    rect(x + 2, sy + 36, 76, 4, C.woodLt);
    // Books
    let bx = x + 6;
    for (let b = 0; b < 5 + (s % 2); b++) {
      const bw = 6 + ((b * 7 + s * 13) % 6);
      const bh = 28 + ((b * 3 + s * 5) % 8);
      const color = bookColors[(b + s * 3) % bookColors.length];
      rect(bx, sy + 36 - bh, bw, bh, color);
      // Spine detail
      rect(bx + 1, sy + 36 - bh + 4, bw - 2, 2, 'rgba(255,255,255,0.2)');
      bx += bw + 2;
      if (bx > x + 72) break;
    }
  }
  border(x, by - 160, 80, 160, C.woodLt, 2);
}

function drawServer(obj) {
  const x = obj.x, by = obj.y;
  // Rack frame
  rect(x, by - 130, 70, 130, '#3a3a4a');
  border(x, by - 130, 70, 130, C.grayDk, 2);
  // Units
  for (let i = 0; i < 5; i++) {
    const uy = by - 124 + i * 24;
    rect(x + 6, uy, 58, 20, '#2a2a3a');
    // Blinking lights
    const t = Date.now() / 400;
    rect(x + 10, uy + 6, 5, 5, Math.sin(t + i * 1.7) > 0 ? '#4ae84a' : '#1a3a1a');
    rect(x + 18, uy + 6, 5, 5, Math.sin(t + i * 2.3) > 0.3 ? C.gold : '#3a3a2a');
    rect(x + 26, uy + 6, 5, 5, Math.sin(t + i * 0.9) > 0.5 ? C.screen : '#1a2a3a');
    // Vent lines
    for (let v = 0; v < 3; v++) {
      rect(x + 38 + v * 8, uy + 4, 5, 12, '#3a3a4a');
    }
  }
}

function drawWhiteboard(obj) {
  const x = obj.x, y = obj.y;
  // Frame
  rect(x, y, 140, 90, C.gray);
  // White surface
  rect(x + 5, y + 5, 130, 72, C.white);
  // Marker tray
  rect(x + 10, y + 80, 120, 6, C.grayDk);
  rect(x + 16, y + 78, 20, 4, C.red);
  rect(x + 42, y + 78, 20, 4, C.blue);
  rect(x + 68, y + 78, 20, 4, '#2a2a2a');
  // Diagram on board
  rect(x + 14, y + 14, 30, 16, 'rgba(90,122,200,0.25)');
  border(x + 14, y + 14, 30, 16, C.blue, 1);
  rect(x + 56, y + 14, 30, 16, 'rgba(90,122,200,0.25)');
  border(x + 56, y + 14, 30, 16, C.blue, 1);
  rect(x + 98, y + 14, 30, 16, 'rgba(90,122,200,0.25)');
  border(x + 98, y + 14, 30, 16, C.blue, 1);
  // Arrows
  rect(x + 44, y + 20, 12, 3, C.blue);
  rect(x + 86, y + 20, 12, 3, C.blue);
  // Labels
  rect(x + 16, y + 40, 40, 2, 'rgba(200,90,90,0.4)');
  rect(x + 16, y + 46, 30, 2, 'rgba(200,90,90,0.4)');
  rect(x + 16, y + 52, 50, 2, 'rgba(200,90,90,0.4)');
  rect(x + 16, y + 58, 20, 2, 'rgba(200,90,90,0.4)');
  // "GitHub" / "LinkedIn" labels hinted
  rect(x + 80, y + 42, 36, 12, 'rgba(90,122,200,0.15)');
  rect(x + 80, y + 58, 36, 12, 'rgba(90,122,200,0.15)');
}

function drawCouch(obj) {
  const x = obj.x, by = obj.y;
  // Shadow
  rect(x + 6, by - 2, 130, 6, C.shadow);
  // Base/seat
  rect(x, by - 36, 130, 24, C.purpleDk);
  // Back
  rect(x + 4, by - 60, 122, 28, C.purple);
  rect(x + 8, by - 56, 114, 20, '#7a6a9a');
  // Arms
  rect(x - 4, by - 50, 12, 40, C.purpleDk);
  rect(x + 122, by - 50, 12, 40, C.purpleDk);
  // Cushion lines
  rect(x + 42, by - 34, 2, 20, C.purpleDk);
  rect(x + 86, by - 34, 2, 20, C.purpleDk);
  // Pillow
  rect(x + 14, by - 42, 22, 16, C.gold);
  rect(x + 16, by - 40, 18, 4, '#c8b060');
  // Legs
  rect(x + 8, by - 12, 6, 12, C.grayDk);
  rect(x + 116, by - 12, 6, 12, C.grayDk);
}

// ── Draw player (side view) ───────────────────────────────
function drawPlayer() {
  const x = Math.round(player.x - camX);
  const by = Math.round(player.y);
  const d = player.dir;
  const bounce = player.moving ? Math.sin(player.frameTick * 0.3) * 2 : 0;
  const legSwing = player.moving ? Math.sin(player.frameTick * 0.35) * 6 : 0;

  // Shadow
  ctx.fillStyle = C.shadow;
  ctx.beginPath();
  ctx.ellipse(x + 8, by + 2, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  rectAbs(x + 2, by - 12 + legSwing * 0.5, 5, 12, C.pants);
  rectAbs(x + 9, by - 12 - legSwing * 0.5, 5, 12, C.pants);
  // Shoes
  rectAbs(x + 1, by - 2 + legSwing * 0.5, 6, 4, C.white);
  rectAbs(x + 9, by - 2 - legSwing * 0.5, 6, 4, C.white);
  // Shoe accent (sneakers!)
  rectAbs(x + 1, by + legSwing * 0.5, 6, 2, C.red);
  rectAbs(x + 9, by - legSwing * 0.5, 6, 2, C.blue);

  // Body / shirt
  rectAbs(x + 1, by - 24 - bounce, 14, 14, C.shirt);
  // Shirt detail
  rectAbs(x + 6, by - 22 - bounce, 4, 10, '#3a6ab8');

  // Arm
  const armSwing = player.moving ? Math.sin(player.frameTick * 0.35) * 4 : 0;
  if (d === 1) {
    rectAbs(x + 13, by - 22 - bounce + armSwing, 4, 10, C.shirt);
    rectAbs(x + 13, by - 14 - bounce + armSwing, 4, 4, C.skin);
  } else {
    rectAbs(x - 1, by - 22 - bounce + armSwing, 4, 10, C.shirt);
    rectAbs(x - 1, by - 14 - bounce + armSwing, 4, 4, C.skin);
  }

  // Head
  rectAbs(x + 1, by - 38 - bounce, 14, 14, C.skin);
  // Hair
  rectAbs(x, by - 40 - bounce, 16, 6, C.hair);
  if (d === 1) {
    rectAbs(x, by - 38 - bounce, 4, 10, C.hair);
  } else {
    rectAbs(x + 12, by - 38 - bounce, 4, 10, C.hair);
  }
  // Eye
  if (d === 1) {
    rectAbs(x + 10, by - 34 - bounce, 3, 3, '#2a2a3a');
  } else {
    rectAbs(x + 3, by - 34 - bounce, 3, 3, '#2a2a3a');
  }
  // Mouth
  rectAbs(x + (d === 1 ? 9 : 4), by - 29 - bounce, 3, 2, '#c8a080');
}

// ── Interaction prompts ────────────────────────────────────
function drawPrompts() {
  if (dialogOpen) return;
  const px = player.x + player.w / 2;
  for (const obj of objects) {
    const ox = obj.x + obj.w / 2;
    const dist = Math.abs(px - ox);
    if (dist < 60) {
      // In range — show E prompt
      const bob = Math.sin(Date.now() / 400) * 3;
      const sx = ox - camX;
      const sy = (obj.type === 'board' || obj.type === 'whiteboard') ? obj.y - 16 : obj.y - obj.h - 20;
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[E] ' + obj.label, sx, sy + bob);
      // Glow
      ctx.fillStyle = 'rgba(224, 200, 114, 0.08)';
      ctx.beginPath();
      ctx.arc(sx, sy + 30, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.textAlign = 'left';
    } else if (dist < 150) {
      // Nearby sparkle
      const sparkle = Math.sin(Date.now() / 300 + obj.x) > 0.7;
      if (sparkle) {
        const sx = ox - camX;
        const sy = (obj.type === 'board' || obj.type === 'whiteboard') ? obj.y + obj.h / 2 : obj.y - obj.h / 2;
        ctx.fillStyle = 'rgba(224, 200, 114, 0.5)';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
        ctx.fillRect(sx + 8, sy - 8, 3, 3);
      }
    }
  }
}

// ── Interaction ────────────────────────────────────────────
function tryInteract() {
  const px = player.x + player.w / 2;
  let closest = null, closestDist = Infinity;
  for (const obj of objects) {
    const ox = obj.x + obj.w / 2;
    const dist = Math.abs(px - ox);
    if (dist < 60 && dist < closestDist) {
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
  if (player.x < 30) player.x = 30;
  if (player.x > WORLD_W - 30) player.x = WORLD_W - 30;

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
  for (let lx = 200; lx < WORLD_W; lx += 350) {
    const sx = lx - camX;
    // Fixture
    rectAbs(sx - 8, 6, 16, 6, C.grayDk);
    rectAbs(sx - 2, 12, 4, 8, C.grayDk);
    rectAbs(sx - 12, 18, 24, 4, C.grayLt);
    // Light glow
    const grad = ctx.createRadialGradient(sx, 22, 4, sx, 22, 180);
    grad.addColorStop(0, 'rgba(255,245,210,0.07)');
    grad.addColorStop(1, 'rgba(255,245,210,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 180, 22, 360, FLOOR_Y - 22);
  }
}

// ── Draw everything sorted by depth ───────────────────────
function drawScene() {
  // Decorations behind player (windows first, then wall-mounted items)
  for (const d of decorations) {
    if (d.type === 'window') drawWindow(d.x);
  }

  drawLights();

  // Wall-mounted objects (boards, whiteboard) drawn on wall
  for (const obj of objects) {
    if (obj.type === 'board') drawNoticeBoard(obj);
    if (obj.type === 'whiteboard') drawWhiteboard(obj);
  }

  // Floor-level objects sorted by visual depth
  // Furniture behind player
  for (const obj of objects) {
    if (obj.type === 'bookshelf') drawBookshelf(obj);
    if (obj.type === 'server') drawServer(obj);
  }

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

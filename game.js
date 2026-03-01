const { Engine, Render, Runner, World, Bodies, Body, Mouse, MouseConstraint, Constraint, Events, Composite, Vector } = Matter;

let width = window.innerWidth;
let height = window.innerHeight;

const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#87CEEB'
    }
});

// ==========================================
// GAME STATE
// ==========================================
let score = 0;
let currentLevel = 1;
const totalLevels = 5;
let duck = null;
let elastic = null;
let duckQueue = [];
let allEnemies = [];
let allLevelBodies = [];
let levelComplete = false;
let duckInFlight = false;

const scoreBoard = document.getElementById('scoreBoard');

// ==========================================
// SVG ASSETS
// ==========================================

const svgSlingshotBack = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect x="88" y="180" width="24" height="130" rx="8" fill="#6D3A1F"/>
  <rect x="92" y="180" width="16" height="130" rx="6" fill="#8B4513"/>
  <path d="M60 80 Q40 40 70 20 Q90 10 100 50" stroke="#6D3A1F" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M60 80 Q40 40 70 20 Q90 10 100 50" stroke="#9E6835" stroke-width="14" fill="none" stroke-linecap="round"/>
  <circle cx="100" cy="50" r="12" fill="#6D3A1F"/>
  <circle cx="100" cy="50" r="8" fill="#9E6835"/>
</svg>`;

const svgSlingshotFront = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <path d="M140 80 Q160 40 130 20 Q110 10 100 50" stroke="#5A2E00" stroke-width="22" fill="none" stroke-linecap="round"/>
  <path d="M140 80 Q160 40 130 20 Q110 10 100 50" stroke="#724421" stroke-width="14" fill="none" stroke-linecap="round"/>
  <circle cx="100" cy="50" r="12" fill="#5A2E00"/>
  <circle cx="100" cy="50" r="8" fill="#724421"/>
</svg>`;

// DUCKS
const svgDuckStandard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="58" r="33" fill="#F5C518" stroke="#C8860A" stroke-width="2.5"/>
  <ellipse cx="50" cy="30" rx="22" ry="20" fill="#F5C518" stroke="#C8860A" stroke-width="2"/>
  <circle cx="60" cy="25" r="7" fill="white"/>
  <circle cx="62" cy="25" r="3.5" fill="#111"/>
  <circle cx="63" cy="24" r="1.2" fill="white"/>
  <path d="M66 32 Q74 30 72 39 Q66 37 66 32Z" fill="#FF8C00"/>
  <path d="M67 35 L73 34" stroke="#C06000" stroke-width="1" fill="none"/>
  <path d="M36 60 Q50 73 64 60" stroke="#C8860A" stroke-width="2" fill="none"/>
  <ellipse cx="40" cy="82" rx="12" ry="7" fill="#FF8C00"/>
  <ellipse cx="60" cy="82" rx="12" ry="7" fill="#FF8C00"/>
  <path d="M32 47 Q20 44 18 53 Q21 60 32 57Z" fill="#F5C518" stroke="#C8860A" stroke-width="1.5"/>
  <circle cx="44" cy="48" r="4" fill="#E8B000" opacity="0.4"/>
</svg>`;

const svgDuckHeavy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="60" r="38" fill="#2980B9" stroke="#1A5276" stroke-width="3"/>
  <ellipse cx="50" cy="26" rx="24" ry="21" fill="#2980B9" stroke="#1A5276" stroke-width="2"/>
  <circle cx="62" cy="22" r="7" fill="white"/>
  <circle cx="64" cy="22" r="3.5" fill="#111"/>
  <circle cx="65" cy="21" r="1.2" fill="white"/>
  <path d="M69 29 Q77 27 75 37 Q69 35 69 29Z" fill="#FF8C00"/>
  <path d="M34 62 Q50 77 66 62" stroke="#1A5276" stroke-width="2.5" fill="none"/>
  <ellipse cx="38" cy="87" rx="15" ry="9" fill="#E67E22"/>
  <ellipse cx="62" cy="87" rx="15" ry="9" fill="#E67E22"/>
  <circle cx="34" cy="52" r="6" fill="#5DADE2" opacity="0.5"/>
  <circle cx="64" cy="72" r="5" fill="#5DADE2" opacity="0.35"/>
  <text x="50" y="68" text-anchor="middle" font-size="20" font-weight="900" fill="white" opacity="0.25" font-family="Arial">B</text>
</svg>`;

const svgDuckSpeedy = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <ellipse cx="54" cy="56" rx="28" ry="26" fill="#E53935" stroke="#7B0000" stroke-width="2.5"/>
  <ellipse cx="56" cy="30" rx="18" ry="16" fill="#E53935" stroke="#7B0000" stroke-width="2"/>
  <path d="M46 15 L50 24 L43 24Z" fill="#FF5722"/>
  <path d="M52 13 L55 23 L49 23Z" fill="#FF5722"/>
  <path d="M57 15 L60 24 L53 24Z" fill="#FF5722"/>
  <circle cx="63" cy="27" r="6" fill="white"/>
  <circle cx="65" cy="27" r="3" fill="#111"/>
  <circle cx="66" cy="26" r="1" fill="white"/>
  <path d="M69 33 Q76 31 74 40 Q69 38 69 33Z" fill="#FF8C00"/>
  <path d="M28 52 Q12 48 10 55 Q13 63 26 59Z" fill="#E53935" stroke="#7B0000" stroke-width="1.5"/>
  <path d="M15 50 Q8 46 6 52 Q8 58 18 56Z" fill="#E53935" stroke="#7B0000" stroke-width="1"/>
  <path d="M36 58 Q54 72 66 58" stroke="#7B0000" stroke-width="2" fill="none"/>
  <ellipse cx="42" cy="78" rx="11" ry="6" fill="#FF8C00"/>
  <ellipse cx="60" cy="78" rx="11" ry="6" fill="#FF8C00"/>
</svg>`;

const svgDuckExplosive = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="58" r="34" fill="#1C1C1C" stroke="#444" stroke-width="2.5"/>
  <ellipse cx="50" cy="30" rx="20" ry="17" fill="#1C1C1C" stroke="#444" stroke-width="2"/>
  <path d="M47 12 Q51 5 55 12 Q59 4 63 13" stroke="#FF4500" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <circle cx="62" cy="13" r="5" fill="#FF6B00"/>
  <circle cx="62" cy="13" r="3" fill="#FFDD00" opacity="0.9"/>
  <circle cx="62" cy="25" r="6" fill="white"/>
  <circle cx="64" cy="25" r="3" fill="#111"/>
  <circle cx="65" cy="24" r="1" fill="white"/>
  <path d="M68 31 Q75 29 73 38 Q68 36 68 31Z" fill="#666"/>
  <path d="M34 60 Q50 73 64 60" stroke="#444" stroke-width="2" fill="none"/>
  <ellipse cx="39" cy="82" rx="12" ry="7" fill="#444"/>
  <ellipse cx="59" cy="82" rx="12" ry="7" fill="#444"/>
  <circle cx="32" cy="50" r="3" fill="#FF4500" opacity="0.5"/>
  <circle cx="40" cy="30" r="2" fill="#FF4500" opacity="0.3"/>
</svg>`;

const svgDuckEgg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <ellipse cx="50" cy="54" rx="27" ry="32" fill="#FFFDE7" stroke="#F0E030" stroke-width="2.5"/>
  <circle cx="58" cy="28" r="6" fill="white" stroke="#DDD" stroke-width="1"/>
  <circle cx="60" cy="28" r="3" fill="#111"/>
  <circle cx="61" cy="27" r="1" fill="white"/>
  <path d="M64 34 Q71 32 69 40 Q64 38 64 34Z" fill="#FFB300"/>
  <path d="M32 54 Q50 70 66 54" stroke="#E0D000" stroke-width="2" fill="none"/>
  <ellipse cx="40" cy="78" rx="10" ry="6" fill="#FFB300"/>
  <ellipse cx="58" cy="78" rx="10" ry="6" fill="#FFB300"/>
  <text x="50" y="58" text-anchor="middle" font-size="11" fill="#CCC" font-weight="bold" font-family="Arial">x3</text>
  <circle cx="30" cy="48" r="8" fill="#FFFDE7" stroke="#F0E030" stroke-width="1.5" opacity="0.7"/>
  <circle cx="70" cy="48" r="8" fill="#FFFDE7" stroke="#F0E030" stroke-width="1.5" opacity="0.7"/>
</svg>`;

// ENEMIES
const svgEnemyHen = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="60" r="32" fill="#C0392B" stroke="#7B241C" stroke-width="2.5"/>
  <ellipse cx="50" cy="28" rx="21" ry="19" fill="#C0392B" stroke="#7B241C" stroke-width="2"/>
  <path d="M41 14 Q45 6 50 14 Q55 6 59 16 Q63 9 64 19" stroke="#FF6B6B" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M41 14 Q46 11 50 14 Q55 11 64 19 Q59 19 55 15 Q50 18 45 14 Q42 16 41 14Z" fill="#E74C3C"/>
  <ellipse cx="41" cy="24" rx="4" ry="5" fill="#FF7070"/>
  <circle cx="61" cy="26" r="6" fill="white"/>
  <circle cx="63" cy="26" r="3" fill="#111"/>
  <circle cx="64" cy="25" r="1" fill="white"/>
  <path d="M68 33 Q76 31 74 40 Q68 38 68 33Z" fill="#FFB300"/>
  <path d="M34 62 Q50 76 66 62" stroke="#7B241C" stroke-width="2" fill="none"/>
  <ellipse cx="40" cy="84" rx="13" ry="8" fill="#E67E22"/>
  <ellipse cx="60" cy="84" rx="13" ry="8" fill="#E67E22"/>
</svg>`;

const svgEnemyChick = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="65" r="24" fill="#FFD54F" stroke="#F57F17" stroke-width="2"/>
  <ellipse cx="50" cy="36" rx="17" ry="15" fill="#FFD54F" stroke="#F57F17" stroke-width="2"/>
  <path d="M46 23 L50 15 L54 23Z" fill="#FFB300"/>
  <circle cx="57" cy="33" r="5" fill="white"/>
  <circle cx="58" cy="33" r="2.5" fill="#111"/>
  <circle cx="58.5" cy="32.5" r="0.8" fill="white"/>
  <path d="M62 37 Q68 35 66 43 Q62 41 62 37Z" fill="#FF8F00"/>
  <path d="M36 66 Q50 77 64 66" stroke="#F57F17" stroke-width="1.5" fill="none"/>
  <ellipse cx="41" cy="82" rx="9" ry="5" fill="#FF8F00"/>
  <ellipse cx="59" cy="82" rx="9" ry="5" fill="#FF8F00"/>
</svg>`;

const svgEnemyRooster = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="60" r="34" fill="#4A235A" stroke="#2C1540" stroke-width="2.5"/>
  <ellipse cx="50" cy="26" rx="22" ry="20" fill="#4A235A" stroke="#2C1540" stroke-width="2"/>
  <path d="M38 12 Q42 4 48 12 Q52 5 57 13 Q61 6 65 13 Q65 20 58 20 Q54 13 50 16 Q46 14 38 12Z" fill="#FF1744"/>
  <ellipse cx="37" cy="23" rx="5" ry="6" fill="#FF1744"/>
  <circle cx="63" cy="24" r="7" fill="white"/>
  <circle cx="65" cy="24" r="3.5" fill="#111"/>
  <circle cx="66" cy="23" r="1.2" fill="white"/>
  <path d="M71 31 Q79 29 77 39 Q71 37 71 31Z" fill="#FFB300"/>
  <path d="M32 62 Q50 77 68 62" stroke="#2C1540" stroke-width="2.5" fill="none"/>
  <ellipse cx="38" cy="87" rx="14" ry="8" fill="#E65100"/>
  <ellipse cx="62" cy="87" rx="14" ry="8" fill="#E65100"/>
  <path d="M28 52 Q16 48 14 57 Q18 65 30 61Z" fill="#4A235A" stroke="#2C1540" stroke-width="1.5"/>
</svg>`;

const svgEnemyKing = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="60" r="36" fill="#1A5276" stroke="#0D2B40" stroke-width="3"/>
  <ellipse cx="50" cy="25" rx="24" ry="22" fill="#1A5276" stroke="#0D2B40" stroke-width="2.5"/>
  <path d="M24 26 L33 38 L50 28 L67 38 L76 26 L70 10 L61 20 L50 14 L39 20 L30 10Z" fill="#F1C40F" stroke="#D4A00A" stroke-width="2"/>
  <circle cx="50" cy="14" r="5" fill="#E74C3C"/>
  <circle cx="30" cy="11" r="4" fill="#E74C3C"/>
  <circle cx="70" cy="11" r="4" fill="#E74C3C"/>
  <circle cx="65" cy="23" r="7" fill="white"/>
  <circle cx="67" cy="23" r="3.5" fill="#111"/>
  <circle cx="68" cy="22" r="1.2" fill="white"/>
  <path d="M73 30 Q81 28 79 39 Q73 37 73 30Z" fill="#FFB300"/>
  <path d="M30 62 Q50 78 70 62" stroke="#0D2B40" stroke-width="2.5" fill="none"/>
  <ellipse cx="36" cy="88" rx="15" ry="9" fill="#E65100"/>
  <ellipse cx="64" cy="88" rx="15" ry="9" fill="#E65100"/>
  <ellipse cx="33" cy="52" rx="7" ry="4" fill="#2980B9" opacity="0.6"/>
</svg>`;

const svgEnemyArmored = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="60" r="34" fill="#7F8C8D" stroke="#424949" stroke-width="3"/>
  <ellipse cx="50" cy="26" rx="22" ry="20" fill="#7F8C8D" stroke="#424949" stroke-width="2.5"/>
  <path d="M25 22 L50 12 L75 22 L72 38 L50 42 L28 38Z" fill="#95A5A6" stroke="#424949" stroke-width="2.5" opacity="0.9"/>
  <line x1="35" y1="24" x2="50" y2="14" stroke="#424949" stroke-width="2" opacity="0.7"/>
  <line x1="65" y1="24" x2="50" y2="14" stroke="#424949" stroke-width="2" opacity="0.7"/>
  <circle cx="63" cy="27" r="7" fill="white"/>
  <circle cx="65" cy="27" r="3.5" fill="#111"/>
  <circle cx="66" cy="26" r="1.2" fill="white"/>
  <path d="M71 34 Q79 32 77 42 Q71 40 71 34Z" fill="#FFB300"/>
  <path d="M30 63 Q50 78 70 63" stroke="#424949" stroke-width="2.5" fill="none"/>
  <ellipse cx="38" cy="88" rx="14" ry="8" fill="#E65100"/>
  <ellipse cx="62" cy="88" rx="14" ry="8" fill="#E65100"/>
  <path d="M20 50 L32 44 L32 68 L20 62Z" fill="#BDC3C7" stroke="#424949" stroke-width="1.5"/>
</svg>`;

// BLOCKS
const svgBlockWood = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#C8860A" stroke="#7B4A00" stroke-width="2.5"/>
  <rect x="4" y="4" width="52" height="52" rx="3" fill="#D4922C"/>
  <line x1="4" y1="14" x2="56" y2="14" stroke="#A0660A" stroke-width="1.5" opacity="0.7"/>
  <line x1="4" y1="26" x2="56" y2="26" stroke="#A0660A" stroke-width="1" opacity="0.4"/>
  <line x1="4" y1="38" x2="56" y2="38" stroke="#A0660A" stroke-width="1.5" opacity="0.7"/>
  <line x1="4" y1="50" x2="56" y2="50" stroke="#A0660A" stroke-width="1" opacity="0.4"/>
  <line x1="18" y1="4" x2="16" y2="56" stroke="#A0660A" stroke-width="1" opacity="0.4"/>
  <line x1="38" y1="4" x2="36" y2="56" stroke="#A0660A" stroke-width="1" opacity="0.4"/>
</svg>`;

const svgBlockStone = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#626567" stroke="#2C3E50" stroke-width="2.5"/>
  <rect x="4" y="4" width="52" height="52" rx="3" fill="#717D7E"/>
  <polygon points="8,8 28,4 28,22 8,26" fill="#839192" opacity="0.5"/>
  <polygon points="32,6 56,12 52,28 32,22" fill="#839192" opacity="0.4"/>
  <polygon points="6,34 24,30 26,50 6,54" fill="#839192" opacity="0.45"/>
  <polygon points="32,36 56,32 56,56 30,56" fill="#839192" opacity="0.5"/>
  <line x1="28" y1="4" x2="28" y2="22" stroke="#2C3E50" stroke-width="1" opacity="0.5"/>
  <line x1="4" y1="26" x2="56" y2="26" stroke="#2C3E50" stroke-width="1.5" opacity="0.6"/>
  <line x1="4" y1="48" x2="56" y2="48" stroke="#2C3E50" stroke-width="1.5" opacity="0.6"/>
</svg>`;

const svgBlockGlass = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <rect x="1" y="1" width="58" height="58" rx="5" fill="#AED6F1" stroke="#5DADE2" stroke-width="2.5" opacity="0.85"/>
  <rect x="5" y="5" width="50" height="50" rx="3" fill="#D6EAF8" opacity="0.5"/>
  <polygon points="6,6 28,6 18,20" fill="white" opacity="0.45"/>
  <polygon points="36,6 54,6 54,26" fill="white" opacity="0.3"/>
  <line x1="8" y1="54" x2="54" y2="8" stroke="white" stroke-width="2" opacity="0.3"/>
  <line x1="6" y1="36" x2="36" y2="6" stroke="white" stroke-width="1" opacity="0.2"/>
</svg>`;

const svgBlockMetal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <rect x="1" y="1" width="58" height="58" rx="4" fill="#566573" stroke="#1B2631" stroke-width="3"/>
  <rect x="4" y="4" width="52" height="52" rx="3" fill="#717D7E"/>
  <rect x="4" y="4" width="52" height="14" fill="#85929E" rx="2"/>
  <line x1="4" y1="18" x2="56" y2="18" stroke="#1B2631" stroke-width="2"/>
  <line x1="4" y1="36" x2="56" y2="36" stroke="#1B2631" stroke-width="2"/>
  <line x1="4" y1="54" x2="56" y2="54" stroke="#1B2631" stroke-width="2"/>
  <line x1="20" y1="4" x2="20" y2="56" stroke="#1B2631" stroke-width="2"/>
  <line x1="40" y1="4" x2="40" y2="56" stroke="#1B2631" stroke-width="2"/>
  <circle cx="20" cy="18" r="3.5" fill="#2C3E50" stroke="#111" stroke-width="1"/>
  <circle cx="40" cy="18" r="3.5" fill="#2C3E50" stroke="#111" stroke-width="1"/>
  <circle cx="20" cy="36" r="3.5" fill="#2C3E50" stroke="#111" stroke-width="1"/>
  <circle cx="40" cy="36" r="3.5" fill="#2C3E50" stroke="#111" stroke-width="1"/>
</svg>`;

const svgBlockTNT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <rect x="1" y="1" width="58" height="58" rx="6" fill="#8B1C0F" stroke="#4A0A00" stroke-width="3"/>
  <rect x="4" y="4" width="52" height="18" rx="3" fill="#E74C3C"/>
  <text x="30" y="18" text-anchor="middle" font-size="13" font-weight="900" fill="white" font-family="Arial Black,sans-serif">TNT</text>
  <rect x="4" y="24" width="52" height="32" rx="2" fill="#C0392B"/>
  <line x1="4" y1="34" x2="56" y2="34" stroke="#7B241C" stroke-width="1.5"/>
  <line x1="4" y1="46" x2="56" y2="46" stroke="#7B241C" stroke-width="1.5"/>
  <line x1="20" y1="24" x2="20" y2="56" stroke="#7B241C" stroke-width="1.5"/>
  <line x1="40" y1="24" x2="40" y2="56" stroke="#7B241C" stroke-width="1.5"/>
  <path d="M30 1 Q35 -5 32 -9 Q37 -3 40 1" stroke="#FFD700" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <circle cx="38" cy="-2" r="3" fill="#FF8C00" opacity="0.9"/>
</svg>`;

// ENV
const svgTree = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 160" width="80" height="160">
  <rect x="34" y="110" width="12" height="55" rx="4" fill="#5D4037"/>
  <rect x="30" y="125" width="20" height="10" fill="#4E342E"/>
  <circle cx="40" cy="80" r="42" fill="#2E7D32" stroke="#1B5E20" stroke-width="2"/>
  <circle cx="22" cy="96" r="29" fill="#388E3C"/>
  <circle cx="58" cy="96" r="29" fill="#388E3C"/>
  <circle cx="40" cy="48" r="26" fill="#43A047"/>
  <circle cx="28" cy="66" r="9" fill="#66BB6A" opacity="0.45"/>
  <circle cx="54" cy="58" r="7" fill="#66BB6A" opacity="0.4"/>
</svg>`;

const svgBush = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" width="120" height="70">
  <circle cx="22" cy="50" r="24" fill="#388E3C"/>
  <circle cx="60" cy="40" r="32" fill="#43A047"/>
  <circle cx="98" cy="50" r="24" fill="#388E3C"/>
  <circle cx="40" cy="45" r="22" fill="#4CAF50"/>
  <circle cx="80" cy="45" r="22" fill="#4CAF50"/>
  <circle cx="28" cy="38" r="8" fill="#66BB6A" opacity="0.5"/>
  <circle cx="68" cy="32" r="6" fill="#66BB6A" opacity="0.5"/>
</svg>`;

const svgHay = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 75" width="100" height="75">
  <ellipse cx="50" cy="42" rx="46" ry="33" fill="#D4A017" stroke="#A0720A" stroke-width="2.5"/>
  <ellipse cx="50" cy="42" rx="46" ry="33" fill="none" stroke="#C8860A" stroke-width="7" stroke-dasharray="10,7"/>
  <ellipse cx="50" cy="42" rx="34" ry="22" fill="#E8B820" stroke="#A0720A" stroke-width="1.5"/>
  <line x1="22" y1="24" x2="24" y2="60" stroke="#A0720A" stroke-width="1.5" opacity="0.5"/>
  <line x1="40" y1="16" x2="42" y2="66" stroke="#A0720A" stroke-width="1.5" opacity="0.5"/>
  <line x1="62" y1="16" x2="60" y2="66" stroke="#A0720A" stroke-width="1.5" opacity="0.5"/>
  <line x1="78" y1="24" x2="76" y2="60" stroke="#A0720A" stroke-width="1.5" opacity="0.5"/>
</svg>`;

// ==========================================
// TEXTURE HELPER
// ==========================================
function tex(svgStr, w, h) {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    return {
        texture: URL.createObjectURL(blob),
        xScale: w / 100,
        yScale: h / 100
    };
}

// ==========================================
// DUCK DEFINITIONS
// ==========================================
const DUCK_DEFS = {
    standard: { svg: svgDuckStandard, r: 23, color: '#F5C518', density: 0.004, restitution: 0.4, frictionAir: 0.006 },
    heavy:    { svg: svgDuckHeavy,    r: 30, color: '#2980B9', density: 0.014, restitution: 0.25, frictionAir: 0.002 },
    speedy:   { svg: svgDuckSpeedy,   r: 19, color: '#E53935', density: 0.003, restitution: 0.5, frictionAir: 0.001 },
    explosive:{ svg: svgDuckExplosive,r: 24, color: '#1C1C1C', density: 0.005, restitution: 0.3, frictionAir: 0.004 },
    egg:      { svg: svgDuckEgg,      r: 21, color: '#FFFDE7', density: 0.003, restitution: 0.6, frictionAir: 0.003 }
};

function makeDuck(type, x, y) {
    const d = DUCK_DEFS[type] || DUCK_DEFS.standard;
    const body = Bodies.circle(x, y, d.r, {
        restitution: d.restitution,
        density: d.density,
        frictionAir: d.frictionAir,
        label: 'duck',
        render: { sprite: tex(d.svg, d.r * 2.4, d.r * 2.4), fillStyle: d.color }
    });
    body.duckType = type;
    return body;
}

// ==========================================
// ENEMY DEFINITIONS
// ==========================================
const ENEMY_DEFS = {
    chick:   { svg: svgEnemyChick,   hp: 1, score: 300,  color: '#FFD54F' },
    hen:     { svg: svgEnemyHen,     hp: 2, score: 500,  color: '#C0392B' },
    rooster: { svg: svgEnemyRooster, hp: 3, score: 800,  color: '#4A235A' },
    king:    { svg: svgEnemyKing,    hp: 6, score: 2000, color: '#1A5276' },
    armored: { svg: svgEnemyArmored, hp: 4, score: 1000, color: '#7F8C8D' }
};

function makeEnemy(type, x, y, r) {
    const d = ENEMY_DEFS[type] || ENEMY_DEFS.hen;
    const body = Bodies.circle(x, y, r, {
        restitution: 0.35, density: 0.006, friction: 0.5,
        label: 'enemy',
        render: { sprite: tex(d.svg, r * 2.3, r * 2.3), fillStyle: d.color }
    });
    body.enemyType = type;
    body.hp = d.hp;
    body.maxHp = d.hp;
    body.scoreValue = d.score;
    return body;
}

// ==========================================
// BLOCK DEFINITIONS
// ==========================================
const BLOCK_DEFS = {
    wood:  { svg: svgBlockWood,  density: 0.003, restitution: 0.22, friction: 0.6, color: '#C8860A', hp: 3 },
    stone: { svg: svgBlockStone, density: 0.009, restitution: 0.14, friction: 0.7, color: '#717D7E', hp: 6 },
    glass: { svg: svgBlockGlass, density: 0.002, restitution: 0.08, friction: 0.2, color: '#AED6F1', hp: 1 },
    metal: { svg: svgBlockMetal, density: 0.016, restitution: 0.04, friction: 0.4, color: '#566573', hp: 10 },
    tnt:   { svg: svgBlockTNT,   density: 0.004, restitution: 0.3,  friction: 0.5, color: '#C0392B', hp: 1 }
};

function makeBlock(type, x, y, w, h) {
    const d = BLOCK_DEFS[type] || BLOCK_DEFS.wood;
    const body = Bodies.rectangle(x, y, w, h, {
        density: d.density, restitution: d.restitution, friction: d.friction,
        label: 'block',
        render: { sprite: tex(d.svg, w, h), fillStyle: d.color }
    });
    body.blockType = type;
    body.hp = d.hp;
    body.maxHp = d.hp;
    return body;
}

// ==========================================
// LEVEL DATA
// ==========================================
const LEVELS = [
    {
        name: "Level 1: The Hen's Nest",
        bg: '#87CEEB',
        ducks: ['standard', 'standard', 'standard'],
        target: 1000,
        build: (W, H) => {
            const g = H - 60;
            return [
                { fn: 'block', type: 'wood',  x: W*0.73, y: g-50,  w: 48, h: 100 },
                { fn: 'block', type: 'wood',  x: W*0.80, y: g-50,  w: 48, h: 100 },
                { fn: 'block', type: 'wood',  x: W*0.765,y: g-122, w: 130,h: 40 },
                { fn: 'enemy', type: 'hen',   x: W*0.765,y: g-168, r: 26 },
                { fn: 'deco',  type: 'tree',  x: W*0.60, y: g },
                { fn: 'deco',  type: 'bush',  x: W*0.88, y: g },
            ];
        }
    },
    {
        name: "Level 2: Double Trouble",
        bg: '#FFF9C4',
        ducks: ['standard', 'standard', 'heavy', 'standard'],
        target: 2500,
        build: (W, H) => {
            const g = H - 60;
            return [
                // Left tower
                { fn: 'block', type: 'wood',  x: W*0.62, y: g-75,  w: 44, h: 150 },
                { fn: 'block', type: 'wood',  x: W*0.69, y: g-75,  w: 44, h: 150 },
                { fn: 'block', type: 'stone', x: W*0.655,y: g-167, w: 118,h: 44 },
                { fn: 'enemy', type: 'hen',   x: W*0.655,y: g-208, r: 26 },
                // Right bunker
                { fn: 'block', type: 'stone', x: W*0.82, y: g-50,  w: 50, h: 100 },
                { fn: 'block', type: 'stone', x: W*0.89, y: g-50,  w: 50, h: 100 },
                { fn: 'block', type: 'wood',  x: W*0.855,y: g-118, w: 110,h: 40 },
                { fn: 'enemy', type: 'chick', x: W*0.84, y: g-164, r: 20 },
                { fn: 'enemy', type: 'chick', x: W*0.87, y: g-210, r: 20 },
                { fn: 'deco',  type: 'tree',  x: W*0.54, y: g },
                { fn: 'deco',  type: 'hay',   x: W*0.93, y: g },
            ];
        }
    },
    {
        name: "Level 3: Fortress of Feathers",
        bg: '#B2EBF2',
        ducks: ['standard', 'heavy', 'speedy', 'standard', 'heavy'],
        target: 5000,
        build: (W, H) => {
            const g = H - 60;
            return [
                // Main fortress
                { fn: 'block', type: 'stone', x: W*0.58, y: g-75,  w: 48, h: 150 },
                { fn: 'block', type: 'stone', x: W*0.75, y: g-75,  w: 48, h: 150 },
                { fn: 'block', type: 'stone', x: W*0.665,y: g-160, w: 170,h: 50 },
                // Inner walls
                { fn: 'block', type: 'wood',  x: W*0.61, y: g-232, w: 48, h: 76 },
                { fn: 'block', type: 'wood',  x: W*0.72, y: g-232, w: 48, h: 76 },
                { fn: 'block', type: 'glass', x: W*0.665,y: g-290, w: 140,h: 38 },
                // Enemies inside
                { fn: 'enemy', type: 'rooster',x: W*0.665,y: g-210, r: 30 },
                { fn: 'enemy', type: 'hen',    x: W*0.60, y: g-284, r: 26 },
                { fn: 'enemy', type: 'chick',  x: W*0.73, y: g-284, r: 20 },
                // Side hut
                { fn: 'block', type: 'stone', x: W*0.87, y: g-50,  w: 48, h: 100 },
                { fn: 'block', type: 'wood',  x: W*0.87, y: g-117, w: 80, h: 38 },
                { fn: 'enemy', type: 'chick', x: W*0.87, y: g-161, r: 20 },
                { fn: 'deco',  type: 'tree',  x: W*0.51, y: g },
                { fn: 'deco',  type: 'tree',  x: W*0.82, y: g },
                { fn: 'deco',  type: 'hay',   x: W*0.94, y: g },
            ];
        }
    },
    {
        name: "Level 4: King's Castle",
        bg: '#FFE0B2',
        ducks: ['heavy', 'explosive', 'standard', 'speedy', 'heavy', 'explosive'],
        target: 8000,
        build: (W, H) => {
            const g = H - 60;
            return [
                // Castle walls
                { fn: 'block', type: 'metal', x: W*0.57, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'metal', x: W*0.77, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'stone', x: W*0.635,y: g-75,  w: 50, h: 150 },
                { fn: 'block', type: 'stone', x: W*0.695,y: g-75,  w: 50, h: 150 },
                { fn: 'block', type: 'metal', x: W*0.67, y: g-165, w: 215,h: 50 },
                // Towers
                { fn: 'block', type: 'stone', x: W*0.59, y: g-237, w: 48, h: 96 },
                { fn: 'block', type: 'stone', x: W*0.75, y: g-237, w: 48, h: 96 },
                { fn: 'block', type: 'metal', x: W*0.67, y: g-302, w: 172,h: 42 },
                // TNT inside
                { fn: 'block', type: 'tnt',   x: W*0.67, y: g-217, w: 48, h: 48 },
                // Enemies
                { fn: 'enemy', type: 'king',    x: W*0.67, y: g-366, r: 34 },
                { fn: 'enemy', type: 'rooster', x: W*0.59, y: g-298, r: 30 },
                { fn: 'enemy', type: 'rooster', x: W*0.75, y: g-298, r: 30 },
                { fn: 'enemy', type: 'armored', x: W*0.615,y: g-213, r: 32 },
                { fn: 'enemy', type: 'armored', x: W*0.725,y: g-213, r: 32 },
                // Side tower
                { fn: 'block', type: 'stone', x: W*0.88, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'wood',  x: W*0.88, y: g-218, w: 80, h: 40 },
                { fn: 'enemy', type: 'hen',   x: W*0.88, y: g-263, r: 26 },
                { fn: 'enemy', type: 'chick', x: W*0.88, y: g-309, r: 20 },
                { fn: 'deco',  type: 'tree',  x: W*0.49, y: g },
                { fn: 'deco',  type: 'bush',  x: W*0.93, y: g },
            ];
        }
    },
    {
        name: "Level 5: The Final Henhouse",
        bg: '#E8EAF6',
        ducks: ['explosive', 'heavy', 'speedy', 'explosive', 'heavy', 'standard', 'egg'],
        target: 15000,
        build: (W, H) => {
            const g = H - 60;
            return [
                // LEFT TOWER
                { fn: 'block', type: 'metal', x: W*0.50, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'metal', x: W*0.56, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'stone', x: W*0.53, y: g-213, w: 108,h: 42 },
                { fn: 'block', type: 'stone', x: W*0.525,y: g-275, w: 58, h: 80 },
                { fn: 'enemy', type: 'armored',x: W*0.53, y: g-178, r: 32 },
                { fn: 'enemy', type: 'rooster',x: W*0.525,y: g-328, r: 30 },
                // CENTER TOWER
                { fn: 'block', type: 'metal', x: W*0.63, y: g-125, w: 48, h: 250 },
                { fn: 'block', type: 'metal', x: W*0.70, y: g-125, w: 48, h: 250 },
                { fn: 'block', type: 'metal', x: W*0.665,y: g-262, w: 110,h: 50 },
                { fn: 'block', type: 'stone', x: W*0.645,y: g-340, w: 48, h: 98 },
                { fn: 'block', type: 'stone', x: W*0.685,y: g-340, w: 48, h: 98 },
                { fn: 'block', type: 'metal', x: W*0.665,y: g-402, w: 120,h: 42 },
                { fn: 'block', type: 'tnt',   x: W*0.665,y: g-242, w: 48, h: 48 },
                { fn: 'block', type: 'tnt',   x: W*0.63, y: g-98,  w: 48, h: 48 },
                { fn: 'block', type: 'glass', x: W*0.55, y: g-213, w: 118,h: 30 },
                { fn: 'block', type: 'glass', x: W*0.755,y: g-213, w: 118,h: 30 },
                { fn: 'enemy', type: 'king',    x: W*0.665,y: g-466, r: 36 },
                { fn: 'enemy', type: 'king',    x: W*0.665,y: g-300, r: 34 },
                // RIGHT TOWER
                { fn: 'block', type: 'metal', x: W*0.78, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'metal', x: W*0.84, y: g-100, w: 48, h: 200 },
                { fn: 'block', type: 'stone', x: W*0.81, y: g-213, w: 108,h: 42 },
                { fn: 'block', type: 'stone', x: W*0.805,y: g-275, w: 58, h: 80 },
                { fn: 'enemy', type: 'armored',x: W*0.81, y: g-178, r: 32 },
                { fn: 'enemy', type: 'rooster',x: W*0.805,y: g-328, r: 30 },
                // Ground enemies
                { fn: 'enemy', type: 'hen',   x: W*0.585,y: g-40,  r: 26 },
                { fn: 'enemy', type: 'chick', x: W*0.76, y: g-34,  r: 20 },
                { fn: 'enemy', type: 'chick', x: W*0.87, y: g-34,  r: 20 },
                { fn: 'deco',  type: 'tree',  x: W*0.44, y: g },
                { fn: 'deco',  type: 'tree',  x: W*0.92, y: g },
                { fn: 'deco',  type: 'bush',  x: W*0.47, y: g },
                { fn: 'deco',  type: 'hay',   x: W*0.91, y: g },
            ];
        }
    }
];

// ==========================================
// CORE GAME SETUP
// ==========================================
const SLING_X = 230;
const SLING_Y_FORK = height - 148;   // fork tip Y
const anchor = { x: SLING_X, y: SLING_Y_FORK };
const MAX_STRETCH = 115;

// Ground
const ground = Bodies.rectangle(width / 2, height - 30, width * 4, 60, {
    isStatic: true, label: 'ground', friction: 0.9,
    render: { fillStyle: '#5D4037' }
});

// Slingshot visuals — tall enough to look right
// Back prong anchored at fork tip
const slingSpriteBack = Bodies.rectangle(SLING_X - 4, height - 100, 30, 150, {
    isStatic: true, isSensor: true, collisionFilter: { mask: 0 },
    render: { sprite: tex(svgSlingshotBack, 60, 180), fillStyle: 'transparent' }
});
const slingSpriteFront = Bodies.rectangle(SLING_X + 4, height - 80, 30, 130, {
    isStatic: true, isSensor: true, collisionFilter: { mask: 0 },
    render: { sprite: tex(svgSlingshotFront, 60, 160), fillStyle: 'transparent' }
});

World.add(engine.world, [ground, slingSpriteBack, slingSpriteFront]);

// ==========================================
// HUD ELEMENTS
// ==========================================
const duckHUD = document.createElement('div');
duckHUD.style.cssText = `
    position:fixed; bottom:16px; left:16px; z-index:30;
    display:flex; gap:6px; align-items:flex-end; pointer-events:none;
`;
document.body.appendChild(duckHUD);

const overlay = document.createElement('div');
overlay.style.cssText = `
    position:fixed; inset:0; z-index:50; display:none;
    background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center;
    backdrop-filter:blur(6px);
`;
overlay.innerHTML = `<div id="overlayBox" style="
    background:rgba(20,20,40,0.95); border:3px solid rgba(255,210,50,0.6);
    border-radius:24px; padding:40px 64px; text-align:center; color:white;
    font-family:'Segoe UI',sans-serif; min-width:340px;
    box-shadow:0 8px 40px rgba(0,0,0,0.6);
"></div>`;
overlay.style.display = 'none';
document.body.appendChild(overlay);

function showOverlay(title, sub, btn, cb) {
    const box = document.getElementById('overlayBox');
    box.innerHTML = `
        <div style="font-size:32px;font-weight:900;color:#F1C40F;margin-bottom:10px;">${title}</div>
        <div style="font-size:15px;color:#DDD;margin-bottom:26px;line-height:1.6">${sub}</div>
        ${btn ? `<button id="overlayBtn" style="
            background:linear-gradient(135deg,#F5C518,#FF8C00);border:none;border-radius:14px;
            padding:13px 36px;font-size:18px;font-weight:700;cursor:pointer;color:#222;
            box-shadow:0 4px 16px rgba(0,0,0,0.4); pointer-events:all;
        ">${btn}</button>` : ''}
    `;
    overlay.style.display = 'flex';
    if (btn && cb) {
        setTimeout(() => {
            const b = document.getElementById('overlayBtn');
            if (b) b.onclick = () => { overlay.style.display = 'none'; cb(); };
        }, 50);
    }
}

function hideOverlay() { overlay.style.display = 'none'; }

function refreshDuckHUD(queue) {
    duckHUD.innerHTML = '';
    queue.forEach((type, i) => {
        const sz = i === 0 ? 52 : 38;
        const c = document.createElement('canvas');
        c.width = sz; c.height = sz;
        c.style.cssText = `filter:drop-shadow(0 2px 5px rgba(0,0,0,0.5));opacity:${i===0?1:0.7};`;
        const ctx2 = c.getContext('2d');
        const img = new Image();
        const blobUrl = URL.createObjectURL(new Blob([DUCK_DEFS[type].svg], { type: 'image/svg+xml' }));
        img.onload = () => { ctx2.drawImage(img, 0, 0, sz, sz); URL.revokeObjectURL(blobUrl); };
        img.src = blobUrl;
        duckHUD.appendChild(c);
    });
}

// ==========================================
// PARTICLE SYSTEM
// ==========================================
const particles = [];
const floats = [];

function puff(x, y, color, count = 7, speedMult = 1) {
    for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (3 + Math.random() * 6) * speedMult;
        particles.push({
            x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp - 2*speedMult,
            life: 1, decay: 0.022 + Math.random()*0.02,
            size: 8 + Math.random()*10, color,
            rot: Math.random()*Math.PI*2, rotV: (Math.random()-0.5)*0.18,
            type: 'feather'
        });
    }
}

function boom(x, y) {
    particles.push({ x, y, vx:0, vy:0, life:1, decay:0.07, size:90, color:'rgba(255,200,40,0.7)', type:'flash', rot:0, rotV:0 });
    for (let i = 0; i < 16; i++) {
        const a = Math.random()*Math.PI*2;
        const sp = 5 + Math.random()*9;
        particles.push({
            x, y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp-5,
            life:1, decay:0.025+Math.random()*0.03,
            size:12+Math.random()*18, color:`hsl(${20+Math.random()*40},100%,${50+Math.random()*20}%)`,
            rot:0, rotV:0, type:'spark'
        });
    }
}

function floatScore(x, y, text) {
    floats.push({ x, y, text, life: 1, vy: -1.6 });
}

// ==========================================
// LEVEL LOADING
// ==========================================
function clearLevel() {
    allLevelBodies.forEach(b => { try { World.remove(engine.world, b); } catch(e){} });
    allLevelBodies = [];
    allEnemies = [];
    if (duck) { try { World.remove(engine.world, duck); } catch(e){} duck = null; }
    if (elastic) { try { World.remove(engine.world, elastic); } catch(e){} elastic = null; }
    duckQueue = [];
    levelComplete = false;
    duckInFlight = false;
    particles.length = 0;
    floats.length = 0;
}

function loadLevel(n) {
    clearLevel();
    currentLevel = n;
    const lvl = LEVELS[n - 1];
    if (!lvl) return;

    render.options.background = lvl.bg;
    ground.render.fillStyle = '#5D4037';

    // Build level
    lvl.build(width, height).forEach(item => {
        let b = null;
        if (item.fn === 'block') {
            b = makeBlock(item.type, item.x, item.y, item.w, item.h);
            allLevelBodies.push(b);
            World.add(engine.world, b);
        } else if (item.fn === 'enemy') {
            b = makeEnemy(item.type, item.x, item.y, item.r);
            allLevelBodies.push(b);
            allEnemies.push(b);
            World.add(engine.world, b);
        } else if (item.fn === 'deco') {
            let sv, bw, bh;
            if (item.type === 'tree') { sv = svgTree; bw = 80; bh = 160; }
            else if (item.type === 'bush') { sv = svgBush; bw = 120; bh = 70; }
            else { sv = svgHay; bw = 100; bh = 75; }
            const hh = bh / 2;
            b = Bodies.rectangle(item.x, item.y - hh, bw, bh, {
                isStatic: true, isSensor: true, collisionFilter: { mask: 0 },
                render: { sprite: tex(sv, bw, bh), fillStyle: 'transparent' }
            });
            allLevelBodies.push(b);
            World.add(engine.world, b);
        }
    });

    duckQueue = [...lvl.ducks];
    refreshDuckHUD(duckQueue);
    updateScore();

    spawnDuck();

    showOverlay(
        `🎮 ${lvl.name}`,
        `Target Score: <span style="color:#F5C518">${lvl.target.toLocaleString()}</span><br>
         Ducks: ${lvl.ducks.length} &nbsp;|&nbsp; Enemies: ${allEnemies.length}`,
        '🚀 Launch!',
        () => {}
    );
}

function updateScore() {
    scoreBoard.innerText = `Score: ${score.toLocaleString()}`;
}

function spawnDuck() {
    if (duckQueue.length === 0) {
        setTimeout(evalLevel, 2000);
        return;
    }
    const type = duckQueue.shift();
    refreshDuckHUD(duckQueue);
    duck = makeDuck(type, anchor.x, anchor.y);
    elastic = Constraint.create({
        pointA: anchor, bodyB: duck,
        stiffness: 0.05, damping: 0.01, length: 0,
        render: { visible: false }
    });
    World.add(engine.world, [duck, elastic]);
    duckInFlight = false;
}

function evalLevel() {
    const alive = allEnemies.filter(e => !e.isDestroyed && Composite.get(engine.world, e.id, 'body'));
    if (alive.length === 0) {
        winLevel();
    } else {
        loseLevel(alive.length);
    }
}

function winLevel() {
    if (levelComplete) return;
    levelComplete = true;
    const bonus = duckQueue.length * 1000 + (duck ? 1000 : 0);
    score += bonus;
    updateScore();
    if (currentLevel < totalLevels) {
        showOverlay(
            '🎉 Level Complete!',
            `Score: <b style="color:#F5C518">${score.toLocaleString()}</b><br>
             Bird Bonus: <b style="color:#5CFF5C">+${bonus.toLocaleString()}</b>`,
            `Next Level →`,
            () => loadLevel(currentLevel + 1)
        );
    } else {
        showOverlay(
            '🏆 YOU WIN!',
            `Final Score: <b style="color:#F5C518">${score.toLocaleString()}</b><br>
             All hens defeated! You are the Angry Ducks champion!`,
            '🔄 Play Again',
            () => { score = 0; loadLevel(1); }
        );
    }
}

function loseLevel(count) {
    showOverlay(
        '💀 Failed!',
        `${count} hen${count > 1 ? 's' : ''} survived!<br>
         Score: <b style="color:#F5C518">${score.toLocaleString()}</b>`,
        '🔄 Retry',
        () => loadLevel(currentLevel)
    );
}

// ==========================================
// MOUSE CONTROLS
// ==========================================
const mouse = Mouse.create(render.canvas);
mouse.pixelRatio = window.devicePixelRatio || 1;

const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.9, render: { visible: false } }
});
World.add(engine.world, mouseConstraint);
render.mouse = mouse;

// Clamp stretch
Events.on(engine, 'beforeUpdate', () => {
    if (!duck || !elastic || !elastic.bodyB || duckInFlight) return;
    const dx = duck.position.x - anchor.x;
    const dy = duck.position.y - anchor.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > MAX_STRETCH) {
        const s = MAX_STRETCH / dist;
        Body.setPosition(duck, { x: anchor.x + dx*s, y: anchor.y + dy*s });
        Body.setVelocity(duck, { x: 0, y: 0 });
    }
});

Events.on(mouseConstraint, 'enddrag', (e) => {
    if (!duck || e.body !== duck || duckInFlight) return;
    const dx = duck.position.x - anchor.x;
    const dy = duck.position.y - anchor.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 18) {
        Body.setPosition(duck, { x: anchor.x, y: anchor.y });
        Body.setVelocity(duck, { x: 0, y: 0 });
        return;
    }
    // Fire!
    duckInFlight = true;
    setTimeout(() => {
        if (!elastic) return;
        elastic.bodyB = null;
        World.remove(engine.world, elastic);
        elastic = null;

        if (duck && duck.duckType === 'speedy') {
            const v = duck.velocity;
            Body.setVelocity(duck, { x: v.x * 1.7, y: v.y * 1.7 });
        }

        const firedDuck = duck;
        duck = null;

        // Watch until duck stops or goes off screen
        const watchId = setInterval(() => {
            if (!firedDuck || firedDuck.isDestroyed) { clearInterval(watchId); nextDuck(); return; }
            const v = firedDuck.velocity;
            const spd = Math.sqrt(v.x*v.x + v.y*v.y);
            const off = firedDuck.position.x > width + 300 || firedDuck.position.x < -300 || firedDuck.position.y > height + 200;
            if (spd < 0.6 || off) {
                clearInterval(watchId);
                setTimeout(nextDuck, 700);
            }
        }, 200);
    }, 40);
});

function nextDuck() {
    if (duckQueue.length > 0) {
        spawnDuck();
    } else {
        setTimeout(evalLevel, 1500);
    }
}

// ==========================================
// COLLISION HANDLING
// ==========================================
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(({ bodyA, bodyB }) => {
        // Enemy hits
        const hitEnemy = (enemy, other) => {
            if (enemy.isDestroyed) return;
            const spd = Math.sqrt(other.velocity.x**2 + other.velocity.y**2);
            const dmg = other.label === 'duck' ? 999 : Math.floor(spd / 5);
            if (dmg < 1 && other.label !== 'duck') return;
            enemy.hp -= Math.max(1, dmg);
            if (enemy.hp <= 0) killEnemy(enemy);
        };
        if (bodyA.label === 'enemy') hitEnemy(bodyA, bodyB);
        if (bodyB.label === 'enemy') hitEnemy(bodyB, bodyA);

        // Block damage + TNT
        const hitBlock = (block, other) => {
            if (!block.blockType) return;
            const spd = Math.sqrt(other.velocity.x**2 + other.velocity.y**2);
            if (spd > 6) {
                block.hp--;
                if (block.hp <= 0) {
                    if (block.blockType === 'tnt' && !block.exploded) triggerTNT(block);
                    else { try { World.remove(engine.world, block); } catch(e){} }
                }
            }
        };
        if (bodyA.label === 'block') hitBlock(bodyA, bodyB);
        if (bodyB.label === 'block') hitBlock(bodyB, bodyA);

        // Explosive duck detonates on hard impact
        const checkExplode = (b, other) => {
            if (b.label === 'duck' && b.duckType === 'explosive' && !b.exploded) {
                const spd = Math.sqrt(b.velocity.x**2 + b.velocity.y**2);
                if (spd > 3 && other.label !== 'ground') {
                    b.exploded = true;
                    explode(b.position.x, b.position.y, 130);
                    try { World.remove(engine.world, b); } catch(e){}
                }
            }
        };
        checkExplode(bodyA, bodyB);
        checkExplode(bodyB, bodyA);
    });
});

function killEnemy(enemy) {
    if (enemy.isDestroyed) return;
    enemy.isDestroyed = true;
    const pts = enemy.scoreValue || 500;
    score += pts;
    updateScore();
    puff(enemy.position.x, enemy.position.y, '#F5C518', 8);
    floatScore(enemy.position.x, enemy.position.y - 20, `+${pts}`);
    setTimeout(() => {
        try { World.remove(engine.world, enemy); } catch(e){}
        const alive = allEnemies.filter(e => !e.isDestroyed && Composite.get(engine.world, e.id, 'body'));
        if (alive.length === 0 && !levelComplete) {
            levelComplete = true;
            setTimeout(winLevel, 1000);
        }
    }, 10);
}

function triggerTNT(block) {
    if (block.exploded) return;
    block.exploded = true;
    explode(block.position.x, block.position.y, 160);
    score += 200;
    updateScore();
    floatScore(block.position.x, block.position.y - 20, '+200 💥');
    setTimeout(() => { try { World.remove(engine.world, block); } catch(e){} }, 30);
}

function explode(x, y, radius) {
    boom(x, y);
    Composite.allBodies(engine.world).forEach(b => {
        if (b.isStatic) return;
        const dx = b.position.x - x, dy = b.position.y - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < radius && dist > 0) {
            const f = (1 - dist/radius) * 0.09;
            Body.applyForce(b, b.position, { x: (dx/dist)*f, y: (dy/dist)*f - 0.025 });
            if (b.label === 'enemy' && !b.isDestroyed) { b.hp = 0; killEnemy(b); }
            if (b.blockType === 'tnt' && !b.exploded) setTimeout(() => triggerTNT(b), 80);
        }
    });
}

// ==========================================
// RENDER — SLINGSHOT BANDS + EFFECTS
// ==========================================
Events.on(render, 'afterRender', () => {
    const ctx = render.context;

    // ----- Slingshot Bands -----
    const dp = (duck && elastic && elastic.bodyB) ? duck.position : null;

    // Back band
    ctx.save();
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (dp) {
        ctx.beginPath();
        ctx.moveTo(anchor.x - 14, anchor.y - 6);
        ctx.quadraticCurveTo(
            (anchor.x - 14 + dp.x)*0.5 + 4, (anchor.y - 6 + dp.y)*0.5 + 12,
            dp.x - 5, dp.y + 2
        );
        ctx.strokeStyle = '#4A1F00'; ctx.stroke();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#7B3A00'; ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(anchor.x - 14, anchor.y - 6);
        ctx.lineTo(anchor.x - 5, anchor.y + 8);
        ctx.strokeStyle = '#4A1F00'; ctx.stroke();
    }
    ctx.restore();

    // Front band (drawn after duck so it appears in front)
    ctx.save();
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    if (dp) {
        ctx.beginPath();
        ctx.moveTo(anchor.x + 14, anchor.y - 6);
        ctx.quadraticCurveTo(
            (anchor.x + 14 + dp.x)*0.5 - 4, (anchor.y - 6 + dp.y)*0.5 + 12,
            dp.x + 5, dp.y + 2
        );
        ctx.strokeStyle = '#4A1F00'; ctx.stroke();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#8B4513'; ctx.stroke();

        // ----- Aim trajectory -----
        const launchVx = (anchor.x - dp.x) * 0.068;
        const launchVy = (anchor.y - dp.y) * 0.068;
        let tx = dp.x, ty = dp.y, tvx = launchVx, tvy = launchVy;
        for (let i = 0; i < 28; i++) {
            tvy += 0.52;
            tx += tvx; ty += tvy;
            if (tx > width + 50 || ty > height) break;
            const a = (1 - i/28) * 0.55;
            ctx.beginPath();
            ctx.arc(tx, ty, 3.8 - i*0.1, 0, Math.PI*2);
            ctx.fillStyle = `rgba(255,255,180,${a})`;
            ctx.fill();
        }
    } else {
        ctx.beginPath();
        ctx.moveTo(anchor.x + 14, anchor.y - 6);
        ctx.lineTo(anchor.x + 5, anchor.y + 8);
        ctx.strokeStyle = '#4A1F00'; ctx.stroke();
    }
    ctx.restore();

    // ----- Particles -----
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.28; p.vx *= 0.97;
        p.life -= p.decay; p.rot += p.rotV;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.type === 'flash') {
            ctx.beginPath(); ctx.arc(0,0,p.size*p.life,0,Math.PI*2);
            ctx.fillStyle = p.color; ctx.fill();
        } else if (p.type === 'feather') {
            ctx.beginPath();
            ctx.ellipse(0,0,p.size*0.28,p.size,0,0,Math.PI*2);
            ctx.fillStyle = p.color; ctx.fill();
            ctx.beginPath(); ctx.moveTo(0,-p.size); ctx.lineTo(0,p.size);
            ctx.strokeStyle = '#8B5E0A'; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
            ctx.beginPath(); ctx.arc(0,0,p.size*0.5,0,Math.PI*2);
            ctx.fillStyle = p.color; ctx.fill();
        }
        ctx.restore();
    }

    // ----- Floating score labels -----
    for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.y += f.vy; f.life -= 0.017;
        if (f.life <= 0) { floats.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = f.life;
        ctx.font = 'bold 22px "Segoe UI",sans-serif';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.fillStyle = '#FFD700';
        ctx.strokeText(f.text, f.x - 22, f.y);
        ctx.fillText(f.text, f.x - 22, f.y);
        ctx.restore();
    }

    // ----- HUD top bar -----
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.roundRect(width - 230, 14, 216, 50, 10);
    ctx.fill();
    const lvlDef = LEVELS[currentLevel - 1];
    ctx.font = 'bold 13px "Segoe UI",sans-serif';
    ctx.fillStyle = '#F1C40F';
    if (lvlDef) {
        ctx.fillText(`Lv ${currentLevel}: ${lvlDef.name.split(':')[1]?.trim() || ''}`, width - 220, 33);
        const alive = allEnemies.filter(e => !e.isDestroyed && Composite.get(engine.world, e.id, 'body')).length;
        ctx.fillStyle = alive > 0 ? '#FF6B6B' : '#5CFF5C';
        ctx.fillText(`🐔 Hens remaining: ${alive}`, width - 220, 52);
    }
    ctx.restore();
});

// ==========================================
// START
// ==========================================
const runner = Runner.create();
Runner.run(runner, engine);
Render.run(render);

setTimeout(() => loadLevel(1), 600);

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'r') loadLevel(currentLevel);
    if (k === 'n' && currentLevel < totalLevels) { hideOverlay(); loadLevel(currentLevel + 1); }
    if (k === 'p' && currentLevel > 1) { hideOverlay(); loadLevel(currentLevel - 1); }
});

// Hint
const kbHint = document.createElement('div');
kbHint.style.cssText = `
    position:fixed;bottom:16px;right:16px;z-index:30;
    color:rgba(255,255,255,0.6);font-family:'Segoe UI',sans-serif;
    font-size:11px;pointer-events:none;text-align:right;
    text-shadow:0 1px 4px rgba(0,0,0,0.9);
`;
kbHint.innerHTML = `R = Retry &nbsp;&nbsp; N = Next &nbsp;&nbsp; P = Prev`;
document.body.appendChild(kbHint);

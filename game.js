const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Constraint, Events, Composite, Vector } = Matter;

let width = window.innerWidth;
let height = window.innerHeight;

const engine = Engine.create();
const runner = Runner.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'linear-gradient(0deg, #87CEEB 0%, #E0F6FF 100%)'
    }
});

let currentLevel = 0;
let score = 0;
let ducksRemaining = 3;
const scoreBoard = document.getElementById('scoreBoard');
const levelIndicator = document.getElementById('levelIndicator');

// ==========================================
// 1. ASSET DEFINITIONS (SVGs)
// ==========================================

// --- DUCKS (Ammo) ---
const ducks = [
    { name: 'Red', mass: 1, color: '#FF0000', radius: 20 },
    { name: 'Blue', mass: 0.5, color: '#0000FF', radius: 15 },
    { name: 'Yellow', mass: 1.5, color: '#FFFF00', radius: 22 },
    { name: 'Black', mass: 3, color: '#333333', radius: 30 }
];

// --- ENEMIES (Hens) ---
const hens = {
    chick: { label: 'hen', render: { fillStyle: '#FED918' }, hp: 1 },
    hen: { label: 'hen', render: { fillStyle: '#9E5D31' }, hp: 2 },
    king: { label: 'hen', render: { fillStyle: '#F6B019' }, hp: 4 }
};

// --- BLOCKS ---
const blocks = {
    wood: { density: 0.001, friction: 0.5, color: '#BA6B36' },
    stone: { density: 0.005, friction: 0.8, color: '#748187' },
    ice: { density: 0.0005, friction: 0.05, color: '#A5F2F3' },
    tnt: { density: 0.001, color: '#FF4500' }
};

// --- PROPS & ENVIRONMENT (8 Unique Assets) ---
const props = {
    cloud: `<svg viewBox="0 0 100 60"><path d="M10 40 Q10 20 30 20 Q40 5 60 15 Q85 10 90 35 Q95 55 70 55 H20 Q5 55 10 40" fill="white" opacity="0.8"/></svg>`,
    tree: `<svg viewBox="0 0 50 80"><rect x="20" y="50" width="10" height="30" fill="#4B2C20"/><circle cx="25" cy="30" r="25" fill="#2D5A27"/></svg>`,
    bush: `<svg viewBox="0 0 60 40"><path d="M0 40 Q10 10 30 15 Q50 5 60 40" fill="#1E4D2B"/></svg>`,
    mountain: `<svg viewBox="0 0 200 100"><path d="M0 100 L80 20 L130 60 L180 10 L250 100 Z" fill="#4A6572" opacity="0.5"/></svg>`,
    sun: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#FFD700"/></svg>`,
    flower: `<svg viewBox="0 0 20 40"><rect x="9" y="20" width="2" height="20" fill="green"/><circle cx="10" cy="15" r="8" fill="pink"/><circle cx="10" cy="15" r="3" fill="yellow"/></svg>`,
    fence: `<svg viewBox="0 0 40 40"><rect x="5" y="0" width="5" height="40" fill="#8B4513"/><rect x="30" y="0" width="5" height="40" fill="#8B4513"/><rect x="0" y="10" width="40" height="5" fill="#8B4513"/><rect x="0" y="25" width="40" height="5" fill="#8B4513"/></svg>`,
    grass: `<svg viewBox="0 0 30 20"><path d="M0 20 L5 0 L10 20 L15 5 L20 20 L25 0 L30 20" fill="none" stroke="#228B22" stroke-width="2"/></svg>`
};

// ==========================================
// 2. LEVEL DATA
// ==========================================

const levelData = [
    {
        title: "The Farm Gate",
        ducks: 3,
        enemies: [
            { type: hens.chick, x: 800, y: height - 60 },
            { type: hens.chick, x: 950, y: height - 60 }
        ],
        structures: [
            { x: 875, y: height - 100, w: 200, h: 20, m: blocks.wood },
            { x: 800, y: height - 40, w: 20, h: 80, m: blocks.wood },
            { x: 950, y: height - 40, w: 20, h: 80, m: blocks.wood }
        ]
    },
    {
        title: "Stone Fortress",
        ducks: 3,
        enemies: [
            { type: hens.hen, x: 900, y: height - 150 },
            { type: hens.chick, x: 850, y: height - 40 },
            { type: hens.chick, x: 950, y: height - 40 }
        ],
        structures: [
            { x: 900, y: height - 40, w: 150, h: 20, m: blocks.stone },
            { x: 830, y: height - 80, w: 20, h: 100, m: blocks.stone },
            { x: 970, y: height - 80, w: 20, h: 100, m: blocks.stone },
            { x: 900, y: height - 130, w: 180, h: 20, m: blocks.ice }
        ]
    },
    {
        title: "The King's Guard",
        ducks: 4,
        enemies: [
            { type: hens.king, x: 950, y: height - 200 },
            { type: hens.hen, x: 800, y: height - 40 },
            { type: hens.hen, x: 1100, y: height - 40 }
        ],
        structures: [
            { x: 950, y: height - 100, w: 20, h: 200, m: blocks.stone }, // Pillar
            { x: 950, y: height - 180, w: 200, h: 20, m: blocks.tnt },    // Explosive roof
            { x: 850, y: height - 40, w: 100, h: 100, m: blocks.wood },
            { x: 1050, y: height - 40, w: 100, h: 100, m: blocks.wood }
        ]
    }
];

// ==========================================
// 3. CORE GAME FUNCTIONS
// ==========================================

function initLevel(idx) {
    World.clear(engine.world);
    const data = levelData[idx];
    ducksRemaining = data.ducks;
    levelIndicator.innerText = `Level ${idx + 1}: ${data.title}`;
    
    // Ground
    const ground = Bodies.rectangle(width / 2, height - 10, width * 2, 60, { 
        isStatic: true, 
        render: { fillStyle: '#4CAF50' } 
    });
    World.add(engine.world, ground);

    // Build Structures
    data.structures.forEach(s => {
        const b = Bodies.rectangle(s.x, s.y, s.w, s.h, {
            density: s.m.density,
            friction: s.m.friction,
            render: { fillStyle: s.m.color }
        });
        World.add(engine.world, b);
    });

    // Add Enemies
    data.enemies.forEach(e => {
        const hen = Bodies.circle(e.x, e.y, 25, {
            label: 'enemy',
            hp: e.type.hp,
            render: e.type.render
        });
        World.add(engine.world, hen);
    });

    setupSlingshot();
}

let anchor, duck, elastic;

function setupSlingshot() {
    anchor = { x: 200, y: height - 200 };
    spawnDuck();
}

function spawnDuck() {
    if (ducksRemaining <= 0) {
        checkGameOver();
        return;
    }
    
    const duckConfig = ducks[Math.min(currentLevel, ducks.length - 1)];
    duck = Bodies.circle(anchor.x, anchor.y, duckConfig.radius, {
        mass: duckConfig.mass,
        render: { fillStyle: duckConfig.color }
    });
    
    elastic = Constraint.create({
        pointA: anchor,
        bodyB: duck,
        stiffness: 0.1,
        render: { strokeStyle: '#3A1F0D', lineWidth: 5 }
    });
    
    World.add(engine.world, [duck, elastic]);
    ducksRemaining--;
}

// Slingshot Release Logic
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});

Events.on(mouseConstraint, 'enddrag', (e) => {
    if (e.body === duck) {
        setTimeout(() => {
            elastic.bodyB = null;
            // Spawn next duck after 3 seconds
            setTimeout(spawnDuck, 3000);
        }, 20);
    }
});

// Collision Handling
Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        const processHit = (target, attacker) => {
            if (target.label === 'enemy') {
                const speed = attacker.speed || 0;
                if (speed > 3) {
                    target.hp -= 1;
                    if (target.hp <= 0) {
                        World.remove(engine.world, target);
                        score += 1000;
                        updateUI();
                        checkWin();
                    }
                }
            }
        };
        processHit(bodyA, bodyB);
        processHit(bodyB, bodyA);
    });
});

function checkWin() {
    const enemies = Composite.allBodies(engine.world).filter(b => b.label === 'enemy');
    if (enemies.length === 0) {
        alert("Level Cleared!");
        currentLevel = (currentLevel + 1) % levelData.length;
        initLevel(currentLevel);
    }
}

function checkGameOver() {
    setTimeout(() => {
        const enemies = Composite.allBodies(engine.world).filter(b => b.label === 'enemy');
        if (enemies.length > 0) {
            alert("Game Over! Restarting level...");
            initLevel(currentLevel);
        }
    }, 5000);
}

function updateUI() {
    scoreBoard.innerText = `Score: ${score}`;
}

// Run the game
initLevel(0);
Runner.run(runner, engine);
Render.run(render);
World.add(engine.world, mouseConstraint);

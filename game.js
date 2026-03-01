const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Constraint, Events, Composite } = Matter;

const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false, // Set to true to debug hitboxes
        background: '#87CEEB'
    }
});

// --- 1. PLACEHOLDER SVGS (Replace these with your codes) ---
// Note: They are all 200x200, so your real SVGs will scale perfectly!

const svgStandard = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="yellow" stroke="black" stroke-width="5"/></svg>`;
const svgHeavy = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#286491" stroke="black" stroke-width="5"/></svg>`;
const svgSpeedy = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#EE3524" stroke="black" stroke-width="5"/></svg>`;
const svgExplosive = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#065B4A" stroke="black" stroke-width="5"/></svg>`;
const svgHen = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#8B4513" stroke="red" stroke-width="5"/></svg>`;

// Helper function to safely encode SVGs for Canvas
const createTexture = (svgString) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);

// --- 2. ENVIRONMENT SETUP ---
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 25, window.innerWidth, 50, { 
    isStatic: true, 
    render: { fillStyle: '#4CAF50' } // Green ground
});

const anchor = { x: 250, y: window.innerHeight - 250 };
const slingshotPillar = Bodies.rectangle(250, window.innerHeight - 125, 20, 200, { isStatic: true, render: { fillStyle: '#5C4033' } });

// --- 3. AMMO CREATION (The Duck Queue) ---
const duckRadius = 25;
const scale = (duckRadius * 2) / 200; // 50 / 200 = 0.25 scaling

// Create the ducks with their specific textures
const ducks = [
    Bodies.circle(100, window.innerHeight - 80, duckRadius, { restitution: 0.5, density: 0.005, render: { sprite: { texture: createTexture(svgStandard), xScale: scale, yScale: scale } } }),
    Bodies.circle(50, window.innerHeight - 80, duckRadius, { restitution: 0.3, density: 0.010, render: { sprite: { texture: createTexture(svgHeavy), xScale: scale, yScale: scale } } }),
    Bodies.circle(150, window.innerHeight - 80, duckRadius, { restitution: 0.7, density: 0.003, render: { sprite: { texture: createTexture(svgSpeedy), xScale: scale, yScale: scale } } }),
    Bodies.circle(200, window.innerHeight - 80, duckRadius, { restitution: 0.4, density: 0.008, render: { sprite: { texture: createTexture(svgExplosive), xScale: scale, yScale: scale } } })
];

let currentDuck = ducks.shift(); // Take the first duck (Standard) out of the queue

// Move the first duck to the slingshot anchor
Matter.Body.setPosition(currentDuck, anchor);

// Create the slingshot elastic band
const elastic = Constraint.create({
    pointA: anchor,
    bodyB: currentDuck,
    stiffness: 0.05,
    render: { strokeStyle: '#333', lineWidth: 5 }
});

// --- 4. ENEMY & STRUCTURE SETUP ---
const structureX = window.innerWidth - 350;
const blocks = [
    // Bottom Floor
    Bodies.rectangle(structureX - 60, window.innerHeight - 100, 30, 100, { render: { fillStyle: '#D2B48C' } }),
    Bodies.rectangle(structureX + 60, window.innerHeight - 100, 30, 100, { render: { fillStyle: '#D2B48C' } }),
    Bodies.rectangle(structureX, window.innerHeight - 165, 200, 30, { render: { fillStyle: '#8B4513' } }),
    // Second Floor
    Bodies.rectangle(structureX - 40, window.innerHeight - 230, 30, 100, { render: { fillStyle: '#D2B48C' } }),
    Bodies.rectangle(structureX + 40, window.innerHeight - 230, 30, 100, { render: { fillStyle: '#D2B48C' } }),
    Bodies.rectangle(structureX, window.innerHeight - 295, 150, 30, { render: { fillStyle: '#8B4513' } })
];

const hens = [
    Bodies.circle(structureX, window.innerHeight - 100, duckRadius, { restitution: 0.4, render: { sprite: { texture: createTexture(svgHen), xScale: scale, yScale: scale } } }),
    Bodies.circle(structureX, window.innerHeight - 220, duckRadius, { restitution: 0.4, render: { sprite: { texture: createTexture(svgHen), xScale: scale, yScale: scale } } }),
    Bodies.circle(structureX, window.innerHeight - 350, duckRadius, { restitution: 0.4, render: { sprite: { texture: createTexture(svgHen), xScale: scale, yScale: scale } } })
];

// Add everything to the world
World.add(engine.world, [ground, slingshotPillar, elastic, currentDuck, ...ducks, ...blocks, ...hens]);

// --- 5. INTERACTION & FIRING LOGIC ---
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.1, render: { visible: false } }
});
World.add(engine.world, mouseConstraint);
render.mouse = mouse;

let isFiring = false;

Events.on(mouseConstraint, 'enddrag', function(event) {
    if (event.body === currentDuck) {
        isFiring = true;
        // Snap the band and release the duck
        setTimeout(() => {
            elastic.bodyB = null;
        }, 50);

        // Load the next duck after 3 seconds
        setTimeout(() => {
            if (ducks.length > 0) {
                currentDuck = ducks.shift();
                Matter.Body.setPosition(currentDuck, anchor);
                elastic.bodyB = currentDuck;
                isFiring = false;
            } else {
                console.log("Out of ducks! Game Over.");
            }
        }, 3000);
    }
});

// Run the engine
Runner.run(Runner.create(), engine);
Render.run(render);

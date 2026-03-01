// Destructure required modules from Matter.js
const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Constraint, Events } = Matter;

// 1. Initialize the Engine and Renderer
const engine = Engine.create();
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false, // Set to true if you want to see the collision hitboxes
        background: '#87CEEB'
    }
});

// 2. Prepare Your SVG Assets
// Paste your exact SVG string between the backticks
const standardDuckSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    </svg>`;

// Convert the SVG into a format the canvas can render as an image
const duckTexture = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(standardDuckSVG);

// 3. Create the Environment
// The Ground
const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight - 20, window.innerWidth, 40, { 
    isStatic: true, 
    render: { fillStyle: '#4CAF50' } 
});

// The Slingshot Anchor Point
const anchor = { x: 250, y: window.innerHeight - 250 };

// 4. Create the Ammo (The Duck)
let duck = Bodies.circle(anchor.x, anchor.y, 25, {
    restitution: 0.5, // Bounciness
    density: 0.005,
    render: {
        sprite: {
            texture: duckTexture,
            xScale: 0.25, // Scales your 200x200 SVG down to fit the 25 radius hitbox
            yScale: 0.25
        }
    }
});

// 5. Create the Slingshot Band
const elastic = Constraint.create({
    pointA: anchor,
    bodyB: duck,
    stiffness: 0.05,
    render: { strokeStyle: '#5C4033', lineWidth: 5 }
});

// 6. Create the Target Structures
const block1 = Bodies.rectangle(window.innerWidth - 300, window.innerHeight - 80, 40, 80, { render: { fillStyle: '#D2B48C' } });
const block2 = Bodies.rectangle(window.innerWidth - 200, window.innerHeight - 80, 40, 80, { render: { fillStyle: '#D2B48C' } });
const block3 = Bodies.rectangle(window.innerWidth - 250, window.innerHeight - 130, 140, 20, { render: { fillStyle: '#8B4513' } });

// The Enemy (Hen Placeholder - a basic red circle for now)
const hen = Bodies.circle(window.innerWidth - 250, window.innerHeight - 170, 25, { 
    restitution: 0.4, 
    render: { fillStyle: '#FF0000' } 
});

// Add everything to the physics world
World.add(engine.world, [ground, duck, elastic, block1, block2, block3, hen]);

// 7. Setup Mouse Interaction
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.1,
        render: { visible: false }
    }
});
World.add(engine.world, mouseConstraint);
render.mouse = mouse; // Keeps the mouse synced with rendering

// 8. Firing Logic
Events.on(mouseConstraint, 'enddrag', function(event) {
    if (event.body === duck) {
        // Snap the elastic band shortly after releasing the mouse
        setTimeout(() => {
            elastic.bodyB = null;
        }, 80);
    }
});

// 9. Run the Game
Runner.run(Runner.create(), engine);
Render.run(render);
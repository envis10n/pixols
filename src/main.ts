import { Application, Assets, Graphics, Sprite } from "pixi.js";
import { Vec2 } from "./math";

function randomInRange(max = 1, min = 0): number {
    return Math.round(Math.random() * (max - min) + min);
}

function randomPick<T>(a: T, b: T, weight = 0.5): T {
    if (Math.random() <= weight) return a;
    return b;
}

class Graviton {
    public mass: number = 500000;
    public gravity: number = 0.001;
    constructor(position: Vec2);
    constructor();
    constructor(public position: Vec2 = new Vec2()) {}
    public getVelocity(a: Actor): Vec2 {
        const r = a.position.distanceTo(this.position);
        const accel = this.gravity * ((this.mass * a.mass) / Math.pow(r, 2));
        return a.position.directionOf(this.position).multiplyScalar(accel);
    }
}

class Actor {
    public position: Vec2 = new Vec2();
    public velocity: Vec2 = new Vec2();
    public mass: number = 2;
    public gravity: Graviton = new Graviton();
}

class Pixol extends Actor {
    public hp: number = 100;
    public sprite: Sprite = Sprite.from("/assets/particle.png");
    constructor() {
        super();
        this.sprite.scale.set(0.02);
    }
    public setPosition(pos: Vec2) {
        this.position = pos;
        this.sprite.position.set(pos.x, pos.y);
    }
    public tick(delta: number) {
        let pvel = new Vec2(
            this.velocity.x * delta,
            this.velocity.y * delta
        ).add(this.gravity.getVelocity(this));
        this.setPosition(this.position.add(pvel));
    }
}

(async () => {
    // Create a new application
    const app = new Application();

    // Initialize the application
    await app.init({ background: "#1099bb", resizeTo: window });

    // Append the application canvas to the document body
    document.getElementById("pixi-container")!.appendChild(app.canvas);

    const MAX_WIDTH = app.screen.width;
    const MAX_HEIGHT = app.screen.height;
    const MID_POINT = new Vec2(MAX_WIDTH / 2, MAX_HEIGHT / 2);
    const SPAWN_RATE = 5000;

    await Assets.load("/assets/particle.png");

    const pixols: Pixol[] = [];
    const graviton = new Graviton(new Vec2(MAX_WIDTH / 2, MAX_HEIGHT / 2));

    for (let i = 0; i < SPAWN_RATE; i++) {
        const pixol = new Pixol();

        pixol.sprite.anchor.set(0.5);
        pixol.setPosition(Vec2.randomInRadius(MID_POINT, 300));
        pixol.gravity = graviton;
        pixols.push(pixol);
        app.stage.addChild(pixol.sprite);
    }

    // Listen for animate update
    app.ticker.add((time) => {
        // Just for fun, let's rotate mr rabbit a little.
        // * Delta is 1 if running at 100% performance *
        // * Creates frame-independent transformation *
        for (const pixol of pixols) {
            pixol.tick(time.deltaTime);
            let changed = false;
            if (pixol.position.x < 0) {
                pixol.position.x = 0;
                pixol.velocity.x = -pixol.velocity.x;
                changed = true;
            } else if (pixol.position.x >= MAX_WIDTH) {
                pixol.position.x = MAX_WIDTH - 1;
                pixol.velocity.x = -pixol.velocity.x;
                changed = true;
            } else if (pixol.position.y < 0) {
                pixol.position.y = 0;
                pixol.velocity.y = -pixol.velocity.y;
                changed = true;
            } else if (pixol.position.y >= MAX_HEIGHT) {
                pixol.velocity.y = -pixol.velocity.y;
                pixol.position.y = MAX_HEIGHT - 1;
                changed = true;
            }
            if (changed) {
                pixol.setPosition(pixol.position);
            }
        }
    });
})();

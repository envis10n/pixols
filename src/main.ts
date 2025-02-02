import { Application, Assets, Graphics, Sprite } from "pixi.js";

function randomInRange(max = 1, min = 0): number {
    return Math.round(Math.random() * (max - min) + min);
}

function randomPick<T>(a: T, b: T, weight = 0.5): T {
    if (Math.random() <= weight) return a;
    return b;
}

class Vector2 {
    public x: number = 0;
    public y: number = 0;
    public get magnitude(): number {
        return Math.abs(Math.sqrt(this.x * this.x + this.y * this.y));
    }
    constructor(arr: [number, number]);
    constructor();
    constructor(arr?: [number, number]) {
        if (arr != undefined) {
            this.x = arr[0];
            this.y = arr[1];
        }
    }
    public distanceTo(b: Vector2): number {
        let a = this;
        return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    public static mul(a: Vector2, b: Vector2): Vector2 {
        return new Vector2([a.x * b.x, a.y * b.y]);
    }
    public static add(a: Vector2, b: Vector2): Vector2 {
        return new Vector2([a.x + b.x, a.y + b.y]);
    }
    public static sub(a: Vector2, b: Vector2): Vector2 {
        return new Vector2([a.x - b.x, a.y - b.y]);
    }
    public static randomInRadius(origin: Vector2, radius: number): Vector2 {
        const a = Math.random() * 2 * Math.PI;
        const r = radius * Math.sqrt(Math.random());
        const x = r * Math.cos(a);
        const y = r * Math.sin(a);
        return Vector2.sub(origin, new Vector2([x, y]));
    }
}

class Actor {
    public position: Vector2 = new Vector2();
    public velocity: Vector2 = new Vector2();
    public mass: number = 15;
}

class Pixol extends Actor {
    public hp: number = 100;
    public sprite: Sprite = Sprite.from("/assets/particle.png");
    constructor() {
        super();
        this.sprite.scale.set(0.05);
    }
    public setPosition(pos: Vector2) {
        this.position = pos;
        this.sprite.position.set(pos.x, pos.y);
    }
    public tick(delta: number) {
        const force = this.mass * 9.80665;
        const pvel = new Vector2([
            this.velocity.x * delta,
            this.velocity.y * delta + force,
        ]);
        this.setPosition(Vector2.add(this.position, pvel));
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
    const MID_POINT = new Vector2([MAX_WIDTH / 2, MAX_HEIGHT / 2]);
    const SPAWN_RATE = 200;

    const particleTex = await Assets.load("/assets/particle.png");

    const pixols: Pixol[] = [];

    for (let i = 0; i < SPAWN_RATE; i++) {
        const pixol = new Pixol();
        pixol.velocity.x = randomPick(1, -1) * randomInRange(1, 0.1);
        pixol.velocity.y = randomPick(1, -1) * randomInRange(1, 0.1);
        pixol.sprite.anchor.set(0.5);
        pixol.setPosition(Vector2.randomInRadius(MID_POINT, 200));
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
                let rem = Math.abs(pixol.position.x);
                pixol.position.x = 0;
                pixol.velocity.x *= -1;
                changed = true;
            } else if (pixol.position.x >= MAX_WIDTH) {
                let rem = Math.sqrt(pixol.position.x - MAX_WIDTH);
                pixol.position.x = MAX_WIDTH - 1;
                pixol.velocity.x = -pixol.velocity.x - rem;
                changed = true;
            } else if (pixol.position.y < 0) {
                let rem = Math.abs(pixol.position.y);
                pixol.position.y = 0;
                pixol.velocity.y = -pixol.velocity.y + rem;
                changed = true;
            } else if (pixol.position.y >= MAX_HEIGHT) {
                let rem = pixol.position.y - MAX_HEIGHT;
                pixol.velocity.y = -pixol.velocity.y - rem;
                pixol.position.y = MAX_HEIGHT - 1;
                changed = true;
            }
            if (changed) {
                pixol.setPosition(pixol.position);
            }
        }
    });
})();

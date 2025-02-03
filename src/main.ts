import "pixi.js/unsafe-eval";
import { Application, Assets, Sprite } from "pixi.js";
import { Vec2 } from "./math";

/*
function randomInRange(max = 1, min = 0): number {
    return Math.round(Math.random() * (max - min) + min);
}

function randomPick<T>(a: T, b: T, weight = 0.5): T {
    if (Math.random() <= weight) return a;
    return b;
}
 */

class ActorTracker {
    public MAX_WIDTH: number = 100;
    public MAX_HEIGHT: number = 100;
    public get BOUNDS(): Vec2 {
        return new Vec2(this.MAX_WIDTH, this.MAX_HEIGHT);
    }
    public get MID_POINT(): Vec2 {
        return new Vec2(this.MAX_WIDTH / 2, this.MAX_HEIGHT / 2);
    }
    private _internal: { [key: string]: { count: number; actors: Actor[] } } =
        {};
    public spawn<T extends Actor>(actor: T): string {
        const id = actor.className;
        if (this._internal[id] == undefined)
            this._internal[id] = { count: 0, actors: [] };
        const n = this._internal[id].count;
        this._internal[id].count += 1;
        this._internal[id].actors.push(actor);
        return `${id}_${n}`;
    }
    public find(predicate: (a: Actor) => boolean): Actor[] {
        const res: Actor[] = [];
        for (const id of Object.keys(this._internal)) {
            for (const actor of this._internal[id].actors) {
                if (predicate(actor)) res.push(actor);
            }
        }
        return res;
    }
    public allOfClass<T extends Actor>(name: string): T[] {
        const res: T[] = [];
        if (this._internal[name] == undefined) return res;
        for (const a of this._internal[name].actors) {
            const b = Actor.cast<T>(name, a);
            if (b == undefined) continue;
            res.push(b);
        }
        return res;
    }
    public *iter(): IterableIterator<Actor> {
        for (const key of Object.keys(this._internal)) {
            for (const actor of this._internal[key].actors) {
                if (actor.isActive) yield actor;
            }
        }
    }
}

let GLOBAL_ACTOR_TRACKER = new ActorTracker();

interface Transform {
    position: Vec2;
    velocity: Vec2;
    rotation: number;
    scale: number;
}

class Actor {
    public position: Vec2 = new Vec2();
    public velocity: Vec2 = new Vec2();
    public rotation: number = 0;
    public scale: number = 1;
    public mass: number = 2;
    public isActive: boolean = true;
    public gravity: number = 0.001;
    public isGravitySource: boolean = false;
    private _id: string = "";
    public get id(): string {
        return this._id;
    }
    constructor();
    constructor(transform: Partial<Transform>);
    constructor(transform: Partial<Transform> = {}) {
        if (transform.position != undefined)
            this.position = transform.position.clone();
        if (transform.rotation != undefined) this.rotation = transform.rotation;
        if (transform.scale != undefined) this.scale = transform.scale;
        if (transform.velocity != undefined)
            this.velocity = transform.velocity.clone();
    }
    public get className(): string {
        return "Actor";
    }
    protected setID(id: string) {
        this._id = id;
    }
    public static getGravityEffect(a: Actor, b: Actor): Vec2 {
        const r = a.position.distanceTo(b.position);
        const accel = b.gravity * (b.mass / Math.pow(r, 2));
        return a.position.directionOf(b.position).multiplyScalar(accel);
    }
    public static spawn(): Actor;
    public static spawn(transform: Partial<Transform>): Actor;
    public static spawn(transform: Partial<Transform> = {}): Actor {
        const a = new Actor(transform);
        a._id = GLOBAL_ACTOR_TRACKER.spawn(a);
        return a;
    }
    public static cast<T extends Actor>(name: string, a: Actor): T | undefined {
        if (a.className == name) return a as T;
    }
    public tick(_delta: number) {}
    public isInBounds(bounds: Vec2): boolean {
        return (
            this.position.x >= 0 &&
            this.position.x < bounds.x &&
            this.position.y >= 0 &&
            this.position.y < bounds.y
        );
    }
}

class Pixol extends Actor {
    public hp: number = 100;
    public sprite: Sprite = Sprite.from("/graviton/assets/particle.png");
    public static override spawn(): Pixol;
    public static override spawn(transform: Partial<Transform>): Pixol;
    public static override spawn(transform: Partial<Transform> = {}): Pixol {
        const a = new Pixol(transform);
        a.sprite.rotation = a.rotation;
        a.sprite.position.set(a.position.x, a.position.y);
        a.sprite.scale.set(a.scale);
        a.sprite.anchor.set(0.5);
        a.setID(GLOBAL_ACTOR_TRACKER.spawn(a));
        return a;
    }
    public override get className(): string {
        return "Pixol";
    }
    public setPosition(pos: Vec2) {
        this.position = pos;
        this.sprite.position.set(pos.x, pos.y);
    }
    public override tick(delta: number) {
        for (const g of GLOBAL_ACTOR_TRACKER.find(
            (a) => a.isGravitySource && a.id != this.id
        )) {
            this.velocity = this.velocity.add(Actor.getGravityEffect(this, g));
        }
        const bounds = GLOBAL_ACTOR_TRACKER.BOUNDS;
        if (!this.isInBounds(bounds)) {
            const old = this.position;
            if (old.x < 0) old.x = 0;
            else if (old.x >= bounds.x) old.x = bounds.x - 1;
            if (old.y < 0) old.y = 0;
            else if (old.y >= bounds.y) old.y = bounds.y - 1;
            if (old.x != this.position.x) this.velocity.x = -this.velocity.x;
            if (old.y != this.position.y) this.velocity.y = -this.velocity.y;
        }
        const pvel = this.velocity.multiplyScalar(delta);
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

    GLOBAL_ACTOR_TRACKER.MAX_HEIGHT = app.screen.height;
    GLOBAL_ACTOR_TRACKER.MAX_WIDTH = app.screen.width;
    const SPAWN_RATE = 1000;

    await Assets.load("/graviton/assets/particle.png");

    for (let i = 0; i < SPAWN_RATE; i++) {
        const pixol = Pixol.spawn({
            position: Vec2.randomInRadius(GLOBAL_ACTOR_TRACKER.MID_POINT, 500),
            scale: 0.05,
        });
        app.stage.addChild(pixol.sprite);
    }

    const pointGrav = Pixol.spawn({
        position: GLOBAL_ACTOR_TRACKER.MID_POINT,
        scale: 0.3,
    });
    pointGrav.isGravitySource = true;
    pointGrav.mass = 5500000;
    pointGrav.sprite.tint = 0x000000;
    pointGrav.sprite.alpha = 0.7;
    app.stage.addChild(pointGrav.sprite);

    window.onresize = (_ev) => {
        app.resize();
        GLOBAL_ACTOR_TRACKER.MAX_WIDTH = app.screen.width;
        GLOBAL_ACTOR_TRACKER.MAX_HEIGHT = app.screen.height;
        pointGrav.setPosition(GLOBAL_ACTOR_TRACKER.MID_POINT);
    };

    // Listen for animate update
    app.ticker.add((time) => {
        for (const pixol of GLOBAL_ACTOR_TRACKER.iter()) {
            pixol.tick(time.deltaTime);
        }
    });
})();

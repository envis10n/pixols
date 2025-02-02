import { Point, PointData } from "pixi.js";

export class Vec2 implements PointData {
    constructor(x: number, y: number);
    constructor();
    constructor(public x: number = 0, public y: number = 0) {}
    public get length(): number {
        return Math.abs(Math.hypot(this.x, this.y));
    }
    public get lengthSquared(): number {
        return Math.pow(this.length, 2);
    }
    public add<T extends PointData>(b: T): Vec2 {
        return new Vec2(this.x + b.x, this.y + b.y);
    }
    public sub<T extends PointData>(b: T): Vec2 {
        return new Vec2(this.x - b.x, this.y - b.y);
    }
    public multiply<T extends PointData>(b: T): Vec2 {
        return new Vec2(this.x * b.x, this.y * b.y);
    }
    public multiplyScalar(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }
    public dot<T extends PointData>(b: T): number {
        return this.x * b.x + this.y * b.y;
    }
    public distanceTo<T extends PointData>(b: T): number {
        return this.sub(b).length;
    }
    public clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }
    public static from<T extends PointData>(b: T): Vec2 {
        return new Vec2(b.x, b.y);
    }
    public asPoint(): Point {
        return new Point(this.x, this.y);
    }
}

class Curve {
    constructor(points) {
        this.points = points;
    }

    pointAt(t) {
  
        return { x: 0, y: 0 };
    }
}

class BezierCurve extends Curve {
    constructor(points) {
        super(points);
    }

    pointAt(t) {
        let c = { x: 0, y: 0 };
        const n = this.points.length - 1;
        for (let i = 0; i <= n; i++) {
            const b = this.bernstein(i, n, t);
            c.x += this.points[i].x * b;
            c.y += this.points[i].y * b;
        }
        return c;
    }

    bernstein(i, n, t) {
        return this.binomialCoefficient(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
    }

    binomialCoefficient(n, k) {
        if (k < 0 || k > n) return 0;
        if (k === 0 || k === n) return 1;
        k = Math.min(k, n - k);
        let c = 1;
        for (let i = 0; i < k; i++) {
            c = c * (n - i) / (i + 1);
        }
        return c;
    }
}

class LinearCurve extends Curve {
    constructor(points) {
        super(points);
    }

    pointAt(t) {
        const n = this.points.length - 1;
        const index = Math.floor(t * n);
        const nextIndex = Math.min(index + 1, n);
        const progress = (t * n) - index;

        const x = this.points[index].x * (1 - progress) + this.points[nextIndex].x * progress;
        const y = this.points[index].y * (1 - progress) + this.points[nextIndex].y * progress;

        return { x, y };
    }
}

class CatmullRomCurve extends Curve {
    constructor(points) {
        super(points);
    }

    pointAt(t) {
        const p0 = this.points[0];
        const p1 = this.points[1];
        const p2 = this.points[2] || p1;
        const p3 = this.points[3] || p2;

        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * ((2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

        const y = 0.5 * ((2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

        return { x, y };
    }
}

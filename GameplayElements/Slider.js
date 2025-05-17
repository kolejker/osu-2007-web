import Hitcircle from './Hitcircle.js';

export default class Slider {
    constructor(x, y, curvePoints, duration, curveType = 'B', slides = 1, length = 100) {
        this.x = x;
        this.y = y;
        this.curvePoints = curvePoints;
        this.duration = duration;
        this.curveType = curveType;
        this.slides = slides;
        this.length = length;
        
        this.sliderGraphics = new PIXI.Graphics();
        this.hitcircle = new Hitcircle();
        this.hitcircleSpawned = false;
        this.hasBeenDrawn = false;
    }

    drawSlider(container, remainingTime, cs = 5, ar = 5) {
        if (!this.hitcircleSpawned) {
            this.hitcircle.updateCircleSize(cs);
            this.hitcircle.setApproachRate(ar);
            this.hitcircle.drawCircle(container, this.x, this.y, remainingTime);
            this.hitcircleSpawned = true;
        }
        
        this.sliderGraphics.clear();
        this.sliderGraphics.lineStyle(20, 0x00FF00); 
        this.sliderGraphics.moveTo(this.x, this.y);

        if (this.curveType === 'L') {
            this.curvePoints.forEach(point => {
                this.sliderGraphics.lineTo(point.x, point.y);
            });
        } else if (this.curveType === 'B') {
            this.drawBezierCurve();
        } else if (this.curveType === 'P') {
            this.drawCatmullRomCurve();
        }

        container.addChild(this.sliderGraphics);
        this.hasBeenDrawn = true;
    }

    drawBezierCurve() {
        const points = [{ x: this.x, y: this.y }, ...this.curvePoints];
        
        if (points.length < 3) return;
        
        const step = 0.01;
        let prevX = this.x;
        let prevY = this.y;
        
        for (let t = step; t <= 1; t += step) {
            const point = this.calculateBezierPoint(t, points);
            this.sliderGraphics.lineTo(point.x, point.y);
            prevX = point.x;
            prevY = point.y;
        }
    }

    calculateBezierPoint(t, points) {
        let tempPoints = [...points];
        const n = points.length;
        
        for (let r = 1; r < n; r++) {
            for (let i = 0; i < n - r; i++) {
                tempPoints[i] = {
                    x: (1 - t) * tempPoints[i].x + t * tempPoints[i + 1].x,
                    y: (1 - t) * tempPoints[i].y + t * tempPoints[i + 1].y
                };
            }
        }
        
        return tempPoints[0];
    }


    drawCatmullRomCurve() {
        const points = [{ x: this.x, y: this.y }, ...this.curvePoints];
        
        if (points.length < 4) {
            this.drawBezierCurve(); 
            return;
        }
        
        for (let i = 0; i < points.length - 3; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const p2 = points[i + 2];
            const p3 = points[i + 3];
            
            for (let t = 0; t <= 1; t += 0.01) {
                const t2 = t * t;
                const t3 = t2 * t;
                
                const x = 0.5 * ((2 * p1.x) + 
                                (-p0.x + p2.x) * t + 
                                (2*p0.x - 5*p1.x + 4*p2.x - p3.x) * t2 + 
                                (-p0.x + 3*p1.x - 3*p2.x + p3.x) * t3);
                                
                const y = 0.5 * ((2 * p1.y) + 
                                (-p0.y + p2.y) * t + 
                                (2*p0.y - 5*p1.y + 4*p2.y - p3.y) * t2 + 
                                (-p0.y + 3*p1.y - 3*p2.y + p3.y) * t3);
                
                this.sliderGraphics.lineTo(x, y);
            }
        }
    }

    updateSlider(progress) {
        if (progress < 0 || progress > 1) return;
        
    }

    removeSlider(container) {
        container.removeChild(this.sliderGraphics);
        this.sliderGraphics.clear();
    }
}
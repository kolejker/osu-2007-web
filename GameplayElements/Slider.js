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
        this.endHitcircle = new Hitcircle();
        this.hitcircleSpawned = false;
        this.hasBeenDrawn = false;

        this.sliderBall = null;
        this.sliderPoints = [];
        this.sliderPathLength = 0;
        this.sliderSegmentLengths = [];
        this.sliderCumulativeLengths = [];
        this.currentTime = 0;
        this.ballContainer = new PIXI.Container();

        this.mainContainer = new PIXI.Container();
        
        this.preempt = 0;
        this.fadeIn = 0;
        this.startTime = 0;
    }

    drawSlider(container, remainingTime, cs = 5, ar = 5) {
        this.sliderGraphics.clear();
    
        const baseRadius = 54.4 - 4.48 * cs;
        const trackWidth = baseRadius * 1.5;
        const outlineWidth = trackWidth + 8;
    
        this.sliderGraphics.lineStyle(outlineWidth, 0xFFFFFF, 1);
        this.sliderGraphics.moveTo(this.x, this.y);
        this.sliderPoints = [{ x: this.x, y: this.y }];
        this.sliderSegmentLengths = [];
        this.sliderCumulativeLengths = [0];
        this.sliderPathLength = 0;
    
        if (this.curveType === 'L') this.drawLinearCurve();
        else if (this.curveType === 'B') this.drawBezierCurve();
        else if (this.curveType === 'C') this.drawCatmullRomCurve();
    
        this.sliderGraphics.lineStyle(trackWidth, 0x00FF00, 0.5);
        this.sliderGraphics.moveTo(this.sliderPoints[0].x, this.sliderPoints[0].y);
        for (let i = 1; i < this.sliderPoints.length; i++) {
            this.sliderGraphics.lineTo(this.sliderPoints[i].x, this.sliderPoints[i].y);
        }
    
        this.calculateCumulativeLengths();

        if (this.mainContainer.parent) {
            container.removeChild(this.mainContainer);
        }

        this.mainContainer = new PIXI.Container();
        container.addChild(this.mainContainer);

        this.mainContainer.addChild(this.sliderGraphics);

        this.createSliderBall(this.mainContainer, cs);

        if (this.sliderPoints.length > 0) {
            const endPoint = this.sliderPoints[this.sliderPoints.length - 1];
            this.createEndHitCircle(this.mainContainer, endPoint.x, endPoint.y, cs);
        }

        this.hitcircle.updateCircleSize(cs);
        this.hitcircle.setApproachRate(ar);
        this.preempt = this.hitcircle.preempt;
        this.fadeIn = this.hitcircle.fadeIn;
        
        const initialOpacity = Math.min(1.0, (this.preempt - remainingTime) / this.fadeIn);
        this.mainContainer.alpha = initialOpacity;
        
        this.startTime = Date.now();
        this.remainingTime = remainingTime;
        
        this.setupFadeInAnimation();

        if (!this.hitcircleSpawned) {
            this.hitcircle.drawCircle(this.mainContainer, this.x, this.y, remainingTime);
            this.hitcircleSpawned = true;
        }

        this.hasBeenDrawn = true;
    }
    
    setupFadeInAnimation() {
        const startTime = this.startTime;
        const fadeInAnimation = () => {
            const elapsed = Date.now() - startTime;
            const currentTimeUntilHit = this.remainingTime - elapsed;
            
            if (currentTimeUntilHit <= 0) {
                this.mainContainer.alpha = 1.0;
                return;
            }
            
            if (currentTimeUntilHit > this.preempt - this.fadeIn) {
                const fadeProgress = (this.preempt - currentTimeUntilHit) / this.fadeIn;
                this.mainContainer.alpha = Math.min(1.0, fadeProgress);
                requestAnimationFrame(fadeInAnimation);
            } else {
                this.mainContainer.alpha = 1.0;
            }
        };
        
        requestAnimationFrame(fadeInAnimation);
    }

    drawLinearCurve() {
        const numSegments = 50;

        for (let i = 1; i < this.curvePoints.length + 1; i++) {
            const startPoint = i === 1 ? { x: this.x, y: this.y } : this.curvePoints[i - 2];
            const endPoint = this.curvePoints[i - 1];

            for (let j = 0; j < numSegments; j++) {
                const t = j / numSegments;
                const x = startPoint.x + (endPoint.x - startPoint.x) * t;
                const y = startPoint.y + (endPoint.y - startPoint.y) * t;

                if (j === 0 && i === 1) {
                } else {
                    this.sliderGraphics.lineTo(x, y);
                }

                if (!(j === 0 && i === 1)) {
                    this.sliderPoints.push({ x, y });

                    const lastPoint = this.sliderPoints[this.sliderPoints.length - 2];
                    const segmentLength = Math.sqrt(
                        Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2)
                    );

                    this.sliderSegmentLengths.push(segmentLength);
                    this.sliderPathLength += segmentLength;
                }
            }
        }
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
            this.sliderPoints.push({ x: point.x, y: point.y });

            const segmentLength = Math.sqrt(
                Math.pow(point.x - prevX, 2) + Math.pow(point.y - prevY, 2)
            );

            this.sliderSegmentLengths.push(segmentLength);
            this.sliderPathLength += segmentLength;

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

        let prevX = this.x;
        let prevY = this.y;

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
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

                const y = 0.5 * ((2 * p1.y) +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

                this.sliderGraphics.lineTo(x, y);
                this.sliderPoints.push({ x, y });

                const segmentLength = Math.sqrt(
                    Math.pow(x - prevX, 2) + Math.pow(y - prevY, 2)
                );

                this.sliderSegmentLengths.push(segmentLength);
                this.sliderPathLength += segmentLength;

                prevX = x;
                prevY = y;
            }
        }
    }

    calculateCumulativeLengths() {
        let totalLength = 0;

        for (let i = 0; i < this.sliderSegmentLengths.length; i++) {
            totalLength += this.sliderSegmentLengths[i];
            this.sliderCumulativeLengths.push(totalLength);
        }
    }

    getPositionAtDistance(distance) {
        distance = Math.max(0, Math.min(distance, this.sliderPathLength));

        let low = 0;
        let high = this.sliderCumulativeLengths.length - 1;
        let mid;

        while (low <= high) {
            mid = Math.floor((low + high) / 2);

            if (this.sliderCumulativeLengths[mid] < distance) {
                low = mid + 1;
            } else if (mid > 0 && this.sliderCumulativeLengths[mid - 1] > distance) {
                high = mid - 1;
            } else {
                break;
            }
        }

        const segmentIndex = mid > 0 ? mid - 1 : 0;
        const segmentStartDistance = segmentIndex > 0 ? this.sliderCumulativeLengths[segmentIndex - 1] : 0;
        const segmentEndDistance = this.sliderCumulativeLengths[segmentIndex];
        const segmentLength = this.sliderSegmentLengths[segmentIndex];

        if (segmentLength === 0) {
            return this.sliderPoints[segmentIndex];
        }

        let segmentProgress = (distance - segmentStartDistance) / segmentLength;
        segmentProgress = Math.max(0, Math.min(1, segmentProgress));

        const p1 = this.sliderPoints[segmentIndex];
        const p2 = this.sliderPoints[segmentIndex + 1];

        return {
            x: p1.x + (p2.x - p1.x) * segmentProgress,
            y: p1.y + (p2.y - p1.y) * segmentProgress
        };
    }

    createEndHitCircle(container, x, y, cs) {
        if (this.endCircle) {
            if (this.endCircle.parent) {
                container.removeChild(this.endCircle);
            }
        }

        this.endCircle = new PIXI.Container();

        const radius = 54.4 - 4.48 * cs;

        const hitCircleTexture = PIXI.Texture.from('Resources/hitcircle.png');
        const hitCircleOverlayTexture = PIXI.Texture.from('Resources/hitcircleoverlay.png');

        const circleSprite = new PIXI.Sprite(hitCircleTexture);
        circleSprite.anchor.set(0.5);
        circleSprite.x = 0;
        circleSprite.y = 0;

        const overlaySprite = new PIXI.Sprite(hitCircleOverlayTexture);
        overlaySprite.anchor.set(0.5);
        overlaySprite.x = 0;
        overlaySprite.y = 0;

        const scaleFactor = radius / (hitCircleTexture.width / 2);
        circleSprite.scale.set(scaleFactor);
        overlaySprite.scale.set(scaleFactor);

        this.endCircle.addChild(circleSprite);
        this.endCircle.addChild(overlaySprite);

        this.endCircle.x = x;
        this.endCircle.y = y;

        container.addChild(this.endCircle);
    }
    createSliderBall(container, cs) {
        if (!this.ballContainer.parent) {
            container.addChild(this.ballContainer);
        } else {
            while (this.ballContainer.children.length > 0) {
                this.ballContainer.removeChildAt(0);
            }
        }
    
        const baseRadius = 54.4 - 4.48 * cs;
        const sliderBallTexture = PIXI.Texture.from('Resources/sliderb0.png');
        this.sliderBall = new PIXI.Sprite(sliderBallTexture);
        this.sliderBall.anchor.set(0.5);
        
        if (sliderBallTexture.valid) {
            const scaleFactor = baseRadius / (sliderBallTexture.width / 2);
            this.sliderBall.scale.set(scaleFactor);
        } else {
            this.sliderBall.scale.set(0.5);
            sliderBallTexture.once('update', () => {
                const scaleFactor = baseRadius / (sliderBallTexture.width / 2);
                this.sliderBall.scale.set(scaleFactor);
            });
        }
    
        this.sliderBall.x = this.x;
        this.sliderBall.y = this.y;
    
        this.ballContainer.addChild(this.sliderBall);
    }
    
    updateSlider(progress) {
        if (!this.sliderBall || progress < 0 || progress > 1 || this.sliderPathLength === 0) return;

        let effectiveProgress = progress * this.slides;
        let isReverse = Math.floor(effectiveProgress) % 2 === 1;
        let localProgress = effectiveProgress % 1;

        if (isReverse) {
            localProgress = 1 - localProgress;
        }

        const distance = localProgress * this.sliderPathLength;

        const position = this.getPositionAtDistance(distance);

        this.sliderBall.x = position.x;
        this.sliderBall.y = position.y;

        if (this.hitcircle && this.hitcircle.circleContainer && this.hitcircle.circleContainer.parent) {
            this.mainContainer.removeChild(this.hitcircle.circleContainer);
            this.mainContainer.addChild(this.hitcircle.circleContainer);
        }
    }

    removeSlider(container) {
        if (this.mainContainer && this.mainContainer.parent) {
            container.removeChild(this.mainContainer);
        }

        if (this.sliderGraphics) {
            this.sliderGraphics.clear();
        }
    }
}
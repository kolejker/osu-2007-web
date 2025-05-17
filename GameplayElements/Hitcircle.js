export default class Hitcircle {
    constructor(cs = 5, ar = 5) {
        this.hitCircleTexture = PIXI.Texture.from('Resources/hitcircle.png');
        this.hitCircleOverlayTexture = PIXI.Texture.from('Resources/hitcircleoverlay.png');
        this.approachCircleTexture = PIXI.Texture.from('Resources/approachcircle.png');
        this.circleSize = cs;
        this.radius = this.calculateRadius(cs);
        this.setApproachRate(ar);
    }

    calculateRadius(cs) {
        return 54.4 - 4.48 * cs;
    }

    updateCircleSize(cs) {
        this.circleSize = cs;
        this.radius = this.calculateRadius(cs);
    }

    setApproachRate(ar) {
        this.approachRate = ar;
        this.preempt = this.calculatePreempt(ar);
        this.fadeIn = this.calculateFadeIn(ar);
    }

    calculatePreempt(ar) {
        if (ar < 5) {
            return 1200 + 600 * (5 - ar) / 5;
        } else {
            return 1200 - 750 * (ar - 5) / 5;
        }
    }

    calculateFadeIn(ar) {
        if (ar < 5) {
            return 800 + 400 * (5 - ar) / 5;
        } else {
            return 800 - 500 * (ar - 5) / 5;
        }
    }

    drawCircle(container, x, y, timeUntilHit) {
        if (timeUntilHit <= 0) {
            return null;
        }

        const hitCircleSprite = new PIXI.Sprite(this.hitCircleTexture);
        hitCircleSprite.anchor.set(0.5);
        hitCircleSprite.x = x;
        hitCircleSprite.y = y;

        const overlaySprite = new PIXI.Sprite(this.hitCircleOverlayTexture);
        overlaySprite.anchor.set(0.5);
        overlaySprite.x = x;
        overlaySprite.y = y;

        const scaleFactor = this.radius / (this.hitCircleTexture.width / 2);
        hitCircleSprite.scale.set(scaleFactor);
        overlaySprite.scale.set(scaleFactor);

        const initialOpacity = Math.min(1.0, (this.preempt - timeUntilHit) / this.fadeIn);
        hitCircleSprite.alpha = initialOpacity;
        overlaySprite.alpha = initialOpacity;

        const approachCircleSprite = this.drawApproachCircle(container, x, y, timeUntilHit);

        container.addChild(hitCircleSprite);
        container.addChild(overlaySprite);

        const startTime = Date.now();
        const update = () => {
            const elapsed = Date.now() - startTime;
            const currentTimeUntilHit = timeUntilHit - elapsed;
            
            if (currentTimeUntilHit <= 0) {
                container.removeChild(hitCircleSprite);
                container.removeChild(overlaySprite);
                if (approachCircleSprite && approachCircleSprite.parent) {
                    container.removeChild(approachCircleSprite);
                }
                return;
            }
            
            if (currentTimeUntilHit > this.preempt - this.fadeIn) {
                const fadeProgress = (this.preempt - currentTimeUntilHit) / this.fadeIn;
                hitCircleSprite.alpha = Math.min(1.0, fadeProgress);
                overlaySprite.alpha = Math.min(1.0, fadeProgress);
            }
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
        
        return {
            hitCircleSprite,
            overlaySprite,
            approachCircleSprite
        };
    }

    drawApproachCircle(container, x, y, timeUntilHit) {
        if (timeUntilHit <= 0 || timeUntilHit > this.preempt) {
            return null;
        }

        const approachCircleSprite = new PIXI.Sprite(this.approachCircleTexture);
        approachCircleSprite.anchor.set(0.5);
        approachCircleSprite.x = x;
        approachCircleSprite.y = y;

        const finalScaleFactor = this.radius / (this.approachCircleTexture.width / 2);
        
        const initialScaleFactor = finalScaleFactor * 3.0; 
        
        const timeProgress = Math.max(0, (this.preempt - timeUntilHit) / this.preempt);
        const currentScale = initialScaleFactor - (initialScaleFactor - finalScaleFactor) * timeProgress;
        approachCircleSprite.scale.set(currentScale);
        
        if (timeUntilHit > this.preempt - this.fadeIn) {
            const fadeProgress = (this.preempt - timeUntilHit) / this.fadeIn;
            approachCircleSprite.alpha = Math.min(1.0, fadeProgress);
        } else {
            approachCircleSprite.alpha = 1.0;
        }

        container.addChild(approachCircleSprite);

        const startTime = Date.now();
        const animateShrink = () => {
            const elapsed = Date.now() - startTime;
            const currentTimeUntilHit = timeUntilHit - elapsed;
            
            if (currentTimeUntilHit <= 0) {
                if (approachCircleSprite.parent) {
                    container.removeChild(approachCircleSprite);
                }
                return;
            }
            
            const timeProgress = Math.min(1.0, Math.max(0, (this.preempt - currentTimeUntilHit) / this.preempt));
            
            const scaleFactor = initialScaleFactor - (initialScaleFactor - finalScaleFactor) * timeProgress;
            approachCircleSprite.scale.set(scaleFactor);
            
            if (currentTimeUntilHit > this.preempt - this.fadeIn) {
                const fadeProgress = (this.preempt - currentTimeUntilHit) / this.fadeIn;
                approachCircleSprite.alpha = Math.min(1.0, fadeProgress);
            }
            
            requestAnimationFrame(animateShrink);
        };

        animateShrink();
        return approachCircleSprite;
    }
}
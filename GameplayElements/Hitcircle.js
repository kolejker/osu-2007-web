export default class Hitcircle {
    
    constructor(cs = 5, ar = 5) {
        this.hitCircleTexture = PIXI.Texture.from('Resources/hitcircle.png');
        this.hitCircleOverlayTexture = PIXI.Texture.from('Resources/hitcircleoverlay.png');
        this.approachCircleTexture = PIXI.Texture.from('Resources/approachcircle.png');
        this.circleSize = cs;
        this.radius = this.calculateRadius(cs);
        this.setApproachRate(ar);
        const HIT_WINDOWS = {
            300: 50, 
            100: 100, 
            50: 150  
        };
        
        this.hitValue = 0;
        this.isHit = false;
        this.hitText = new PIXI.Text('', { fontSize: 24, fill: 0xffffff });
        this.hitText.anchor.set(0.5);
        this.hitText.visible = false;
        container.addChild(this.hitText);
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

    drawCircle(container, x, y, remainingTime) {
        const circleSprite = new PIXI.Sprite(this.hitCircleTexture);
        circleSprite.anchor.set(0.5);
        circleSprite.x = x;
        circleSprite.y = y;
    
        const overlaySprite = new PIXI.Sprite(this.hitCircleOverlayTexture);
        overlaySprite.anchor.set(0.5);
        overlaySprite.x = x;
        overlaySprite.y = y;
    
        const scaleFactor = this.radius / (this.hitCircleTexture.width / 3);
        circleSprite.scale.set(scaleFactor);
        overlaySprite.scale.set(scaleFactor);
    
        const approachCircleSprite = this.drawApproachCircle(container, x, y, remainingTime);
    
        container.addChild(circleSprite);
        container.addChild(overlaySprite);
    
        const startTime = Date.now();
        const hitTime = startTime + remainingTime; 


        circleSprite.interactive = true;
        circleSprite.buttonMode = true;
        circleSprite.on('pointerdown', () => this.handleClick(hitTime, container, circleSprite, overlaySprite, approachCircleSprite));
    
        const update = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < remainingTime) {
                requestAnimationFrame(update);
            } else {

                this.miss(container, circleSprite, overlaySprite, approachCircleSprite);
            }
        };
        requestAnimationFrame(update);
    }

    handleClick(hitTime, container, circleSprite, overlaySprite, approachCircleSprite) {
        const currentTime = Date.now();
        const hitDifference = Math.abs(currentTime - hitTime);

        if (hitDifference <= HIT_WINDOWS[300]) {
            this.hitValue = 300;
            this.hit(container, circleSprite, overlaySprite, approachCircleSprite);
        } else if (hitDifference <= HIT_WINDOWS[100]) {
            this.hitValue = 100;
            this.hit(container, circleSprite, overlaySprite, approachCircleSprite);
        } else if (hitDifference <= HIT_WINDOWS[50]) {
            this.hitValue = 50;
            this.hit(container, circleSprite, overlaySprite, approachCircleSprite);
        } else {
            this.hitValue = 0;
            this.miss(container, circleSprite, overlaySprite, approachCircleSprite);
        }
    }

    hit(container, circleSprite, overlaySprite, approachCircleSprite) {
        if (this.isHit) return;
        this.isHit = true;
        console.log(`Hit Value: ${this.hitValue}`);

        this.hitText.text = this.hitValue > 0 ? this.hitValue.toString() : '';
        this.hitText.position.set(circleSprite.x, circleSprite.y - 50);
        this.hitText.visible = true;

        gsap.to(this.hitText, { alpha: 0, y: this.hitText.y - 50, duration: 1, onComplete: () => {
            container.removeChild(this.hitText);
        }});

        gsap.to(circleSprite.scale, { x: 1.6, y: 1.6, duration: 0.2 });
        gsap.to(circleSprite, { alpha: 0, duration: 0.5, delay: 0.2, onComplete: () => {
            container.removeChild(circleSprite);
            container.removeChild(overlaySprite);
            container.removeChild(approachCircleSprite);
        }});
    }

    miss(container, circleSprite, overlaySprite, approachCircleSprite) {
        console.log('Miss!');

        this.hitText.text = 'Miss';
        this.hitText.position.set(circleSprite.x, circleSprite.y - 50);
        this.hitText.visible = true;
        gsap.to(this.hitText, { alpha: 0, y: this.hitText.y - 50, duration: 1, onComplete: () => {
            container.removeChild(this.hitText);
        }});

        gsap.to(circleSprite, { alpha: 0, duration: 0.5, onComplete: () => {
            container.removeChild(circleSprite);
            container.removeChild(overlaySprite);
            container.removeChild(approachCircleSprite);
        }});
    }

    drawApproachCircle(container, x, y, remainingTime) {
        const approachCircleSprite = new PIXI.Sprite(this.approachCircleTexture);
        approachCircleSprite.anchor.set(0.5);
        approachCircleSprite.x = x;
        approachCircleSprite.y = y;
    
        const initialScaleFactor = 3.0;
        const finalScaleFactor = this.radius / (this.approachCircleTexture.width / 0.12);
        approachCircleSprite.scale.set(initialScaleFactor);
    
        container.addChild(approachCircleSprite);
    
        const startTime = Date.now();
        const animateShrink = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / remainingTime;  
    
            const scaleFactor = initialScaleFactor - (initialScaleFactor - finalScaleFactor) * progress;
    
            approachCircleSprite.scale.set(Math.max(scaleFactor, finalScaleFactor));
    
            if (progress < 1) {
                requestAnimationFrame(animateShrink);
            } else {
                container.removeChild(approachCircleSprite);
            }
        };
    
        animateShrink();
        return approachCircleSprite;
    }
}

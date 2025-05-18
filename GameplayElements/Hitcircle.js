import PlayfieldScaler from '../Helpers/OsuPixels.js';

export default class Hitcircle {
    constructor(cs = 5, ar = 5, od = 5) {
        this.hitCircleTexture = PIXI.Texture.from('Resources/hitcircle.png');
        this.hitCircleOverlayTexture = PIXI.Texture.from('Resources/hitcircleoverlay.png');
        this.approachCircleTexture = PIXI.Texture.from('Resources/approachcircle.png');
        this.circleSize = cs;
        this.overallDifficulty = od;
        
        this.playfieldScaler = new PlayfieldScaler();
        
        this.radius = this.calculateRadius(cs);
        this.setApproachRate(ar);
        this.setupHitWindows(od);
        
        this.hitBurstTexture = PIXI.Texture.from('Resources/hit300.png'); 
        this.hitBurstTexture300 = PIXI.Texture.from('Resources/hit300.png');
        this.hitBurstTexture100 = PIXI.Texture.from('Resources/hit100.png');
        this.hitBurstTexture50 = PIXI.Texture.from('Resources/hit50.png');
        this.hitBurstTextureMiss = PIXI.Texture.from('Resources/hit0.png');
    }

    calculateRadius(cs) {
        const baseRadius = 54.4 - 4.48 * cs;
        
        return this.playfieldScaler.mapSize(baseRadius);
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

    setupHitWindows(od) {
        this.overallDifficulty = od;
        
        this.hitWindow300 = 80 - 6 * od;  
        this.hitWindow100 = 140 - 8 * od; 
        this.hitWindow50 = 200 - 10 * od; 
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

    drawCircle(container, x, y, timeUntilHit, hitObject) {
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

        const circleContainer = new PIXI.Container();
        circleContainer.x = x;
        circleContainer.y = y;
        
        hitCircleSprite.x = 0;
        hitCircleSprite.y = 0;
        overlaySprite.x = 0;
        overlaySprite.y = 0;
        if (approachCircleSprite) {
            approachCircleSprite.x = 0;
            approachCircleSprite.y = 0;
        }
        
        circleContainer.addChild(hitCircleSprite);
        circleContainer.addChild(overlaySprite);
        if (approachCircleSprite) {
            circleContainer.addChild(approachCircleSprite);
        }
        
        circleContainer.interactive = true;
        circleContainer.buttonMode = true;

        const hitTime = Date.now() + timeUntilHit;
        let hasBeenHit = false;
        
        const hitArea = new PIXI.Circle(0, 0, this.radius);
        circleContainer.hitArea = hitArea;
        
        circleContainer.on('pointerdown', () => {
            if (hasBeenHit) return;
            
            const currentTime = Date.now();
            const hitError = currentTime - hitTime;
            
            let hitScore = this.calculateScore(hitError);
            
            if (hitScore) {
                hasBeenHit = true;
                this.playHitAnimation(container, x, y, hitScore, circleContainer);
                
                const scoreEvent = new CustomEvent('hitscored', {
                    detail: {
                        score: hitScore,
                        hitObject: hitObject,
                        hitError: hitError
                    }
                });
                window.dispatchEvent(scoreEvent);
            }
        });

        container.addChild(circleContainer);

        const startTime = Date.now();
        let isRemoved = false;
        
        const update = () => {
            if (isRemoved) return;
            
            const elapsed = Date.now() - startTime;
            const currentTimeUntilHit = timeUntilHit - elapsed;
            
            if (currentTimeUntilHit < -this.hitWindow50 && !hasBeenHit) {
                hasBeenHit = true;
                this.playHitAnimation(container, x, y, 'miss', circleContainer);
                
                const missEvent = new CustomEvent('hitscored', {
                    detail: {
                        score: 'miss',
                        hitObject: hitObject,
                        hitError: this.hitWindow50
                    }
                });
                window.dispatchEvent(missEvent);
            }
            
            if (hasBeenHit || currentTimeUntilHit < -this.hitWindow50 * 2) {
                if (circleContainer.parent) {
                    container.removeChild(circleContainer);
                }
                isRemoved = true;
                return;
            }
            
            if (currentTimeUntilHit > 0 && currentTimeUntilHit > this.preempt - this.fadeIn) {
                const fadeProgress = (this.preempt - currentTimeUntilHit) / this.fadeIn;
                hitCircleSprite.alpha = Math.min(1.0, fadeProgress);
                overlaySprite.alpha = Math.min(1.0, fadeProgress);
            }
            
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
        
        return {
            circleContainer,
            hitCircleSprite,
            overlaySprite,
            approachCircleSprite,
            hitTime
        };
    }

    calculateScore(hitError) {
        const absError = Math.abs(hitError);
        
        if (absError <= this.hitWindow300) {
            return '300';
        } else if (absError <= this.hitWindow100) {
            return '100';
        } else if (absError <= this.hitWindow50) {
            return '50';
        } else {
            return 'miss';
        }
    }

    playHitAnimation(container, x, y, score, circleContainer) {
        // Select the appropriate texture based on the score
        let texture;
        switch (score) {
            case '300':
                texture = this.hitBurstTexture300;
                break;
            case '100':
                texture = this.hitBurstTexture100;
                break;
            case '50':
                texture = this.hitBurstTexture50;
                break;
            case 'miss':
                texture = this.hitBurstTextureMiss;
                break;
            default:
                texture = this.hitBurstTexture300;
        }

        const hitBurst = new PIXI.Sprite(texture);
        hitBurst.anchor.set(0.5);
        hitBurst.x = x;
        hitBurst.y = y;
        hitBurst.scale.set(0.8); 
        hitBurst.alpha = 1.0;
        
        container.addChild(hitBurst);
        
        if (circleContainer && score !== 'miss') {
            gsap.to(circleContainer.scale, {
                x: 1.5,
                y: 1.5,
                duration: 0.2,
                ease: "power2.out"
            });
            
            gsap.to(circleContainer, {
                alpha: 0,
                duration: 0.2,
                ease: "power2.out"
            });
        }
        
        gsap.to(hitBurst.scale, {
            x: 1.2,
            y: 1.2,
            duration: 0.5,
            ease: "power2.out"
        });
        
        gsap.to(hitBurst, {
            alpha: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {
                if (hitBurst.parent) {
                    container.removeChild(hitBurst);
                }
            }
        });
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
    
    updatePlayfieldScaler(width, height) {
        this.playfieldScaler.updateScreenSize(width, height);
        this.radius = this.calculateRadius(this.circleSize);
    }
}
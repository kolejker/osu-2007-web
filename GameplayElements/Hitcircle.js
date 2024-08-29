export default class Hitcircle {
    constructor(cs = 5) {
        this.hitCircleTexture = PIXI.Texture.from('Resources/hitcircle.png');
        this.hitCircleOverlayTexture = PIXI.Texture.from('Resources/hitcircleoverlay.png');
        this.approachCircleTexture = PIXI.Texture.from('Resources/approachcircle.png');
        this.circleSize = cs;
        this.radius = this.calculateRadius(cs);
    }

    calculateRadius(cs) {
        return 54.4 - 4.48 * cs;
    }

    updateCircleSize(cs) {
        this.circleSize = cs;
        this.radius = this.calculateRadius(cs);
    }

    drawCircle(container, x, y, remainingTime, preempt) {
        const circleSprite = new PIXI.Sprite(this.hitCircleTexture);
        circleSprite.anchor.set(0.5);
        circleSprite.x = x;
        circleSprite.y = y;

        const overlaySprite = new PIXI.Sprite(this.hitCircleOverlayTexture);
        overlaySprite.anchor.set(0.5);
        overlaySprite.x = x;
        overlaySprite.y = y;

        const scaleFactor = this.radius / (this.hitCircleTexture.width / 2);
        circleSprite.scale.set(scaleFactor);
        overlaySprite.scale.set(scaleFactor);
        const approachCircleSprite = this.drawApproachCircle(container, x, y, remainingTime, preempt);

        container.addChild(circleSprite);
        container.addChild(overlaySprite);

        const startTime = Date.now();
        const update = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < remainingTime) {
                requestAnimationFrame(update);
            } else {
                container.removeChild(circleSprite);
                container.removeChild(overlaySprite);
                container.removeChild(approachCircleSprite);
            }
        };
        requestAnimationFrame(update);
    }

    drawApproachCircle(container, x, y, remainingTime, preempt) {
        const approachCircleSprite = new PIXI.Sprite(this.approachCircleTexture);
        approachCircleSprite.anchor.set(0.5);
        approachCircleSprite.x = x;
        approachCircleSprite.y = y;

        const initialScaleFactor = 2.0; 
        const finalScaleFactor = this.radius / (this.approachCircleTexture.width / 0.17); 
        approachCircleSprite.scale.set(initialScaleFactor);

        container.addChild(approachCircleSprite);

        const startTime = Date.now();
        const animateShrink = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / preempt;
            const scaleFactor = initialScaleFactor - (initialScaleFactor - finalScaleFactor) * progress;

            approachCircleSprite.scale.set(Math.max(scaleFactor, finalScaleFactor));

            if (progress < 1) {
                requestAnimationFrame(animateShrink);
            }
        };

        animateShrink();
        return approachCircleSprite;
    }
}

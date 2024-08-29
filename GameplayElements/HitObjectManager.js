
import Hitcircle from './Hitcircle.js';
import Slider from './Slider.js';

export default class HitObjectManager {
    constructor(hitObjects, difficulty) {
        this.hitObjects = hitObjects;
        this.circleSize = difficulty.CircleSize;
        this.overallDifficulty = difficulty.OverallDifficulty;
        this.hitCircle = new Hitcircle();
        this.hitCircle.updateCircleSize(this.circleSize);
        this.hitCircle.setApproachRate(this.overallDifficulty);
    }

    startRendering(container) {
        this.startTime = Date.now();
        PIXI.Ticker.shared.add(() => this.renderHitObjects(container));
    }

    renderHitObjects(container) {
        const currentTime = Date.now() - this.startTime;

        this.hitObjects.forEach(obj => {
            if (obj.time - 1500 <= currentTime && obj.time + 500 >= currentTime) {
                if (!obj.hasBeenDrawn) {
                    if (obj.type === 'circle') {
                        this.hitCircle.drawCircle(container, obj.x, obj.y, obj.time - currentTime);
                    } else if (obj.type === 'slider') {
                        const progress = (currentTime - obj.time + 1500) / 2000;
                        if (!obj.slider) {
                            obj.slider = new Slider(obj.x, obj.y, obj.curvePoints, 1000);
                            obj.slider.drawSlider(container);
                        }
                        obj.slider.updateSlider(progress);
                        if (progress >= 1) {
                            obj.slider.removeSlider(container);
                        }
                    }
                    obj.hasBeenDrawn = true;
                }
            }
        });
    }
}

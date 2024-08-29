import Hitcircle from './Hitcircle.js';
import Slider from './Slider.js';

export default class HitObjectManager {
    constructor(hitObjects, difficulty) {
        this.hitObjects = hitObjects;
        this.circleSize = difficulty.CircleSize;
        this.overallDifficulty = difficulty.OverallDifficulty;
        this.preempt = this.calculatePreempt(this.overallDifficulty);
        this.fadeIn = this.calculateFadeIn(this.overallDifficulty);
        this.hitCircle = new Hitcircle(this.circleSize);
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

    startRendering(container) {
        this.startTime = Date.now();
        PIXI.Ticker.shared.add(() => this.renderHitObjects(container));
    }

    renderHitObjects(container) {
        const currentTime = Date.now() - this.startTime;

        this.hitObjects.forEach(obj => {
            if (obj.time - this.preempt <= currentTime && obj.time + 500 >= currentTime) {
                if (!obj.hasBeenDrawn) {
                    if (obj.type === 'circle') {
                        this.hitCircle.drawCircle(container, obj.x, obj.y, obj.time - currentTime, this.preempt);
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

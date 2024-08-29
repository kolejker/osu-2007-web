
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
            // Calculate the preempt time for the hit object
            const preemptTime = obj.time - this.hitCircle.preempt;
    
            // Check if it's time to draw the hit object based on the preempt time
            if (preemptTime <= currentTime && obj.time + 500 >= currentTime) {
                if (!obj.hasBeenDrawn) {
                    if (obj.type === 'circle') {
                        // Pass the remaining time to the drawCircle method
                        this.hitCircle.drawCircle(container, obj.x, obj.y, obj.time - currentTime);
                    } else if (obj.type === 'slider') {
                        const progress = (currentTime - preemptTime) / 2000;
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

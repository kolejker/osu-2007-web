import Hitcircle from './Hitcircle.js';
import Slider from './Slider.js';

export default class HitObjectManager {
    constructor(hitObjects, difficulty, delay = 900) {
        this.hitObjects = hitObjects;
        this.circleSize = difficulty.CircleSize;
        this.overallDifficulty = difficulty.OverallDifficulty;
        this.hitCircle = new Hitcircle();
        this.hitCircle.updateCircleSize(this.circleSize);
        this.hitCircle.setApproachRate(this.overallDifficulty);

        this.delay = delay;
    }

    

    startRendering(container) {
        this.startTime = Date.now(); 
        PIXI.Ticker.shared.add(() => this.renderHitObjects(container));
    }

    renderHitObjects(container) {

        const currentTime = Date.now() - this.startTime - this.delay;

        this.hitObjects.forEach(obj => {
            const preemptTime = obj.time - this.hitCircle.preempt;

            if (preemptTime <= currentTime && obj.time >= currentTime) {
                if (!obj.hasBeenDrawn) {

                    console.log(`Rendering new hit object: Type=${obj.type}, Scheduled Time=${obj.time}, Current Time=${currentTime}`);
                    
                    if (obj.type === 'circle') {
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
                } else {
                    if (obj.type === 'slider') {
                        const progress = (currentTime - preemptTime) / 2000;

                    }
                }
            }
        });
    }
}

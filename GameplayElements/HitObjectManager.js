import Hitcircle from './Hitcircle.js';
import Slider from './Slider.js';

export default class HitObjectManager {
    constructor(hitObjects, difficulty, delay = 900) {
        this.hitObjects = hitObjects;
        this.circleSize = difficulty.CircleSize;
        this.overallDifficulty = difficulty.OverallDifficulty;
        this.approachRate = difficulty.ApproachRate || difficulty.OverallDifficulty;
        this.hitCircle = new Hitcircle(this.circleSize, this.approachRate);
        this.activeSliders = [];
        this.delay = delay;
    }

    startRendering(container) {
        this.startTime = Date.now(); 
        this.container = container;
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
                        obj.hasBeenDrawn = true;
                    } else if (obj.type === 'slider') {
                        if (!obj.slider) {
                            const curveType = obj.curveType || 'B';
                            const slides = obj.slides || 1;
                            const length = obj.length || this.calculateSliderLength(obj);
                            
                            obj.slider = new Slider(
                                obj.x, 
                                obj.y, 
                                obj.curvePoints, 
                                obj.duration || 1000,
                                curveType,
                                slides,
                                length
                            );
                            
                            obj.slider.drawSlider(container, obj.time - currentTime, this.circleSize, this.approachRate);
                            this.activeSliders.push(obj.slider);
                        }
                        obj.hasBeenDrawn = true;
                    }
                }
            }
            
            if (obj.type === 'slider' && obj.hasBeenDrawn) {
                const sliderEndTime = obj.time + obj.duration;
                
                if (currentTime >= obj.time && currentTime <= sliderEndTime) {
                    const progress = (currentTime - obj.time) / obj.duration;
                    if (obj.slider) {
                        obj.slider.updateSlider(progress);
                    }
                }
                
                if (currentTime > sliderEndTime && obj.slider && obj.slider.hasBeenDrawn) {
                    if (obj.slider) {
                        obj.slider.removeSlider(container);
                        const sliderIndex = this.activeSliders.indexOf(obj.slider);
                        if (sliderIndex !== -1) {
                            this.activeSliders.splice(sliderIndex, 1);
                        }
                        obj.slider = null;
                    }
                }
            }
        });
    }
    
    calculateSliderLength(sliderObj) {
        if (!sliderObj.curvePoints || sliderObj.curvePoints.length === 0) {
            return 100; 
        }
        
        let length = 0;
        let prevPoint = { x: sliderObj.x, y: sliderObj.y };
        
        sliderObj.curvePoints.forEach(point => {
            const dx = point.x - prevPoint.x;
            const dy = point.y - prevPoint.y;
            length += Math.sqrt(dx * dx + dy * dy);
            prevPoint = point;
        });
        
        return length;
    }
}
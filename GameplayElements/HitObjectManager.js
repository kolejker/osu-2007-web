import Hitcircle from './Hitcircle.js';
import Slider from './Slider.js';
import PlayfieldScaler from '../Helpers/OsuPixels.js';

export default class HitObjectManager {
    constructor(hitObjects, difficulty, delay = 900) {
        this.hitObjects = hitObjects;
        this.circleSize = difficulty.CircleSize;
        this.overallDifficulty = difficulty.OverallDifficulty;
        this.approachRate = difficulty.ApproachRate || difficulty.OverallDifficulty;
        this.hitCircle = new Hitcircle(this.circleSize, this.approachRate);
        this.activeSliders = [];
        this.delay = delay;

        this.timeScaling = 1.0;
        this.lagCompensation = 16;

        this.playfieldScaler = new PlayfieldScaler();

        this.preloadTextures();
    }

    startRendering(container) {
        this.startTime = Date.now();
        this.container = container;
        this.lastFrameTime = Date.now();

        // uncomment for the playfield boundaries
        // container.addChild(this.playfieldScaler.createPlayfieldOverlay());

        PIXI.Ticker.shared.add(() => this.renderHitObjects(container));
    }

    renderHitObjects(container) {
        const now = Date.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;

        const currentTime = (now - this.startTime - this.delay) * this.timeScaling - this.lagCompensation;

        const sortedHitObjects = [...this.hitObjects].sort((a, b) => b.time - a.time);

        sortedHitObjects.forEach(obj => {
            const preemptTime = obj.time - this.hitCircle.preempt;

            if (preemptTime <= currentTime && obj.time >= currentTime) {
                if (!obj.hasBeenDrawn) {
                    const x = obj.stackedX !== undefined ? obj.stackedX : obj.x;
                    const y = obj.stackedY !== undefined ? obj.stackedY : obj.y;

                    const screenPos = this.playfieldScaler.mapPosition(x, y);
                    console.log(`Rendering new hit object: Type=${obj.type}, Position=${screenPos.x},${screenPos.y}, Scheduled Time=${obj.time}, Current Time=${currentTime}`);

                    if (obj.type === 'circle') {
                        this.hitCircle.drawCircle(container, screenPos.x, screenPos.y, obj.time - currentTime, obj);
                        obj.hasBeenDrawn = true;
                    } else if (obj.type === 'slider') {
                        if (!obj.slider) {
                            const curveType = obj.curveType || 'B';
                            const slides = obj.slides || 1;

                            const length = obj.length || this.calculateSliderLength(obj);

                            const mappedCurvePoints = obj.curvePoints.map(point =>
                                this.playfieldScaler.mapPosition(point.x, point.y));

                            obj.slider = new Slider(
                                screenPos.x,
                                screenPos.y,
                                mappedCurvePoints,
                                obj.duration || 1000,
                                curveType,
                                slides,
                                this.playfieldScaler.mapSize(length)
                            );

                            obj.slider.playfieldScaler = this.playfieldScaler;

                            obj.slider.drawSlider(container, obj.time - currentTime, this.circleSize, this.approachRate);
                            this.activeSliders.push(obj.slider);
                        }
                        obj.hasBeenDrawn = true;
                    }
                }
            }

            if (obj.type === 'slider' && obj.hasBeenDrawn && obj.slider) {
                const sliderEndTime = obj.time + obj.duration;

                if (currentTime >= obj.time && currentTime <= sliderEndTime) {
                    const progress = Math.min(1.0, Math.max(0.0, (currentTime - obj.time) / obj.duration));
                    obj.slider.updateSlider(progress);
                }

                if (currentTime > sliderEndTime && obj.slider && obj.slider.hasBeenDrawn) {
                    obj.slider.removeSlider(container);

                    const sliderIndex = this.activeSliders.indexOf(obj.slider);
                    if (sliderIndex !== -1) {
                        this.activeSliders.splice(sliderIndex, 1);
                    }

                    obj.slider = null;
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

    setTimeScaling(scaling) {
        this.timeScaling = scaling;
    }

    setLagCompensation(ms) {
        this.lagCompensation = ms;
    }

    updateScreenSize(width, height) {
        this.playfieldScaler.updateScreenSize(width, height);

        this.hitCircle.updatePlayfieldScaler(width, height);

        this.activeSliders.forEach(slider => {
            slider.updatePlayfieldScaler(width, height);
        });
    }

    preloadTextures() {
        const sliderBallTexture = PIXI.Texture.from('Resources/sliderb0.png');

        if (!sliderBallTexture.valid) {
            sliderBallTexture.once('update', () => {
                console.log('Loaded Balls');
            });
        }
    }
}
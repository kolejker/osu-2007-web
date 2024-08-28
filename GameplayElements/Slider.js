
export default class Slider {
    constructor(x, y, curvePoints, duration) {
        this.x = x;
        this.y = y;
        this.curvePoints = curvePoints;
        this.duration = duration;

        this.sliderGraphics = new PIXI.Graphics();
    }

    drawSlider(container) {
        this.sliderGraphics.clear();
        this.sliderGraphics.lineStyle(20, 0x00FF00); 
        this.sliderGraphics.moveTo(this.x, this.y);

        this.curvePoints.forEach(point => {
            this.sliderGraphics.lineTo(point.x, point.y);
        });

        container.addChild(this.sliderGraphics);
    }

    updateSlider(progress) {

    }

    removeSlider(container) {
        container.removeChild(this.sliderGraphics);
    }
}

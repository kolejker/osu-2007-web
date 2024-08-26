class Player {
    constructor(game, folder, songFile) {
        this.game = game;
        this.folder = folder;
        this.songFile = songFile;
        this.artist = '';
        this.creator = '';
        this.audioFilename = '';
        this.hitObjects = [];
        this.timingPoints = [];
        this.velocity = 1;
        this.loadSongData();
    }

    loadSongData() {
        fetch(`Songs/${this.folder}/${this.songFile}`)
            .then(response => response.text())
            .then(data => this.parseOsuFile(data))
            .catch(err => console.error('Error loading .osu file:', err));
    }

    parseOsuFile(content) {
        const lines = content.split('\n');
        let section = '';

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('[') && line.endsWith(']')) {
                section = line;
            } else if (section === '[General]') {
                if (line.startsWith('AudioFilename:')) {
                    this.audioFilename = line.split(':')[1].trim();
                }
            } else if (section === '[Metadata]') {
                if (line.startsWith('Artist:')) {
                    this.artist = line.split(':')[1].trim();
                } else if (line.startsWith('Creator:')) {
                    this.creator = line.split(':')[1].trim();
                }
            } else if (section === '[Difficulty]') {
                if (line.startsWith('SliderMultiplier:')) {
                    this.velocity = parseFloat(line.split(':')[1].trim());
                }
            } else if (section === '[HitObjects]') {
                if (line.length > 0) {
                    this.hitObjects.push(this.parseHitObject(line));
                }
            } else if (section === '[TimingPoints]') {
                if (line.length > 0) {
                    this.timingPoints.push(this.parseTimingPoint(line));
                }
            }
        });

        this.render();
    }

    parseTimingPoint(line) {
        const parts = line.split(',');
        return {
            time: parseInt(parts[0]),
            beatLength: parseFloat(parts[1]),
            meter: parseInt(parts[2]),
            sampleSet: parseInt(parts[3]),
            sampleIndex: parseInt(parts[4]),
            volume: parseInt(parts[5]),
            uninherited: parseInt(parts[6]) === 1,
            effects: parseInt(parts[7])
        };
    }

    calculateEffectiveTimingPoints() {
        let lastUninherited = this.timingPoints[0];

        this.timingPoints.forEach((point, index) => {
            if (point.uninherited) {
                lastUninherited = point;
            } else {
                point.effectiveBeatLength = lastUninherited.beatLength * (-100 / point.beatLength);
            }
        });
    }

    parseHitObject(line) {
        const parts = line.split(',');
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);
        const time = parseInt(parts[2]);
        const type = parseInt(parts[3]);

        let objectParams = {};
        if (type & 1) {
            // Hit circle
            objectParams = {
                x,
                y,
                time,
                type: 'circle'
            };
        } else if (type & 2) {
            // Slider
            const curveType = parts[5].split('|')[0];
            const curvePoints = parts[5].split('|').slice(1).map(point => {
                const [px, py] = point.split(':').map(Number);
                return { x: px, y: py };
            });
            const slides = parseInt(parts[6]);
            const length = parseFloat(parts[7]);

            objectParams = {
                x,
                y,
                time,
                type: 'slider',
                curveType,
                curvePoints,
                slides,
                length
            };
        }

        return objectParams;
    }

    render() {
        this.game.clearScreen();

        this.game.context.font = '30px Arial';
        this.game.context.textAlign = 'left';

        if (this.audioFilename) {
            const audio = new Audio(`Songs/${this.folder}/${this.audioFilename}`);
            audio.play();
        }

        this.renderHitObjects();

        this.game.context.fillText('Back', 50, this.game.canvas.height - 50);

        this.bindEvents();
    }

    drawApproachCircle(context, x, y, radius, progress) {
        const approachRadius = radius * (3 - 2 * progress);

        context.beginPath();
        context.arc(x, y, approachRadius, 0, 2 * Math.PI, false);
        context.strokeStyle = 'rgba(5, 5, 5, 0.8)';
        context.lineWidth = 3;
        context.stroke();
    }

    renderHitObjects() {
        const canvas = this.game.canvas;
        const context = this.game.context;
        const startTime = Date.now();
        let currentTimingPointIndex = 0;
    
        const originalWidth = 512;
        const originalHeight = 512;
    
        const scaleX = canvas.width / originalWidth;
        const scaleY = canvas.height / originalHeight;
    
        const draw = () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            const currentTime = Date.now() - startTime;
    
            while (currentTimingPointIndex < this.timingPoints.length - 1 &&
                this.timingPoints[currentTimingPointIndex + 1].time <= currentTime) {
                currentTimingPointIndex++;
            }
    
            const timingPoint = this.timingPoints[currentTimingPointIndex];
            const effectiveBeatLength = timingPoint.effectiveBeatLength || timingPoint.beatLength;
            const sliderMultiplier = timingPoint.uninherited ? this.velocity : effectiveBeatLength / 100;
    
            this.hitObjects.forEach(obj => {
                const approachStartTime = obj.time - 1000;
                const approachEndTime = obj.time;
    
                if (obj.type === 'circle') {
                    if (approachStartTime <= currentTime && approachEndTime >= currentTime) {
                        const progress = (currentTime - approachStartTime) / 1000;
    
                        const scaledX = obj.x * scaleX;
                        const scaledY = obj.y * scaleY;
    
                        this.drawApproachCircle(context, scaledX, scaledY, 30 * scaleX, progress);
    
                        if (currentTime >= obj.time - 1000 && currentTime <= obj.time + 1000) {
                            this.drawCircle(context, scaledX, scaledY, scaleX);
                        }
                    }
                } else if (obj.type === 'slider') {
                    const sliderDuration = (obj.length / (sliderMultiplier * 100)) * effectiveBeatLength + 1000;
                    const sliderEndTime = obj.time + sliderDuration;
    
                    if (currentTime >= approachStartTime && currentTime <= sliderEndTime) {
                        const scaledX = obj.x * scaleX;
                        const scaledY = obj.y * scaleY;
                        const scaledCurvePoints = obj.curvePoints.map(point => ({
                            x: point.x * scaleX,
                            y: point.y * scaleY
                        }));
    
                        if (currentTime < obj.time) {
                            const progress = (currentTime - approachStartTime) / 1000;
                            this.drawApproachCircle(context, scaledX, scaledY, 30 * scaleX, progress);
                        }
    
                        this.drawSlider(context, scaledX, scaledY, scaledCurvePoints, sliderMultiplier * scaleX, obj.length);
                    }
                }
            });
    
            requestAnimationFrame(draw);
        };
    
        draw();
    }
    

    drawCircle(context, x, y) {
        context.beginPath();
        context.arc(x, y, 56, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgba(255, 0, 0, 0.6)';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#FF0000';
        context.stroke();
    }

    drawSlider(context, x, y, curvePoints, velocity, sliderLength, startTime, currentTime) {
        context.beginPath();
        context.moveTo(x, y);
        curvePoints.forEach(point => {
            context.lineTo(point.x, point.y);
        });
        context.lineWidth = 30;
        context.strokeStyle = '#0000FF';
        context.stroke();
    
        context.font = '20px Tahoma';
        context.fillStyle = '#000000';
        context.fillText(`Length: ${sliderLength.toFixed(2)}`, x + 10, y - 10);
    
        const sliderDuration = (sliderLength / (velocity * 100)) * 1000;
    

        const elapsedTime = currentTime - startTime;
    
        if (elapsedTime >= 1000 && elapsedTime <= sliderDuration + 1000) {
            const moveTime = elapsedTime - 1000;
            const progress = moveTime / sliderDuration;
            const ballPosition = this.getBallPositionLinear(x, y, curvePoints, progress); 
            this.drawSliderBall(context, ballPosition.x, ballPosition.y);
        }
    }
    
    getBallPositionLinear(x, y, curvePoints, progress) {
        const points = [{ x, y }, ...curvePoints];
        const totalLength = this.calculateTotalLength(points);
    
        let distanceAlongPath = progress * totalLength;
    
        for (let i = 0; i < points.length - 1; i++) {
            const segmentLength = this.calculateDistance(points[i], points[i + 1]);
            if (distanceAlongPath <= segmentLength) {
                const t = distanceAlongPath / segmentLength;
                return {
                    x: points[i].x + t * (points[i + 1].x - points[i].x),
                    y: points[i].y + t * (points[i + 1].y - points[i].y),
                };
            } else {
                distanceAlongPath -= segmentLength;
            }
        }
    

    }
    
    calculateTotalLength(points) {
        let length = 0;
        for (let i = 0; i < points.length - 1; i++) {
            length += this.calculateDistance(points[i], points[i + 1]);
        }
        return length;
    }
    
    calculateDistance(point1, point2) {
        return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
    }
    
    drawSliderBall(context, x, y) {
        context.beginPath();
        context.arc(x, y, 30, 0, 2 * Math.PI, false);
        context.fillStyle = 'rgba(255, 255, 0, 0.8)';
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = '#FFFF00';
        context.stroke();
    }
    
    
    bindEvents() {
        const canvas = this.game.canvas;
        canvas.addEventListener('click', (event) => {
            const { offsetX, offsetY } = event;
            if (offsetY > this.game.canvas.height - 80 && offsetY < this.game.canvas.height - 20) {
                this.game.goBack();
                audio.pause();
                audio.stop();
            }
        });
    }
}

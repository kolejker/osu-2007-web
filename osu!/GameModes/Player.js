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
                const bpm = timingPoint.uninherited ? 60000 / timingPoint.beatLength : null;
                const sliderMultiplier = timingPoint.uninherited ? this.velocity : -timingPoint.beatLength / 100;
        
                this.hitObjects.forEach(obj => {
                    const approachStartTime = obj.time - 1000; 
                    const approachEndTime = obj.time;
        
                    if (approachStartTime <= currentTime && approachEndTime >= currentTime) {
                        const progress = (currentTime - approachStartTime) / 1000; 
        
                        const scaledX = obj.x * scaleX;
                        const scaledY = obj.y * scaleY;
        
                        this.drawApproachCircle(context, scaledX, scaledY, 30 * scaleX, progress);

                        if (currentTime >= obj.time - 1000 && currentTime <= obj.time + 1000) {
                            if (obj.type === 'circle') {
                                this.drawCircle(context, scaledX, scaledY, scaleX);
                            } else if (obj.type === 'slider') {
                                const scaledCurvePoints = obj.curvePoints.map(point => ({
                                    x: point.x * scaleX,
                                    y: point.y * scaleY
                                }));
                                this.drawSlider(context, scaledX, scaledY, scaledCurvePoints, sliderMultiplier * scaleX);
                            }
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

        drawSlider(context, x, y, curvePoints, velocity) {
            context.beginPath();
            context.moveTo(x, y);
            curvePoints.forEach(point => {
                context.lineTo(point.x, point.y);
            });
            context.lineWidth = 30;
            context.strokeStyle = '#0000FF';
            context.stroke();

            const ball = {
                x: x,
                y: y,
                index: 0,
                direction: 1
            };

            let totalLength = 0;
            for (let i = 1; i < curvePoints.length; i++) {
                const dx = curvePoints[i].x - curvePoints[i - 1].x;
                const dy = curvePoints[i].y - curvePoints[i - 1].y;
                totalLength += Math.sqrt(dx * dx + dy * dy);
            }

            const duration = totalLength / (velocity * 100);

            const animateBall = (startTime) => (timestamp) => {
                context.clearRect(0, 0, context.canvas.width, context.canvas.height);
                const elapsedTime = timestamp - startTime;
                const progress = elapsedTime / duration;

                let currentLength = totalLength * progress;

                let segmentLength = 0;
                let i;
                for (i = 1; i < curvePoints.length; i++) {
                    const dx = curvePoints[i].x - curvePoints[i - 1].x;
                    const dy = curvePoints[i].y - curvePoints[i - 1].y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    if (segmentLength + length >= currentLength) {
                        break;
                    }
                    segmentLength += length;
                }

                const ratio = (currentLength - segmentLength) / Math.sqrt(dx * dx + dy * dy);
                ball.x = curvePoints[i - 1].x + dx * ratio;
                ball.y = curvePoints[i - 1].y + dy * ratio;

                this.drawBall(context, ball.x, ball.y);

                requestAnimationFrame(animateBall(startTime));
            };

            requestAnimationFrame(animateBall(Date.now()));
        }

        drawBall(context, x, y) {
            context.beginPath();
            context.arc(x, y, 5, 0, 2 * Math.PI, false);
            context.fillStyle = '#00FF00';
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = '#00FF00';
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
 
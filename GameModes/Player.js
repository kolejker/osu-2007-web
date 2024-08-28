import Hitcircle from '../GameplayElements/Hitcircle.js';
import Slider from '../GameplayElements/Slider.js';
export default class Player extends PIXI.Container {
    constructor(filePath) {
        super();

        this.filePath = filePath;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.hitObjects = [];
        this.velocity = 1;
        this.startTime = 0;
        this.circleSize = 5; 

        this.hitCircle = new Hitcircle();

        this.loadOsuFile();
    }


    loadOsuFile() {
        fetch(this.filePath)
            .then(response => response.text())
            .then(content => {
                const audioFilename = this.extractAudioFilename(content);
                const metadata = this.extractMetadata(content);
                const difficulty = this.extractDifficulty(content);
                const timingPoints = this.extractTimingPoints(content);
                console.log("Difficulty Settings:");
                console.log("HP Drain Rate:", difficulty.HPDrainRate);
                console.log("Circle Size:", difficulty.CircleSize);
                console.log("Overall Difficulty:", difficulty.OverallDifficulty);
                console.log("Slider Multiplier:", difficulty.SliderMultiplier);
                console.log("Slider Tick Rate:", difficulty.SliderTickRate);
    
                this.circleSize = difficulty.CircleSize;
                this.overallDifficulty = difficulty.OverallDifficulty;  
                this.hitCircle.updateCircleSize(this.circleSize);

                this.hitCircle.setApproachRate(this.overallDifficulty);
    
                this.createDisplay();
                this.parseOsuFile(content);
                this.loadAudio(audioFilename);
            })
            .catch(error => {
                console.error('Error reading file:', error);
            });
    }
    


    createDisplay() {
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000); 
        bg.drawRect(0, 0, 800, 600); 
        bg.endFill();
        this.addChild(bg);

        this.startRendering();
    }

    parseOsuFile(content) {
        const lines = content.split('\n');
        let section = '';
        this.hitObjects = []; 
        this.velocity = 1;

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('[') && line.endsWith(']')) {
                section = line;
            } else if (section === '[HitObjects]') {
                if (line.length > 0) {
                    this.hitObjects.push(this.parseHitObject(line));
                }
            } else if (section === '[Difficulty]') {
                if (line.startsWith('SliderMultiplier:')) {
                    this.velocity = parseFloat(line.split(':')[1].trim());
                }
            }
        });
    }

    extractAudioFilename(osuContent) {
        const match = osuContent.match(/AudioFilename:\s*(.+)\s*/);
        return match ? match[1].trim() : 'Unknown';
    }

    extractMetadata(osuContent) {
        const metadata = {};
        const metadataSection = osuContent.match(/\[Metadata\][\s\S]*?(?=\[|\z)/);
        if (metadataSection) {
            const titleMatch = metadataSection[0].match(/Title:\s*(.+)/);
            const artistMatch = metadataSection[0].match(/Artist:\s*(.+)/);
            const creatorMatch = metadataSection[0].match(/Creator:\s*(.+)/);
            const versionMatch = metadataSection[0].match(/Version:\s*(.+)/);

            metadata.Title = titleMatch ? titleMatch[1].trim() : 'Unknown';
            metadata.Artist = artistMatch ? artistMatch[1].trim() : 'Unknown';
            metadata.Creator = creatorMatch ? creatorMatch[1].trim() : 'Unknown';
            metadata.Version = versionMatch ? versionMatch[1].trim() : 'Unknown';
        }
        return metadata;
    }
//Doesn't fetch properly for OD and CS for some reason..
    extractDifficulty(osuContent) {
        const difficulty = {};
        const difficultySection = osuContent.match(/\[Difficulty\][\s\S]*?(?=\[|\z)/);
        if (difficultySection) {

            const hpDrainRateMatch = difficultySection[0].match(/HPDrainRate\s*:\s*([\d.]+)/);
            const circleSizeMatch = difficultySection[0].match(/CircleSize\s*:\s*([\d.]+)/);
            const overallDifficultyMatch = difficultySection[0].match(/OverallDifficulty\s*:\s*([\d.]+)/);
            const sliderMultiplierMatch = difficultySection[0].match(/SliderMultiplier\s*:\s*([\d.]+)/);
            const sliderTickRateMatch = difficultySection[0].match(/SliderTickRate\s*:\s*([\d.]+)/);
            
            difficulty.HPDrainRate = hpDrainRateMatch ? parseFloat(hpDrainRateMatch[1]) : 0;
            difficulty.CircleSize = circleSizeMatch ? parseFloat(circleSizeMatch[1]) : 0;
            difficulty.OverallDifficulty = overallDifficultyMatch ? parseFloat(overallDifficultyMatch[1]) : 0;
            difficulty.SliderMultiplier = sliderMultiplierMatch ? parseFloat(sliderMultiplierMatch[1]) : 1.0;
            difficulty.SliderTickRate = sliderTickRateMatch ? parseFloat(sliderTickRateMatch[1]) : 1.0;
        }
        return difficulty;
    }
    
    

    extractEvents(osuContent) {
        const events = [];
        const eventsSection = osuContent.match(/\[Events\][\s\S]*?(?=\[|\z)/);
        if (eventsSection) {
            const eventLines = eventsSection[0].split('\n');
            for (const line of eventLines) {
                if (line.trim() && !line.startsWith('[')) {
                    events.push(line.trim());
                }
            }
        }
        return events;
    }

    extractTimingPoints(osuContent) {
        const timingPoints = { bpm: 0 };
        const timingPointsSection = osuContent.match(/\[TimingPoints\][\s\S]*?(?=\[|\z)/);
        if (timingPointsSection) {
            const firstTimingPoint = timingPointsSection[0].split('\n').find(line => line.trim() && !line.startsWith('['));
            if (firstTimingPoint) {
                const [time, beatLength] = firstTimingPoint.split(',').map(value => parseFloat(value.trim()));
                timingPoints.time = time;
                timingPoints.beatLength = beatLength;
                timingPoints.bpm = 1 / beatLength * 1000 * 60; 
            }
        }
        return timingPoints;
    }


    parseHitObject(line) {
        const parts = line.split(',');
        const gridWidth = 512;
        const gridHeight = 384;
        const displayWidth = 1024;
        const displayHeight = 768;

        const offsetX = (displayWidth - gridWidth) / 2;
        const offsetY = (displayHeight - gridHeight) / 2;

        const x = parseInt(parts[0]) + offsetX;
        const y = parseInt(parts[1]) + offsetY;
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
            const curvePoints = parts[5].split('|').slice(1).map(point => {
                const [px, py] = point.split(':').map(Number);
                return { x: px + offsetX, y: py + offsetY };
            });
            objectParams = {
                x,
                y,
                time,
                type: 'slider',
                curvePoints
            };
        }

        return objectParams;
    }
    

    startRendering() {
        this.startTime = Date.now();

        PIXI.Ticker.shared.add(() => this.renderHitObjects());
    }

    renderHitObjects() {
        const currentTime = Date.now() - this.startTime;
    
        this.hitObjects.forEach(obj => {
            if (obj.time - 1500 <= currentTime && obj.time + 500 >= currentTime) { 
                if (!obj.hasBeenDrawn) {
                    if (obj.type === 'circle') {
                        this.hitCircle.drawCircle(this, obj.x, obj.y, obj.time - currentTime);
                    } else if (obj.type === 'slider') {
                        const progress = (currentTime - obj.time + 1500) / (2000);
                        if (!obj.slider) {
                            obj.slider = new Slider(obj.x, obj.y, obj.curvePoints, 1000);
                            obj.slider.drawSlider(this);
                        }
                        obj.slider.updateSlider(progress);
                        if (progress >= 1) {
                            obj.slider.removeSlider(this);
                        }
                    }
                    obj.hasBeenDrawn = true;
                }
            }
        });
    }
    


    loadAudio(audioFilename) {
        const audioFilePath = this.filePath.replace(/[^/]+$/, audioFilename);
    
        fetch(audioFilePath)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.audioBuffer = audioBuffer;
                this.playAudio(); 
            })
            .catch(error => {
                console.error('Error loading audio file:', error);
            });
    }
    
    playAudio() {
        if (!this.audioBuffer) return;
    
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(this.audioContext.destination);

        source.start(0); 
        this.startRendering();
    }
    
}

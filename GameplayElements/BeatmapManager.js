export default class Beatmap {
    constructor(filePath) {
        this.filePath = filePath;
        this.metadata = {};
        this.difficulty = {};
        this.timingPoints = [];
        this.hitObjects = [];
        this.stackOffset = 4; 
    }
    

    loadBeatmap() {
        return fetch(this.filePath)
            .then(response => response.text())
            .then(content => this.parseOsuFile(content))
            .catch(error => {
                console.error('Error reading beatmap file:', error);
            });
    }

    processStacking() {
        const circleRadius = 54.4 - 4.48 * this.difficulty.CircleSize;
        this.stackOffset = circleRadius / 10;
        
        this.hitObjects.forEach(obj => {
            obj.stackCount = 0;
        });
        
        for (let i = 0; i < this.hitObjects.length; i++) {
            const currHitObject = this.hitObjects[i];
            
            if (currHitObject.stackCount !== 0 || currHitObject.type === 'slider') {
                continue;
            }
            
            let startTime = currHitObject.time;
            if (currHitObject.type === 'slider') {
                startTime += currHitObject.duration;
            }
            
            for (let j = i + 1; j < this.hitObjects.length; j++) {
                const nextObject = this.hitObjects[j];
                
                const preempt = this.calculatePreempt(this.difficulty.ApproachRate || this.difficulty.OverallDifficulty);
                
                if (nextObject.time - (preempt * 0.7) <= startTime) {
                    if (this.arePositionsEqual(currHitObject, nextObject)) {
                        currHitObject.stackCount++;
                        startTime = nextObject.time;
                        
                        if (nextObject.type === 'slider') {
                            startTime += nextObject.duration;
                        }
                    }
                } else {
                    break; 
                }
            }
        }
        
        this.hitObjects.forEach(obj => {
            if (obj.stackCount !== 0) {
                obj.stackedX = obj.x - (obj.stackCount * this.stackOffset);
                obj.stackedY = obj.y - (obj.stackCount * this.stackOffset);
            } else {
                obj.stackedX = obj.x;
                obj.stackedY = obj.y;
            }
        });
        
        return this.hitObjects;
    }
    
    arePositionsEqual(obj1, obj2) {
        const tolerance = 3; 
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy) < tolerance;
    }
    
    calculatePreempt(ar) {
        if (ar < 5) {
            return 1200 + 600 * (5 - ar) / 5;
        } else {
            return 1200 - 750 * (ar - 5) / 5;
        }
    }
    
    parseOsuFile(content) {
        const lines = content.split('\n').map(line => line.trim());
        let section = '';
        
        lines.forEach(line => {
            if (line.startsWith('[') && line.endsWith(']')) {
                section = line;
            } else if (section === '[General]') {
                if (line.startsWith('AudioFilename:')) {
                    this.audioFilename = line.split(':')[1].trim();
                }
            } else if (section === '[Metadata]') {
                this.parseMetadata(line);
            } else if (section === '[Difficulty]') {
                this.parseDifficulty(line);
            } else if (section === '[TimingPoints]') {
                this.parseTimingPoint(line);
            } else if (section === '[HitObjects]') {
                const hitObject = this.parseHitObject(line);
                if (hitObject) {
                    this.hitObjects.push(hitObject);
                }
            }
        });
        
        this.processStacking();
    }

    parseMetadata(line) {
        if (line.startsWith('Title:')) {
            this.metadata.Title = line.split(':')[1].trim();
        } else if (line.startsWith('Artist:')) {
            this.metadata.Artist = line.split(':')[1].trim();
        } else if (line.startsWith('Creator:')) {
            this.metadata.Creator = line.split(':')[1].trim();
        } else if (line.startsWith('Version:')) {
            this.metadata.Version = line.split(':')[1].trim();
        }
    }

    parseDifficulty(line) {
        if (line.startsWith('HPDrainRate:')) {
            this.difficulty.HPDrainRate = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('CircleSize:')) {
            this.difficulty.CircleSize = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('OverallDifficulty:')) {
            this.difficulty.OverallDifficulty = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('ApproachRate:')) {
            this.difficulty.ApproachRate = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('SliderMultiplier:')) {
            this.difficulty.SliderMultiplier = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('SliderTickRate:')) {
            this.difficulty.SliderTickRate = parseFloat(line.split(':')[1].trim());
        }
    }

    parseTimingPoint(line) {
        if (!line || line.trim() === '') return;
        
        const parts = line.split(',');
        if (parts.length < 2) return;
        
        const time = parseFloat(parts[0]);
        const beatLength = parseFloat(parts[1]);
        
        if (!isNaN(time) && !isNaN(beatLength) && beatLength !== 0) {
            this.timingPoints.push({ 
                time, 
                beatLength, 
                bpm: 60000 / beatLength,
                speedMultiplier: beatLength < 0 ? 100 / -beatLength : 1
            });
        }
    }

    parseHitObject(line) {
        if (!line || line.trim() === '') return null;
        
        const parts = line.split(',');
        if (parts.length < 4) return null;
        
        const x = parseInt(parts[0]);
        const y = parseInt(parts[1]);
        const time = parseInt(parts[2]);
        const typeFlags = parseInt(parts[3]);
        const hitSound = parts[4] ? parseInt(parts[4]) : 0;

        const isCircle = (typeFlags & 1) > 0;
        const isSlider = (typeFlags & 2) > 0;
        const isSpinner = (typeFlags & 8) > 0;

        if (isCircle) {
            return {
                x,
                y,
                time,
                type: 'circle',
                hitSound
            };
        } else if (isSlider) {
            if (parts.length < 7) return null;
            
            const curveInfo = parts[5].split('|');
            const curveType = curveInfo[0];
            const curvePoints = [];
            
            for (let i = 1; i < curveInfo.length; i++) {
                const pointCoords = curveInfo[i].split(':');
                if (pointCoords.length === 2) {
                    const px = parseInt(pointCoords[0]);
                    const py = parseInt(pointCoords[1]);
                    curvePoints.push({ x: px, y: py });
                }
            }
            
            const slides = parts[6] ? parseInt(parts[6]) : 1;
            const length = parts[7] ? parseFloat(parts[7]) : 100;
            
            const sliderMultiplier = this.difficulty.SliderMultiplier || 1.4;
            const sliderTickRate = this.difficulty.SliderTickRate || 1.0;
            
            let currentTimingPoint = this.getTimingPointAtTime(time);
            
            const beatLength = currentTimingPoint ? currentTimingPoint.beatLength : 500; 
            const speedMultiplier = currentTimingPoint ? currentTimingPoint.speedMultiplier : 1;
            
            const sliderDuration = length / (sliderMultiplier * 100 * speedMultiplier) * beatLength * slides;
            
            return {
                x,
                y,
                time,
                type: 'slider',
                hitSound,
                curveType,
                curvePoints,
                slides,
                length,
                duration: sliderDuration
            };
        } else if (isSpinner) {
            const endTime = parts[5] ? parseInt(parts[5]) : time + 1000;
            return {
                x: 256, 
                y: 192, 
                time,
                type: 'spinner',
                hitSound,
                endTime
            };
        }
        
        return null;
    }
    
    getTimingPointAtTime(time) {
        let applicablePoint = null;
        
        for (const point of this.timingPoints) {
            if (point.time <= time && (!applicablePoint || point.time > applicablePoint.time)) {
                applicablePoint = point;
            }
        }
        
        return applicablePoint;
    }
}

export default class Beatmap {
    constructor(filePath) {
        this.filePath = filePath;
        this.metadata = {};
        this.difficulty = {};
        this.timingPoints = [];
        this.hitObjects = [];
    }

    loadBeatmap() {
        return fetch(this.filePath)
            .then(response => response.text())
            .then(content => this.parseOsuFile(content))
            .catch(error => {
                console.error('Error reading beatmap file:', error);
            });
    }

    parseOsuFile(content) {
        const lines = content.split('\n').map(line => line.trim());
        let metadata = {};
        let section = '';
    
        for (let line of lines) {
            if (line.startswith('[') && line.endswith(']')) {
                section = line.slice(1, -1);
                metadata[section] = {};
            }
    
            (key, value) = line.split(': ');
            this.metadata[section][key] = value;
        }
    
        return metadata;
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
        } else if (line.startsWith('SliderMultiplier:')) {
            this.difficulty.SliderMultiplier = parseFloat(line.split(':')[1].trim());
        } else if (line.startsWith('SliderTickRate:')) {
            this.difficulty.SliderTickRate = parseFloat(line.split(':')[1].trim());
        }
    }

    parseTimingPoint(line) {
        const [time, beatLength] = line.split(',').map(value => parseFloat(value.trim()));
        this.timingPoints.push({ time, beatLength, bpm: 1 / beatLength * 1000 * 60 });
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
}
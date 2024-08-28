export default class Player extends PIXI.Container {
    constructor(filePath) {
        super();
        
        this.filePath = filePath;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.loadOsuFile();
    }

    loadOsuFile() {
        fetch(this.filePath)
            .then(response => response.text())
            .then(content => {
                const audioFilename = this.extractAudioFilename(content);
                const metadata = this.extractMetadata(content);
                const difficulty = this.extractDifficulty(content);
                const events = this.extractEvents(content);
                const timingPoints = this.extractTimingPoints(content);

                this.createDisplay(audioFilename, metadata, difficulty, timingPoints);
                this.loadAudio(audioFilename);
            })
            .catch(error => {
                console.error('Error reading file:', error);
            });
    }

    createDisplay(audioFilename, metadata, difficulty, timingPoints) {   
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000); 
        bg.drawRect(0, 0, 800, 600); 
        bg.endFill();
        this.addChild(bg);

        const fileText = new PIXI.Text(`Audio File: ${audioFilename}\nTitle: ${metadata.Title}\nArtist: ${metadata.Artist}\nVersion: ${metadata.Version}\nBPM: ${timingPoints.bpm.toFixed(2)}`, {
            fontSize: 24,
            fill: 'white',
            align: 'center'
        });
        fileText.anchor.set(0.5);
        fileText.x = 400; 
        fileText.y = 300; 
        this.addChild(fileText);
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

    extractDifficulty(osuContent) {
        const difficulty = {};
        const difficultySection = osuContent.match(/\[Difficulty\][\s\S]*?(?=\[|\z)/);
        if (difficultySection) {
            const hpDrainRateMatch = difficultySection[0].match(/HPDrainRate:\s*(.+)/);
            const circleSizeMatch = difficultySection[0].match(/CircleSize:\s*(.+)/);
            const overallDifficultyMatch = difficultySection[0].match(/OverallDifficulty:\s*(.+)/);
            const sliderMultiplierMatch = difficultySection[0].match(/SliderMultiplier:\s*(.+)/);
            const sliderTickRateMatch = difficultySection[0].match(/SliderTickRate:\s*(.+)/);

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
    }

    close() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
    }
}

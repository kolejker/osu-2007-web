import Beatmap from '../GameplayElements/BeatmapManager.js';
import HitObjectManager from '../GameplayElements/HitObjectManager.js';

export default class Player extends PIXI.Container {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.loadBeatmap();

        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    loadBeatmap() {
        const beatmap = new Beatmap(this.filePath);
        beatmap.loadBeatmap().then(() => {
            this.circleSize = beatmap.difficulty.CircleSize;
            this.overallDifficulty = beatmap.difficulty.OverallDifficulty;
            this.createDisplay();
            this.loadAudio(beatmap.audioFilename);

            this.hitObjectManager = new HitObjectManager(beatmap.hitObjects, beatmap.difficulty);
            this.hitObjectManager.startRendering(this);
        });
    }

    createDisplay() {
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000);
        bg.drawRect(0, 0, 800, 600);
        bg.endFill();
        this.addChild(bg);
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

        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.audioBuffer;
        this.source.connect(this.audioContext.destination);
        this.source.start(0);
    }

    stopAudio() {
        if (this.source) {
            this.source.stop(); 
            this.source.disconnect(); 
        }
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') { 
            this.stopAudio();  
            window.removeEventListener('keydown', this.handleKeyDown);  

        }
    }
}

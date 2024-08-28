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
                this.createDisplay(audioFilename);
                this.loadAudio(audioFilename);
            })
            .catch(error => {
                console.error('Error reading file:', error);
            });
    }

    createDisplay(audioFilename) {   
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000); 
        bg.drawRect(0, 0, 800, 600); 
        bg.endFill();
        this.addChild(bg);

        const fileText = new PIXI.Text(`Audio File: ${audioFilename}`, {
            fontSize: 36,
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
        return match ? match[1] : 'Unknown';
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

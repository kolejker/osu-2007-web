import Player from './Player.js'; 

export default class SongSelect extends PIXI.Container {
    constructor(app, loadScreen) {
        super();

        this.app = app;
        this.loadScreen = loadScreen;
        this.expandedSong = null;
        this.songItems = [];

        const BackButton = PIXI.Sprite.from('Resources/menu-back.png');
        const bg = PIXI.Sprite.from('Resources/menu-background.png');
        this.addChild(bg);
        
        this.songData = {
            "UverWorld - UNKNOWN ORCHESTRA": [
                "UverWorld - UNKNOWN ORCHESTRA - Easy.osu",
                "UverWorld - UNKNOWN ORCHESTRA - Normal.osu",
                "UverWorld - UNKNOWN ORCHESTRA - Hard.osu",
                "UverWorld - UNKNOWN ORCHESTRA - Insane.osu"
            ],
            "1 Kenji Ninuma - DISCO PRINCE": [
                "Kenji Ninuma - DISCOüÜPRINCE (peppy) [Normal].osu"
            ],
            "Brandy - Cross Time": [
                "Brandy - Cross Time (FFFanatic) [Hard].osu"
            ],
            "Scatman John - Scatman": [
                "Scatman John - Scatman (Extor) [Insane].osu"
            ]
        };

        this.createSongList();
        this.arrangeItems();

        BackButton.interactive = true;
        BackButton.buttonMode = true;
        BackButton.y = app.view.height - BackButton.height;
        BackButton.on('pointerdown', () => loadScreen('MainMenu'));
        this.addChild(BackButton);
    }

    createSongList() {
        this.clearScreen();
        this.songItems = [];

        const startY = 100;
        const spacing = 50;

        Object.keys(this.songData).forEach((songName, index) => {
            const songItem = new PIXI.Text(songName, { fill: 'white', fontSize: 24 });
            songItem.interactive = true;
            songItem.buttonMode = true;
            songItem.y = startY + (index * spacing);
            songItem.fileContainer = new PIXI.Container();
            songItem.fileContainer.visible = false;
            songItem.fileContainer.y = songItem.y + 30;
            this.addChild(songItem.fileContainer);

            songItem.on('pointerdown', () => this.toggleFiles(songName, songItem));

            this.addChild(songItem);
            this.songItems.push({ item: songItem, index });
        });
    }

    arrangeItems() {
        let currentY = 100;
        const spacing = 50;

        this.songItems.forEach(({ item }) => {
            item.y = currentY;
            item.fileContainer.y = item.y + 30;
            currentY += spacing;
        });

        this.songItems.forEach(({ item }) => {
            const container = item.fileContainer;
            container.removeChildren();

            const files = this.songData[item.text];
            files.forEach((file, index) => {
                const fileItem = new PIXI.Text(file, { fill: 'white', fontSize: 20 });
                fileItem.interactive = true;
                fileItem.buttonMode = true;
                fileItem.y = index * 30;
                
                fileItem.openFileHandler = () => this.openFile(file);
                fileItem.on('pointerdown', fileItem.openFileHandler);
                
                container.addChild(fileItem);
            });
        });
    }

    toggleFiles(songName, songItem) {
        const isExpanded = songItem.fileContainer.visible;

        if (this.expandedSong && this.expandedSong !== songItem) {
            this.adjustItemPositions(this.expandedSong, -this.expandedSong.fileContainer.children.length * 30);
            this.expandedSong.fileContainer.visible = false;
        }

        if (isExpanded) {
            this.adjustItemPositions(songItem, -songItem.fileContainer.children.length * 30);
            songItem.fileContainer.visible = false;
            this.expandedSong = null;
        } else {
            this.adjustItemPositions(songItem, songItem.fileContainer.children.length * 30);
            songItem.fileContainer.visible = true;
            this.expandedSong = songItem;
        }
    }

    adjustItemPositions(songItem, offset) {
        this.songItems.forEach(({ item }) => {
            if (item === songItem) return;
            if (item.y > songItem.y) {
                item.y += offset;
                item.fileContainer.y += offset;
            }
        });
    }

    openFile(file) {
        const folder = this.getFolderName(file); 
        const filePath = `Songs/${folder}/${file}`;

        const existingPlayer = this.getChildByName('playerContainer');
        if (existingPlayer) {
            this.removeChild(existingPlayer);
            if (existingPlayer.cleanup) {
                existingPlayer.cleanup();
            }
            existingPlayer.destroy({ children: true });
        }

        const player = new Player(filePath, this.loadScreen);
        player.name = 'playerContainer';
        this.addChild(player);
        
        this.songItems.forEach(({ item }) => {
            item.interactive = false;
            item.fileContainer.children.forEach(child => {
                child.interactive = false;
            });
        });
    }

    getFolderName(file) {
        const songName = Object.keys(this.songData).find(name => {
            return this.songData[name].includes(file);
        });
        return songName;
    }

    clearScreen() {
        while (this.children.length > 0) {
            const child = this.children[0];
            if (child.cleanup) {
                child.cleanup();
            }
            this.removeChild(child);
            child.destroy({ children: true });
        }
    }
    
    cleanup() {
        this.songItems.forEach(({ item }) => {
            item.interactive = false;
            
            item.fileContainer.children.forEach(fileItem => {
                fileItem.interactive = false;
                if (fileItem.openFileHandler) {
                    fileItem.off('pointerdown', fileItem.openFileHandler);
                }
            });
        });
        
        const player = this.getChildByName('playerContainer');
        if (player && player.cleanup) {
            player.cleanup();
        }
    }
}
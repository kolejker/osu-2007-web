class SongSelect {
    constructor(game) {
        this.game = game;
        this.handleClick = this.handleClick.bind(this);
        this.songs = {
            "UverWorld - UNKNOWN ORCHESTRA": ["UverWorld - UNKNOWN ORCHESTRA - Easy.osu", "UverWorld - UNKNOWN ORCHESTRA - Normal.osu", "UverWorld - UNKNOWN ORCHESTRA - Hard.osu", "UverWorld - UNKNOWN ORCHESTRA - Insane.osu"],
            "1 Kenji Ninuma - DISCO PRINCE": ["Kenji Ninuma - DISCOüÜPRINCE (peppy) [Normal].osu"],
     
        };
        this.expandedFolders = new Set();
        this.itemHeight = 40;
        this.startX = 50;
        this.startY = 150;
        this.indentWidth = 30;
    }

    render() {
        console.log("Rendering Song Select");
        this.game.clearScreen();
        
        this.game.context.font = '30px Arial';
        this.game.context.textAlign = 'left';
        
        this.game.context.fillText(`User: ${this.game.username}`, this.startX, 50);
        this.game.context.fillText('Song Select Screen', this.startX, 100);

        this.renderItems();

        this.game.context.fillText('Back', this.startX, this.game.canvas.height - 50);

        this.bindEvents();
    }

    renderItems() {
        let y = this.startY;
        Object.entries(this.songs).forEach(([folder, songs]) => {
            this.game.context.fillText(this.expandedFolders.has(folder) ? '▼ ' + folder : '► ' + folder, this.startX, y);
            y += this.itemHeight;

            if (this.expandedFolders.has(folder)) {
                songs.forEach(song => {
                    this.game.context.fillText(song, this.startX + this.indentWidth, y);
                    y += this.itemHeight;
                });
            }
        });
    }

    bindEvents() {
        console.log("Binding Song Select Events");
        this.game.canvas.addEventListener('click', this.handleClick);
    }

    handleClick(event) {
        const { offsetX, offsetY } = event;

        if (offsetY > this.game.canvas.height - 80 && offsetY < this.game.canvas.height - 20) {
            this.game.goBack();
            return;
        }

        let y = this.startY;
        for (const [folder, songs] of Object.entries(this.songs)) {
            if (offsetY >= y - this.itemHeight / 2 && offsetY < y + this.itemHeight / 2 && offsetX < this.startX + 200) {
                this.toggleFolder(folder);
                this.render();
                return;
            }
            y += this.itemHeight;

            if (this.expandedFolders.has(folder)) {
                for (const song of songs) {
                    if (offsetY >= y - this.itemHeight / 2 && offsetY < y + this.itemHeight / 2 && offsetX >= this.startX + this.indentWidth) {
                        console.log(`Selected song: ${song}`);
                        this.game.startPlayer(folder, song); 
                        return;
                    }
                    y += this.itemHeight;
                }
            }
        }
    }
    

    toggleFolder(folder) {
        if (this.expandedFolders.has(folder)) {
            this.expandedFolders.delete(folder);
        } else {
            this.expandedFolders.add(folder);
        }
    }
}

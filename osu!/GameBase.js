class GameBase {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.context = this.canvas.getContext('2d');
        this.username = 'Guest';
        this.currentScreen = null;
        
        this.showMainMenu = this.showMainMenu.bind(this);
        this.showSongSelect = this.showSongSelect.bind(this);
        this.showOptions = this.showOptions.bind(this);
        this.goBack = this.goBack.bind(this);
        this.startPlayer = this.startPlayer.bind(this);
        
        this.showMainMenu();
    }

    showMainMenu() {
        this.clearScreen();
        this.currentScreen = new Menu(this);
        this.currentScreen.render();
    }

    showSongSelect() {
        this.clearScreen();
        this.currentScreen = new SongSelect(this);
        this.currentScreen.render();
    }

    showOptions() {
        this.clearScreen();
        this.currentScreen = new Options(this);
        this.currentScreen.render();
    }

    startPlayer(folder, song) {
        this.clearScreen();
        this.currentScreen = new Player(this, folder, song);
        this.currentScreen.render();
    }

    goBack() {
        this.clearScreen();
        this.showMainMenu();
    }

    clearScreen() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.removeEventListener('click', this.currentScreen?.handleClick);
    }
}

window.onload = () => {
    const game = new GameBase();
};

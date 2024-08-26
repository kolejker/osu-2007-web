// osu/gamemodes/options.js

class Options {
    constructor(game) {
        this.game = game;
        this.handleClick = this.handleClick.bind(this);
    }

    render() {
        console.log("Rendering Options");
        this.game.clearScreen();
        
        this.game.context.font = '30px Arial';
        this.game.context.textAlign = 'center';
        
        // Display username
        this.game.context.fillText(`User: ${this.game.username}`, this.game.canvas.width / 2, 100);
        this.game.context.fillText('Options Screen', this.game.canvas.width / 2, 200);
        this.game.context.fillText('Back', this.game.canvas.width / 2, 300);

        this.bindEvents();
    }

    bindEvents() {
        console.log("Binding Options Events");
        this.game.canvas.addEventListener('click', this.handleClick);
    }

    handleClick(event) {
        const { offsetX, offsetY } = event;

        if (offsetY > 280 && offsetY < 330) {
            this.game.goBack();
        }
    }
}

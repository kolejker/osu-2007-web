    class Menu {
        constructor(game) {
            this.game = game;
            this.options = [
                { image: 'Resources/menu-background.png', x: 0, y: 0 },
                { image: 'Resources/menu-button-play.png', x: 160, y: 120, action: () => this.game.showSongSelect() },
                { image: 'Resources/menu-button-options.png', x: 185, y: 225, action: () => this.game.showOptions() },
                { image: 'Resources/menu-button-exit.png', x: 150, y: 330, action: () => this.game.exit() },
                { image: 'Resources/menu-osu.png', x: -15, y: 30 }
            ];
            this.handleClick = this.handleClick.bind(this);
            this.buttons = [];
            this.loadImages();
        }

        loadImages() {
            this.options.forEach((option, index) => {
                const img = new Image();
                img.src = option.image;
                img.onload = () => {
                    this.buttons[index] = {
                        img: img,
                        x: option.x,
                        y: option.y,
                        width: img.width,
                        height: img.height,
                        action: option.action 
                    };
                    this.render();
                };
            });
        }

        render() {
            console.log("Rendering Main Menu");
            this.game.clearScreen();
            
            this.game.context.font = '30px Tahoma';
            this.game.context.textAlign = 'topleft';
            
            this.game.context.fillText(`welcome to oss: ${this.game.username}!`, this.game.canvas.width / 30, 30);
            
            this.buttons.forEach(button => {
                if (button && button.img) {
                    this.game.context.drawImage(button.img, button.x, button.y);
                }
            });

            this.bindEvents();
        }

        bindEvents() {
            console.log("Binding Main Menu Events");
            this.game.canvas.addEventListener('click', this.handleClick);
        }

        handleClick(event) {
            const { offsetX, offsetY } = event;
            
            this.buttons.forEach(button => {
                if (offsetX > button.x && offsetX < button.x + button.width &&
                    offsetY > button.y && offsetY < button.y + button.height) {
                    if (button.action) {
                        button.action(); 
                    }
                }
            });
        }
    }

export default class MainMenu extends PIXI.Container {
    constructor(app, loadScreen) {
        super();

        this.buttonHandlers = [];

        const bg = PIXI.Sprite.from('Resources/menu-background.png');
        this.addChild(bg);

        const buttons = [
            { text: 'Play Mode', image: 'menu-button-play.png', x: 160, y: 115, onClick: () => loadScreen('SongSelect') },
            { text: 'Edit', image: 'menu-button-edit.png', x: 193, y: 219, onClick: () => loadScreen('Options') },
            { text: 'Options', image: 'menu-button-options.png', x: 170, y: 320, onClick: () => loadScreen('Options') },
            { text: 'Exit', image: 'menu-button-exit.png', x: 150, y: 420, onClick: () => app.stop() },
        ];

        buttons.forEach(({ image, x, y, onClick }) => {
            const button = PIXI.Sprite.from(`Resources/${image}`);
            button.interactive = true;
            button.buttonMode = true;

            button.x = x;
            button.y = y;

            const hoverXOffset = 32;
            const hoverTint = 0xff9999; 

            const originalX = button.x;
            let targetX = originalX;
            let targetTint = 0xFFFFFF; 

            const pointerOverHandler = () => {
                targetX = originalX + hoverXOffset;
                targetTint = hoverTint;
            };
            
            const pointerOutHandler = () => {
                targetX = originalX;
                targetTint = 0xFFFFFF;
            };
            
            const pointerDownHandler = onClick;

            button.on('pointerover', pointerOverHandler);
            button.on('pointerout', pointerOutHandler);
            button.on('pointerdown', pointerDownHandler);

            this.buttonHandlers.push({
                button,
                handlers: {
                    pointerover: pointerOverHandler,
                    pointerout: pointerOutHandler,
                    pointerdown: pointerDownHandler
                }
            });

            this.addChild(button);

            button.tickerCallback = () => {
                button.x += (targetX - button.x) * 0.12;

                const currentTint = button.tint;
                const r = (currentTint >> 16) & 0xFF;
                const g = (currentTint >> 8) & 0xFF;
                const b = currentTint & 0xFF;

                const targetR = (targetTint >> 16) & 0xFF;
                const targetG = (targetTint >> 8) & 0xFF;
                const targetB = targetTint & 0xFF;

                const newR = Math.round(r + (targetR - r) * 0.1);
                const newG = Math.round(g + (targetG - g) * 0.1);
                const newB = Math.round(b + (targetB - b) * 0.1);

                button.tint = (newR << 16) + (newG << 8) + newB;
            };
            
            app.ticker.add(button.tickerCallback);
        });

        const logo = PIXI.Sprite.from('Resources/menu-osu.png');
        logo.x = 0;
        logo.y = 20;
        this.addChild(logo);
        
        this.app = app;
    }
    
    cleanup() {
        this.buttonHandlers.forEach(({ button, handlers }) => {
            button.interactive = false;
            
            if (handlers.pointerover) button.off('pointerover', handlers.pointerover);
            if (handlers.pointerout) button.off('pointerout', handlers.pointerout);
            if (handlers.pointerdown) button.off('pointerdown', handlers.pointerdown);
            
            if (button.tickerCallback) {
                this.app.ticker.remove(button.tickerCallback);
            }
        });
        
        this.buttonHandlers = [];
    }
}
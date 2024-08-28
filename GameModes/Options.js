export default class Options extends PIXI.Container {
    constructor(app, loadScreen) {
        super();

        // Background
        const bg = PIXI.Sprite.from('assets/images/options_background.png');
        this.addChild(bg);

        // Back Button
        const backButton = new PIXI.Text('Back to Menu', { fill: 'white', fontSize: 32 });
        backButton.interactive = true;
        backButton.buttonMode = true;
        backButton.x = app.view.width / 2 - backButton.width / 2;
        backButton.y = app.view.height - 100;
        backButton.on('pointerdown', () => loadScreen('MainMenu'));
        this.addChild(backButton);
    }
}

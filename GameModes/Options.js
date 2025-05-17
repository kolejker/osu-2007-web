export default class Options extends PIXI.Container {
    constructor(app, loadScreen) {
        super();
        const BackButton = PIXI.Sprite.from('Resources/menu-back.png');
        const bg = PIXI.Sprite.from('Resources/menu-background.png');
        this.addChild(bg);


        BackButton.interactive = true;
        BackButton.buttonMode = true;

        BackButton.y = app.view.height - BackButton.height;
        BackButton.on('pointerdown', () => loadScreen('MainMenu'));
        this.addChild(BackButton);
    }
}

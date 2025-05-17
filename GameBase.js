const app = new PIXI.Application({
    width: 1024,
    height: 768,
    backgroundColor: 0x000000
});

document.body.appendChild(app.view);

let currentScreen;

function loadScreen(screenModule) {
    if (currentScreen) {
        if (currentScreen.cleanup) {
            currentScreen.cleanup();
        }
        app.stage.removeChild(currentScreen);
        currentScreen.destroy({ children: true });
    }
    
    import(`./GameModes/${screenModule}.js`).then(module => {
        currentScreen = new module.default(app, loadScreen);
        app.stage.addChild(currentScreen);
    });
}

loadScreen('MainMenu');
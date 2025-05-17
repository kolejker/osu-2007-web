
export default class HPBar extends PIXI.Container {
    constructor() {
      super(); 
      this.HPBarTexture = PIXI.Texture.from('Resources/scorebar-bg.png');
      const hpBar = new PIXI.Sprite(this.HPBarTexture);
      hpBar.x = 0;
      hpBar.y = 0;
      this.addChild(hpBar);
    }
  }
  
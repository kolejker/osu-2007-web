export default class PlayfieldScaler {
    constructor(screenWidth = 1024, screenHeight = 768) {
        // Store the screen dimensions
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        
        // Calculate the playfield height (80% of screen height)
        this.playfieldHeight = this.screenHeight * 0.8;
        
        // Calculate the playfield width (4/3 ratio of playfield height)
        this.playfieldWidth = (4 / 3) * this.playfieldHeight;
        
        // Calculate the scale factor from osu! coordinates to screen coordinates
        this.scale = this.playfieldHeight / 384;
        
        // Calculate the left and top positions for the playfield
        this.playfieldLeft = (this.screenWidth - this.playfieldWidth) / 2;
        
        // Apply the 2% vertical offset
        const verticalOffset = this.playfieldHeight * 0.02;
        this.playfieldTop = (this.screenHeight - this.playfieldHeight) / 2 + verticalOffset;
    }
    
    // Convert osu! X coordinate to screen X coordinate
    mapX(osuX) {
        return (osuX * this.scale) + this.playfieldLeft;
    }
    
    // Convert osu! Y coordinate to screen Y coordinate
    mapY(osuY) {
        return (osuY * this.scale) + this.playfieldTop;
    }
    
    // Map an object's position from osu! coordinates to screen coordinates
    mapPosition(osuX, osuY) {
        return {
            x: this.mapX(osuX),
            y: this.mapY(osuY)
        };
    }
    
    // Map a size value from osu! units to screen units
    mapSize(size) {
        return size * this.scale;
    }
    
    // Get the dimensions of the playfield in screen coordinates
    getPlayfieldDimensions() {
        return {
            width: this.playfieldWidth,
            height: this.playfieldHeight,
            left: this.playfieldLeft,
            top: this.playfieldTop,
            right: this.playfieldLeft + this.playfieldWidth,
            bottom: this.playfieldTop + this.playfieldHeight
        };
    }
    
    // Create a visual representation of the playfield (useful for debugging)
    createPlayfieldOverlay() {
        const graphics = new PIXI.Graphics();
        
        // Draw playfield border
        graphics.lineStyle(2, 0x00FF00, 0.5);
        graphics.drawRect(
            this.playfieldLeft, 
            this.playfieldTop, 
            this.playfieldWidth, 
            this.playfieldHeight
        );
        
        // Draw center lines
        graphics.lineStyle(1, 0x00FF00, 0.3);
        const centerX = this.playfieldLeft + this.playfieldWidth / 2;
        const centerY = this.playfieldTop + this.playfieldHeight / 2;
        
        graphics.moveTo(centerX, this.playfieldTop);
        graphics.lineTo(centerX, this.playfieldTop + this.playfieldHeight);
        
        graphics.moveTo(this.playfieldLeft, centerY);
        graphics.lineTo(this.playfieldLeft + this.playfieldWidth, centerY);
        
        return graphics;
    }
    
    // Update the scaler with new screen dimensions
    updateScreenSize(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        
        // Recalculate all dimensions
        this.playfieldHeight = this.screenHeight * 0.8;
        this.playfieldWidth = (4 / 3) * this.playfieldHeight;
        this.scale = this.playfieldHeight / 384;
        this.playfieldLeft = (this.screenWidth - this.playfieldWidth) / 2;
        
        const verticalOffset = this.playfieldHeight * 0.02;
        this.playfieldTop = (this.screenHeight - this.playfieldHeight) / 2 + verticalOffset;
    }
}
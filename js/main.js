window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game( 1000, 600, Phaser.AUTO, 'game', { preload: preload, create: create, update: update } );
    
    function preload() {
        game.load.image( 'bomb', 'assets/bomb.png' );
        game.load.image( 'mario', 'assets/mario.png' );
        game.load.audio( 'gunshot', 'assets/gunshot.ogg');
    }
    
    var player;
    var enemy1;
    var enemy2;
    var enemy3;
    var text;
    var loose = false;
    var enemySpeed = 1.0005;
    var time;
    var sound;
    
    function create() {
    	
    	sound = game.add.audio('gunshot');
    	sound.allowMultiple = true;
    	
    	sound.addMarker('gun', 0.1, .5);
    	
        // Create a sprite at the center of the screen using the 'logo' image.
        player = game.add.sprite( game.world.centerX, game.world.centerY, 'mario' );
        enemy1 = game.add.sprite( game.world._width * game.rnd.frac(), game.world._height * game.rnd.frac(), 'bomb' );
        enemy2 = game.add.sprite( game.world._width * game.rnd.frac(), game.world._height * game.rnd.frac(), 'bomb' );
        enemy3 = game.add.sprite( game.world._width * game.rnd.frac(), game.world._height * game.rnd.frac(), 'bomb' );

        // Anchor the sprite at its center, as opposed to its top-left corner.
        // so it will be truly centered.
        player.anchor.setTo( 0.5, 0.5 );
        enemy1.anchor.setTo( 0.5, 0.5 );
        enemy2.anchor.setTo( 0.5, 0.5 );
        enemy3.anchor.setTo( 0.5, 0.5 );
        
        // Turn on the arcade physics engine for this sprite.
        game.physics.enable( player, Phaser.Physics.ARCADE ); 
        game.physics.enable( enemy1, Phaser.Physics.ARCADE );    
        game.physics.enable( enemy2, Phaser.Physics.ARCADE );
        game.physics.enable( enemy3, Phaser.Physics.ARCADE );
        
        // Make it bounce off of the world bounds.
        player.body.collideWorldBounds = true;
        enemy1.body.collideWorldBounds = true;
        enemy2.body.collideWorldBounds = true;
        enemy3.body.collideWorldBounds = true;
        
        // Adjust size of the sprites
        enemy1.scale.setTo( .1, .1 );
        enemy2.scale.setTo( .05, .05 );
        enemy3.scale.setTo( .05, .05 );
        player.scale.setTo( .05, .05 );
        
        // Adjust size of physics body for mario, so enemy has to actually pass through center of image to collide
        player.body.setSize(player.body.width *.1, player.body.height*.1);
        
        enemy1.body.velocity.setTo(200,200);
        enemy1.body.bounce.setTo(1,1);
        
        enemy2.body.velocity.setTo(300,300);
        enemy2.body.bounce.setTo(1,1);

        enemy3.body.velocity.setTo(310,270);
        enemy3.body.bounce.setTo(1,1);
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo( 0.5, 0.0 );
    }
    
    function update() {
		if(!loose) {
			//Make mario follow the mouse
		    player.x = game.input.mousePointer.x;
		    player.y = game.input.mousePointer.y;
		    
		    //update timer display
		    time = this.game.time.totalElapsedSeconds();
		    text.setText(time.toFixed(2));

		    //check collision between mario and the enemies
		    game.physics.arcade.overlap(player, [enemy1, enemy2, enemy3], updateText);
	       
		    if(enemy1.body.blocked.up || enemy1.body.blocked.down || enemy1.body.blocked.left || enemy1.body.blocked.right) { 
		    	sound.play('gun');
	    	}
		    if(enemy2.body.blocked.up || enemy2.body.blocked.down || enemy2.body.blocked.left || enemy2.body.blocked.right) { 
		    	sound.play('gun');
	    	}
		    if(enemy3.body.blocked.up || enemy3.body.blocked.down || enemy3.body.blocked.left || enemy3.body.blocked.right) { 
		    	sound.play('gun');
	    	}
		    
		    //Speed up enemies
		    enemy1.body.velocity.setTo(enemy1.body.velocity.x * enemySpeed, enemy1.body.velocity.y *enemySpeed);
	        enemy2.body.velocity.setTo(enemy2.body.velocity.x * enemySpeed, enemy2.body.velocity.y *enemySpeed);
	        enemy3.body.velocity.setTo(enemy3.body.velocity.x * enemySpeed, enemy3.body.velocity.y *enemySpeed);    
		}
    }
    
    function updateText() {
    	if(time > 3.0) {//give some time to start, so you dont die immediately if enemy spawns on top of you
		    text.setText("Game Over!\nYou lasted: " + time.toFixed(2) + " seconds!");
	    	loose = true;
	    	sound.play('gun');
    	}
    }
};

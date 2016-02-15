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
    var G = 2000.0; // Gravitational constant
    
    function create() {
        game.physics.startSystem(Phaser.Physics.P2JS);
    	// Create sound sprite
    	sound = game.add.audio('gunshot');
    	sound.allowMultiple = true;
    	sound.addMarker('gun', 1.1, 1.0);
    	
        // Create a sprite at the center of the screen using the 'logo' image.
        player = game.add.sprite(game.world.centerX, game.world.centerY, 'mario' );
        enemy1 = game.add.sprite(game.world.centerX, game.world._height/4, 'bomb' );
         // Adjust size of the sprites
        enemy1.scale.setTo(.01, .01);
        player.scale.setTo(.05, .05);
        // Turn on the arcade physics engine for this sprite.
        game.physics.p2.enable(player); 
        game.physics.p2.enable(enemy1); 
        player.body.setCircle(16);
    
        enemy1.body.velocity.x = 130;
        
        player.body.mass = 10.0;
        enemy1.body.mass = 0.5;
        
        
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo( 0.5, 0.0 );
    }
    
    function update() {


            
        var distance = get_distance(enemy1, player);
        var angle = get_angle(enemy1, player);
        var mass_product = get_mass_product(enemy1, player);
        enemy1.body.force.x = G * mass_product * Math.cos(angle) / distance;    // accelerateToObject 
        enemy1.body.force.y = G * mass_product * Math.sin(angle) / distance;
        player.body.force.x = G * mass_product * -Math.cos(angle) / distance;    // accelerateToObject 
        player.body.force.y = G * mass_product * -Math.sin(angle) / distance; 
		
    }
    
    
    function updateText() {
    	if(time > 3.0) {//give some time to start, so you dont die immediately if enemy spawns on top of you
		    text.setText("Game Over!\nYou lasted: " + time.toFixed(2) + " seconds!");
	    	loose = true;
	    	sound.play('gun');
    	}
    }
    
    
    function get_angle(object1, object2) {
        return Math.atan2(object2.y - object1.y, object2.x - object1.x);
    }
    
    function get_distance(object1, object2) {
        return Math.sqrt(((object2.x - object1.x) * (object2.x - object1.x)) +((object2.y - object1.y) *  (object2.y - object1.y)));
    }
    
    function get_mass_product(object1, object2) {
        return object1.body.mass * object2.body.mass;
    }
};

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
    var G = 10.0; // Gravitational constant
    var masses;
    var accel_max = 0.05;
    var force_max = 10.0;
    
    function create() {
        game.physics.startSystem(Phaser.Physics.P2JS);
    	// Create sound sprite
//    	sound = game.add.audio('gunshot');
//    	sound.allowMultiple = true;
//    	sound.addMarker('gun', 1.1, 1.0);
    	
        masses = game.add.group();
        
        
        // Create a sprite at the center of the screen using the 'logo' image.
        player = masses.create(100, game.world.centerY, 'mario' );
        for (var i = 0; i < 100; i++) {
            var mass = masses.create(game.rnd.integerInRange(0,800), game.rnd.integerInRange(0,800), 'bomb');
            mass.scale.setTo(0.005,0.005);
            game.physics.p2.enable(mass);
            mass.body.setCircle(2);
            mass.body.mass = 0.001;
        }

        
         // Adjust size of the sprites
        player.scale.setTo(.01, .01);
        // Turn on the arcade physics engine for this sprite.
        game.physics.p2.enable(player);  
        player.body.setCircle(10);
    
        
        player.body.mass = 80.0;

        
        
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo( 0.5, 0.0 );
    }
    
    function update() {
        player.body.x = game.input.mousePointer.x;
        player.body.y = game.input.mousePointer.y;
        apply_forces(masses);
    }
    
    function get_angle(object1, object2) {
        return Math.atan2(object2.y - object1.y, object2.x - object1.x);
    }
    
    function get_r2(object1, object2) {
        return ((object2.x - object1.x) * (object2.x - object1.x)) + ((object2.y - object1.y) *  (object2.y - object1.y));
    }
    
    function apply_forces(group) {
        var mass_product_sum = get_product_sum(group);  
        var mass_sum = get_mass_sum(group);

        
        // F = G * m1m2/r^2
        
        group.forEachAlive(function(item) {
            
            var com_x = (mass_product_sum.x - (item.body.mass * item.x)) / (mass_sum - item.body.mass);
            var com_y = (mass_product_sum.y - (item.body.mass * item.y)) / (mass_sum - item.body.mass);
            
            
            
            var angle = get_angle(item, {"x":com_x, "y":com_y});
            var r2 = get_r2(item, {"x":com_x, "y":com_y});
            
            item.body.force.x = (G * Math.cos(angle) * mass_product_sum.x / r2);
            item.body.force.y = (G * Math.sin(angle) * mass_product_sum.y / r2);
            constrain_force(item);
        });
        
    
    }
    
    function get_mass_sum(group) {
        var sum = 0.0;
        group.forEachAlive(function(item) {
            sum += item.body.mass;
        });
        return sum;
    } 
    
    function get_product_sum(group) {
        var sum_x = 0.0;
        var sum_y = 0.0;
        group.forEachAlive(function(item) {
            sum_x += item.body.mass * item.x;
            sum_y += item.body.mass * item.y;
        });
        
        return {"x" : sum_x, "y" : sum_y};
    }
    
    function constrain_acceleration(object) {
        var accel_x = object.body.force.x/object.body.mass;
        var accel_y = object.body.force.y/object.body.mass;
        
        if(accel_x > accel_max) {
            object.body.force.x = accel_max * object.body.mass;
        } else if (accel_x < -accel_max) {
            object.body.force.x = -accel_max * object.body.mass;
        }
        
        if(accel_y > accel_max) {
            object.body.force.y = accel_max * object.body.mass;
        } else if (accel_x < -accel_max) {
            object.body.force.y = -accel_max * object.body.mass;
        }
        
    }
    
    function constrain_force(object) {
        var force_x = object.body.force.x;
        var force_y = object.body.force.y;
        
        if(force_x > force_max) {
            object.body.force.x = force_max;
        } else if(force_x < -force_max) {
            object.body.force.x = -force_max;
        }
        
        if(force_y > force_max) {
            object.body.force.y = force_max;
        } else if(force_y < -force_max) {
            object.body.force.y = -force_max;
        }
    }
};

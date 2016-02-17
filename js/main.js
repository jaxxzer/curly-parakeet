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
    
    var game = new Phaser.Game( 1000, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render} );
    
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
    var G = 0.1; // Gravitational constant
    var masses;
    var accel_max = 100.0;
    var force_max = 0.1;
    
    var circle;
    var sprite;
    var massCollisionGroup;
    var mass;
    
    var enemyDensity = .01;
    var playerDensity = 100;
//    var playerDensity = 1000;
    
    function create() {
        game.world.setBounds(0, 0, 5000,5000);
        game.physics.startSystem(Phaser.Physics.P2JS);
    	// Create sound sprite
//    	sound = game.add.audio('gunshot');
//    	sound.allowMultiple = true;
//    	sound.addMarker('gun', 1.1, 1.0);
    	massCollisionGroup = game.physics.p2.createCollisionGroup();
//        game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        game.physics.p2.setImpactEvents(true);
        
        masses = game.add.group();
        
        // Create a sprite at the center of the screen using the 'logo' image.
        player = masses.create(game.world.centerX, game.world.centerY, 'bomb' );
                    game.camera.follow(player);
            game.camera.deadzone = new Phaser.Rectangle(100, 100, 800, 400);
        
        game.physics.p2.enable(player); 

                
        player.body.mass = 1.0;
        player.body.density = playerDensity;
        // Adjust size of the sprites
        player.scale.setTo(player.body.mass/playerDensity);
        player.body.setCircle(player.height *.6);
        // Turn on the arcade physics engine for this sprite.
        player.body.setCollisionGroup(massCollisionGroup);
        player.body.collides(massCollisionGroup);
        player.body.createGroupCallback(massCollisionGroup, absorb, this);
        player.body.debug = true;
        
        for (var i = 0; i < 2000; i++) {
            mass = masses.create(game.rnd.integerInRange(0,game.world.width), game.rnd.integerInRange(0,game.world.height), 'bomb');
            game.physics.p2.enable(mass);
            mass.body.density = enemyDensity;
            if (i % 30 == 0) {
                mass.body.mass = player.body.mass/3000;
//                mass.body.mass = 0.1
            } else {
                mass.body.mass = player.body.mass/10000;
//                mass.body.mass = 0.1
            }
            
            updateSize(mass);
//            mass.body.setCollisionGroup(massCollisionGroup);
            mass.body.collides(massCollisionGroup);
            

        }

        

        
        
        
    

            
        
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo( 0.5, 0.0 );
    }
    
    function render() {

        game.debug.body(player);
           var zone = game.camera.deadzone;

    game.context.fillStyle = 'rgba(255,0,0,0.6)';
    game.context.fillRect(zone.x, zone.y, zone.width, zone.height);

    game.debug.cameraInfo(game.camera, 32, 32);
//        game.debug.bodyInfo(playerbody.debugBody, 32, 32);
    }
    
    function absorb(body1, body2) {
        body1.mass += body2.mass;
        updateSize(body1.sprite);
//        body1.sprite.scale.setTo(body1.mass/playerDensity);
//        body1.setCircle(body1.sprite.height * .6);
//        body1.setCollisionGroup(massCollisionGroup);
        resetBody(body2);
    }
    
    function updateSize(sprite) {
        sprite.scale.setTo(sprite.body.mass/sprite.body.density);
        sprite.body.setCircle(sprite.height);
        sprite.body.setCollisionGroup(massCollisionGroup);
    }
    
    function resetBody(body) {
        var side = game.rnd.integerInRange(1,4);
        var newX, newY;
        switch(side) {
            case 1: // Top
                newX = game.rnd.integerInRange(-100, game.world.width+100);
                newY = game.rnd.integerInRange(-150,-50);
                break;
            case 2: // Bottom
                newX = game.rnd.integerInRange(-100, game.world.width+100);
                newY = game.rnd.integerInRange(game.world.height + 50, game.world.height + 150);
                break;
            case 3: // Left
                newX = game.rnd.integerInRange(-150,-50);
                newY = game.rnd.integerInRange(-100, game.world.height + 100);
                break;
            case 4: // Right
            default:
                newX = game.rnd.integerInRange(game.world.width + 50, game.world.width + 150);
                newY = game.rnd.integerInRange(-100, game.world.height + 100);
                
        }
        text.setText("w: " + game.world.width + " h: " + game.world.height + "\nnewX: " + newX + " newY: " + newY);
 
        
        body.reset(newX, newY);
        //body.inView = false;
        body.mass = game.rnd.frac() * player.body.mass /10000;
        updateSize(body.sprite);
        
    }
    
    
    
    function update() {
        player.body.x = game.camera.x + game.input.mousePointer.x;
        player.body.y = game.camera.y + game.input.mousePointer.y;
        
//        player.body.force.x = 
        apply_forces(masses);
//        text.setText("Mass: " + player.body.mass.toFixed(6));
//                text.setText("InView: " + mass.body.inView);

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
            constrain_acceleration(item);
            
//            if(item.body.inView == false) {
//                if(item.body.x > 0 && item.body.x < game.)
//            }
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
        } else if (accel_y < -accel_max) {
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

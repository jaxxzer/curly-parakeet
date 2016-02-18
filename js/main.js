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
        game.load.audio('blip', 'assets/Blip.ogg');
        game.load.spritesheet('asteroid', 'assets/asteroid_sprite_sheet.png', 128, 128, 32);
    }
    
    var player;
    var text;
    
    var G = 0.50; // Gravitational constant
    var accel_max = 200.0; // Factor to limit acceleration on sprites, so they don't wizz off
    
    var masses; // Group of all masses in the game
    var massCollisionGroup; // CollisionGroup for the masses
    var mass;
    
    var enemyDensity = 100.0; // Density of enemies
    var playerDensity = 100.0; // Density of the player
    
    var playerStartMass = 100.0; // The initial mass of the player
    
    var numEnemies = 1000; // Number of masses other than the player that will be created
    
    var asteroid;
    var spin;
    var sound;
    
    function create() {
        // Create sound sprite for blip noise
    	sound = game.add.audio('blip');
    	sound.allowMultiple = true;
    	sound.addMarker('blip', 0.0, 1.0);
        
        // Set the playable area
        game.world.setBounds(0, 0, 2000,2000);
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        
        //Create new CollisionGroup for the masses
    	massCollisionGroup = game.physics.p2.createCollisionGroup();
        game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        game.physics.p2.setImpactEvents(true);
        
        // All masses are a part of this group
        masses = game.add.group();
        
        // Create a sprite at the center of the screen using the 'logo' image.
        player = masses.create(game.world.centerX, game.world.centerY, 'asteroid' );
        
        // Camera will follow player around the playable area
        game.camera.follow(player);
        game.camera.deadzone = new Phaser.Rectangle(100, 100, 800, 400);
        
        // P2 physics suits all masses
        game.physics.p2.enable(player); 

        // Initialize relative physical parameters of the player
        player.body.mass = playerStartMass;
        player.body.density = playerDensity;
        updateSize(player); // Adjust size of the sprite
        
        // Enable collisions between the player and children of massCollisionGroup
        player.body.collides(massCollisionGroup);
        
        // Set the callback method when player collides with another mass
        player.body.createGroupCallback(massCollisionGroup, absorb, this);
        
//        player.body.debug = true; // Will show the P2 physics body
        
        // Animate the player sprite
        spin = player.animations.add('spin');
        player.animations.play('spin', 15, true);
        
        for (var i = 0; i < numEnemies; i++) {
            mass = masses.create(game.rnd.integerInRange(0,game.world.width), game.rnd.integerInRange(0,game.world.height), 'asteroid');
            game.physics.p2.enable(mass);
            mass.body.density = enemyDensity;
            newEnemy(mass);
            
            spin = mass.animations.add('spin');
            mass.animations.play('spin', game.rnd.integerInRange(5,25), true);

            mass.body.collides(massCollisionGroup);
            mass.body.collideWorldBounds = false;
        }

        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo(0.5, 0.0);
    }
    
    function update() {
        player.body.mass *= 0.9997; // Player looses mass at a rate proportional to current mass
        
        apply_forces(masses); // Apply gravitational force calculation to every mass in the game

        // Add gravitational force between the player and the mouse, so that the player can be moved with the mouse
        var angle = get_angle(player.body, {"x":game.input.mousePointer.x+game.camera.x, "y":game.input.mousePointer.y+game.camera.y});
        var r2 = get_r2(player.body, {"x":game.input.mousePointer.x+game.camera.x, "y":game.input.mousePointer.y+game.camera.y});
        
        player.body.force.x += (10000 * G * Math.cos(angle) * player.body.mass * player.body.mass / r2);
        player.body.force.y += (10000 * G * Math.sin(angle) * player.body.mass * player.body.mass / r2);
        constrain_acceleration(player);
        
        debugGame(); // Display some text with information
    }
    
    function render() {
//        game.debug.body(player);
//        game.debug.cameraInfo(game.camera, 32, 32);
    }
    
    function debugGame () {
        text.setText("\
                        player.mass: " 
                    + player.body.mass.toFixed(4)
                    + "\nplayer.radius: "
                    + player.height/2);
        text.x = game.camera.x + text.width;
        text.y = game.camera.y + game.camera.height - text.height;
    }
    
    function absorb(body1, body2) {
        sound.play('blip');
        body1.mass += body2.mass; // Player absorbs mass
        updateSize(body1.sprite); // Player grows
        resetBody(body2); // Reset the mass that was absorbed
    }
    
    function updateSize(sprite) {
        sprite.scale.setTo(Math.cbrt(sprite.body.mass/sprite.body.density)); // Update size based on mass and density
        sprite.body.setCircle(sprite.height/3); // Create new body to fit new size
        sprite.body.setCollisionGroup(massCollisionGroup); // CollisionGroup must be updated when a new body is created
    }
    
    // Recycle an enemy mass by moving it offscreen and giving it a new mass
    function resetBody(body) {
        var side = game.rnd.integerInRange(1,4);
        var newX, newY;
        switch(side) { // Chose an edge of the world to locate the sprite (offscreen)
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
        
        body.reset(newX, newY); // Put the sprite there
        newEnemy(body.sprite); // Give the sprite a new mass / size
    }
    
    // This will spawn new enemies according to the context of the game
    // Enemy types might be asteroids, planets, moons, stars, comets, dust, or black holes
    // The likleyhood of each type of enemy spawning could be set to tune gameplay experience
    function newEnemy(sprite) {
        sprite.body.mass = 10 * game.rnd.frac() * player.body.mass/numEnemies;
        updateSize(sprite);
    }
    
    // Returns the angle between two objects
    function get_angle(object1, object2) {
        return Math.atan2(object2.y - object1.y, object2.x - object1.x);
    }
    
    // Returns the distance squared between two objects
    function get_r2(object1, object2) {
        return ((object2.x - object1.x) * (object2.x - object1.x)) + ((object2.y - object1.y) *  (object2.y - object1.y));
    }
    
    // Calculates the center of mass for the entire set of masses in a group, then applies a gravitational force to each mass in the group towards the center of mass
    function apply_forces(group) {
        var mass_product_sum = get_product_sum(group);  
        var mass_sum = get_mass_sum(group);

        // F = G * m1m2/r^2
        group.forEachAlive(function(item) {
            
            // Calculate center of mass, excluding the current mass
            var com_x = (mass_product_sum.x - (item.body.mass * item.x)) / (mass_sum - item.body.mass);
            var com_y = (mass_product_sum.y - (item.body.mass * item.y)) / (mass_sum - item.body.mass);
            
            var angle = get_angle(item, {"x":com_x, "y":com_y}); // Angle between current mass and center of mass
            var r2 = get_r2(item, {"x":com_x, "y":com_y}); // Angle between current mass and the center of mass
            
            item.body.force.x = (G * Math.cos(angle) * mass_product_sum.x / r2);
            item.body.force.y = (G * Math.sin(angle) * mass_product_sum.y / r2);
            
            constrain_acceleration(item); // Limit acceleration
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
    
    // This will constrain the acceleration on an object to a maximum magnitude
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
    
    // This will constrain the force on an object to a maximum magnitude
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

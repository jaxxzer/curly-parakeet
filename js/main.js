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
    
    var game = new Phaser.Game( 1000, 800, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render} );
    
    function preload() {
        game.load.audio('blip', 'assets/Blip.ogg');
        game.load.spritesheet('asteroid', 'assets/asteroid_sprite_sheet.png', 128, 128, 32);
        game.load.image('peg', 'assets/blueball.png');
        game.load.image('cannon', 'assets/cannon.png');
    }
    
    var bonusAdder = 0;
    var bonusMultiplier = 1;
    var cannon;
    var text;
    
    var spacing = 32;
    var centerOffset = 60;
    var numRings = 5;
    
    var G = 0.50; // Gravitational constant
    var accel_max = 200.0; // Factor to limit acceleration on sprites, so they don't wizz off
    
    var maxRadius = 300;
    
    var pegs; // Group of all masses in the game
    var pegCollisionGroup; // CollisionGroup for the masses

    var playBall;

    var asteroid;
    var spin;
    var sound;
    
    var score = 0;
    
    var cursors;
    var ballsRemaining = 10;
    
    //var bucket;
    
    var pegGameState = 0;
    
        var myText;
    
    function create() {
        // Create sound sprite for blip noise
    	sound = game.add.audio('blip');
    	sound.allowMultiple = true;
    	sound.addMarker('blip', 0.0, 1.0);
        
        
        // Set the playable area
        game.world.setBounds(0, 0, 1000, 800);
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        
        // How much of the ball's velocity is recovered after a collision
        game.physics.p2.restitution = 0.8;
        
        
        var bucketCollisionGroup = game.physics.p2.createCollisionGroup();
        var ballCollisionGroup = game.physics.p2.createCollisionGroup();
    	pegCollisionGroup = game.physics.p2.createCollisionGroup();
        game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        game.physics.p2.setImpactEvents(true);
        
        pegs = game.add.group();
        

        var radius, numPegs;
        var angle, peg;
        for (var i = 0; i < numRings; i++) {
            radius = i * spacing + centerOffset;
            var numPegs = Math.floor(((i + 1) * 8 + (i * .5)));
            for (var j = 0; j < numPegs; j++) {
                angle = (j * 2 * Math.PI/numPegs) + ((2 * Math.PI)/(numRings+1)) * i;
                var peg = pegs.create(0, 0, 'peg');
                peg.anchor.setTo(0.5, 0.5);
                peg.scale.setTo(0.02);
                game.physics.p2.enable(peg);
                peg.body.setCircle(peg.height/2);
                peg.body.x = game.world.centerX + radius * (Math.cos(angle));
                peg.body.y = game.world.centerY + radius * (Math.sin(angle));
                peg.body.setCollisionGroup(pegCollisionGroup);
                peg.body.collides(ballCollisionGroup);
                peg.body.static = true;
                peg.body.type = 'blue';
                peg.tint = 0x0000ff;
            } 
            peg.body.type = 'green';
            peg.tint = 0x00ff00;
        }
        
        cannon = game.add.sprite(0, 0, 'cannon');
        cannon.playAngle = 0;
        cannon.scale.setTo(0.4);
        cannon.anchor.setTo(0.5, 0);
        
        playBall = game.add.sprite(0,0, 'peg');
        playBall.scale.setTo(0.07);
        playBall.anchor.setTo(0.5,0.5);
        game.physics.p2.enable(playBall);
        playBall.body.setCircle(playBall.height/2);
        playBall.body.damping = 0;
        playBall.body.setCollisionGroup(ballCollisionGroup);
        playBall.body.collides([pegCollisionGroup, bucketCollisionGroup]);
        playBall.body.createGroupCallback(pegCollisionGroup, pegCollisionCallBack, this);
        playBall.body.createGroupCallback(bucketCollisionGroup, bucketCallBack, this);
        playBall.body.debug = true;
        
        updateCannon();
        

        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo(0.5, 0.0);
        text.setText(game.world.centerX);
        
        // Game input
        cursors = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
        
        var bucket = new Phaser.Circle(game.world.centerX, game.world.centerY, centerOffset);
        //  Just to display the bounds
        var graphics = game.add.graphics(bucket.x, bucket.y);
        graphics.lineStyle(4, 0xffd900, 1);
        graphics.drawCircle(0, 0, 1.5 * bucket.radius);
        
//        var bucketBody = new Phaser.Physics.P2.Body({game: this.game, mass: 0, x: game.world.centerX, y: game.world.centerY});
        
        var bucketSprite = game.add.sprite(game.world.centerX, game.world.centerY, null);
        game.physics.p2.enable(bucketSprite);
        bucketSprite.body.static = true;
        bucketSprite.body.setCircle(bucket.radius * 0.75);
        bucketSprite.body.debug = true;
        bucketSprite.body.setCollisionGroup(bucketCollisionGroup);
        bucketSprite.body.collides(ballCollisionGroup);
        
        
        
        
        
        
    }
    
    function update() {
        //cannon.rotation++;
        

        
        
        //score = 100;
        if (pegGameState == 3) {
            text.setText("Final Score: " + score);
            text.y = 300;

        } else {
                    if (cursors.left.isDown) {
            cannon.playAngle += 0.025;
        } else if (cursors.right.isDown) {
            cannon.playAngle -= 0.025;
        } else if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
            if (pegGameState == 0) {
                fireBall();
            }
        }
            updateCannon();
               text.setText("Score: " + score + "\nBalls Remaining: " + ballsRemaining + "\nStreak Bonus: " + bonusAdder + "\nBonus Multiplier: " + bonusMultiplier);
        
            if (pegGameState == 1) {
                applyGravity();
            }     
        }


    }

    function pegCollisionCallBack(body1, body2) {
        pegs.remove(body2.sprite, true);

        
        if (body2.type == 'green') {
            bonusMultiplier *= 2;
        }
        var points = (100 + bonusAdder) * bonusMultiplier
        score += points;
        
        bonusAdder += 10;
        
        var myText;
        var style = { font: "18px Verdana", fill: "#ffffff", align: "center" };
        myText = game.add.text( body2.x, body2.y, 100, style );
        myText.anchor.setTo(0.5, 0.5);
        myText.setText(points);
        myText.x = body2.x;
        myText.y = body2.y;
        myText.alpha = 1;
        game.time.events.add(0, function() {
            game.add.tween(myText).to({y: body2.y - 30}, 500, Phaser.Easing.Linear.None, true);    game.add.tween(myText).to({alpha: 0}, 500, Phaser.Easing.Linear.None, true);
        }, this);
    }
    
    function applyGravity() {
        var angle = get_angle(playBall, {"x":game.world.centerX, "y":game.world.centerX});
        playBall.body.force.x = Math.cos(angle) * 200;
        playBall.body.force.y = Math.sin(angle) * 200;
    }
    
    function fireBall() {
        pegGameState = 1;
        ballsRemaining--;
        var angle = get_angle(playBall, {"x":game.world.centerX, "y":game.world.centerX});
        playBall.body.velocity.x = 100 * Math.cos(angle);
        playBall.body.velocity.y = 100 * Math.sin(angle);

    }
    
    function updateCannon() {
        //cannon.angle = 0;
        
        cannon.x = game.world.centerX + maxRadius * (Math.cos(cannon.playAngle));
        cannon.y = game.world.centerY + maxRadius * (Math.sin(cannon.playAngle));
        cannon.rotation = cannon.playAngle - Math.PI/2;
        
        if (pegGameState == 0) {
            playBall.body.x = cannon.x;
            playBall.body.y = cannon.y;  
        }
       
    }
    function bucketCallBack() {
        playBall.body.reset(cannon.x, cannon.y);
        bonusAdder = 0;
        bonusMultiplier = 1;
        if (ballsRemaining > 0) {
            pegGameState = 0;
        } else {
            pegGameState = 3;
        }
    }
    
    function render() {
        //game.debug.body(playBall);
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

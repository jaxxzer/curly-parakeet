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
        game.load.audio('bounce', 'assets/bounce.ogg');
        game.load.audio('bucket', 'assets/bucket.ogg');
        game.load.audio('bonus', 'assets/bonus.ogg');
        game.load.audio('shoot', 'assets/shoot.ogg');
        game.load.image('peg', 'assets/blueball.png');
        game.load.image('cannon', 'assets/cannon.png');
    }
    
    var bonusAdder = 0;
    var bonusMultiplier = 1;
    var cannon;
    var text;
    
    // Controls the peg layout
    var spacing = 32;
    var centerOffset = 60;
    var numRings = 5;
    
    var maxRadius = 300; // The circle that the cannon is constrained to
    
    var pegs; // Group of all pegs in the game

    var playBall; // The ball that the player fires
    
    var score = 0;
    
    var cursors; // Keyboard input
    var ballsRemaining = 10; // "Lives" or "Plays"
    
    // The current state of the game
    // 0: Player is aiming the ball
    // 1: Player has fired the ball, and the ball is falling
    // 3: Game Over
    var pegGameState = 0;
    
    var bounceSound, bucketSound, bonusSound, shootSound;
    
    function create() {
        // Create sound sprites
        bounceSound = game.add.audio('bounce');
        bounceSound.allowMultiple = true;
        bounceSound.addMarker('bounce', 0.0, 1.0);
        
        bonusSound = game.add.audio('bonus');
        bonusSound.allowMultiple = true;
        bonusSound.addMarker('bonus', 0.0, 1.0);
        
        bucketSound = game.add.audio('bucket');
        bucketSound.addMarker('bucket', 0.0, 1.0);
        
        shootSound = game.add.audio('shoot');
        shootSound.addMarker('shoot', 0.0, 1.0);
        
        // Set the playable area
        game.world.setBounds(0, 0, 1000, 800);
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        
        // How much of the ball's velocity is recovered after a collision
        game.physics.p2.restitution = 0.9;
        
        // Collision groups
        var bucketCollisionGroup = game.physics.p2.createCollisionGroup();
        var ballCollisionGroup = game.physics.p2.createCollisionGroup();
    	var pegCollisionGroup = game.physics.p2.createCollisionGroup();
        
        
        game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        game.physics.p2.setImpactEvents(true);
        
        // Create a circular array of pegs
        pegs = game.add.group();

        for (var i = 0; i < numRings; i++) {
            var radius = i * spacing + centerOffset;
            var numPegs = Math.floor(((i + 1) * 8 + (i * .5)));
            for (var j = 0; j < numPegs; j++) {
                var angle = (j * 2 * Math.PI/numPegs) + ((2 * Math.PI)/(numRings+1)) * i;
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
            peg.body.type = 'green'; // One bonus peg in each ring
            peg.tint = 0x00ff00;
        }
        
        // The cannon that the player moves
        cannon = game.add.sprite(0, 0, 'cannon');
        cannon.playAngle = 0;
        cannon.scale.setTo(0.4);
        cannon.anchor.setTo(0.5, 0);
        
        
        // The ball that the player shoots to knock down pegs
        playBall = game.add.sprite(0,0, 'peg'); // Reuse the peg sprite
        playBall.scale.setTo(0.05);
        playBall.anchor.setTo(0.5, 0.5);
        game.physics.p2.enable(playBall);
        playBall.body.setCircle(playBall.height/2);
        playBall.body.damping = 0.05; // "Drag"
        playBall.body.setCollisionGroup(ballCollisionGroup);
        playBall.body.collides([pegCollisionGroup, bucketCollisionGroup]);
        playBall.body.createGroupCallback(pegCollisionGroup, pegCollisionCallBack, this); // when we hit a peg
        playBall.body.createGroupCallback(bucketCollisionGroup, bucketCallBack, this); // when we fall into the center
        playBall.body.debug = true;
        
        updateCannon(); // Place the cannon in initial position
        

        // Some text for score status and balls remaining
        var style = { font: "25px Verdana", fill: "#9999ff", align: "left" };
        text = game.add.text( 120, 15, "", style );
        text.anchor.setTo(0.5, 0.0);
        text.setText(game.world.centerX);
        
        // Game keyboard input
        cursors = game.input.keyboard.createCursorKeys();
        game.input.keyboard.addKeyCapture([ Phaser.Keyboard.SPACEBAR ]);
        
        // A yellow circle drawn in the center
        var bucket = new Phaser.Circle(game.world.centerX, game.world.centerY, centerOffset);
        //  Just to display the bounds
        var graphics = game.add.graphics(bucket.x, bucket.y);
        graphics.lineStyle(4, 0xffd900, 1);
        graphics.drawCircle(0, 0, 1.5 * bucket.radius);
        
        // This null sprite allows for a physics body to be created for the center area
        // This "bucket" is where the balls eventually fall and dissappear
        var bucketSprite = game.add.sprite(game.world.centerX, game.world.centerY, null);
        game.physics.p2.enable(bucketSprite);
        bucketSprite.body.static = true;
        bucketSprite.body.setCircle(bucket.radius * 0.75);
        bucketSprite.body.debug = true;
        bucketSprite.body.setCollisionGroup(bucketCollisionGroup);
        bucketSprite.body.collides(ballCollisionGroup);   
    }
    
    function update() {
        if (pegGameState == 3) { // Game Over
            text.setText("Final Score: " + score);
            text.x = game.world.centerX;
            text.y = game.world.centerY - 50;
        } else {
            // Move the cannon
            if (cursors.left.isDown) {
                cannon.playAngle += 0.025;
            } else if (cursors.right.isDown) {
                cannon.playAngle -= 0.025;
            } else if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
                if (pegGameState == 0) {
                    fireBall();
                }
            }
            
            updateCannon(); // Move the cannon
            
            // Update score
            text.setText("Score: " + score + "\nBalls Remaining: " + ballsRemaining + "\nStreak Bonus: " + bonusAdder + "\nBonus Multiplier: " + bonusMultiplier);
        
            if (pegGameState == 1) { // Ball is falling, accelerate toward center
                applyGravity();
            }     
        }
    }

    // Called when the ball hits a peg
    function pegCollisionCallBack(body1, body2) {
        pegs.remove(body2.sprite, true); // Remove the peg from the group, and destroy the physics body
        
        if (body2.type == 'green') { // Green bonus pegs
            bonusMultiplier *= 2;
            bonusSound.play('bonus');
        } else { // Blue pegs
            bounceSound.play('bounce');
        }
        
        var points = (100 + bonusAdder) * bonusMultiplier
        score += points; // Accumulate the player's points
        
        bonusAdder += 10; // Accumulate a bonus for each successive peg hit with a single ball
        
        // Add a text animation for the points obtained from this peg
        var scoreText;
        var style = { font: "18px Verdana", fill: "#ffffff", align: "center" };
        scoreText = game.add.text( body2.x, body2.y, 100, style );
        scoreText.anchor.setTo(0.5, 0.5);
        scoreText.setText(points);
        scoreText.x = body2.x;
        scoreText.y = body2.y;
        scoreText.alpha = 1;
        game.time.events.add(0, function() {
            game.add.tween(scoreText).to({y: body2.y - 30}, 500, Phaser.Easing.Linear.None, true);    game.add.tween(scoreText).to({alpha: 0}, 500, Phaser.Easing.Linear.None, true);
        }, this);
    }
    
    // Accelerate the ball toward the bucket in the center
    function applyGravity() {
        var angle = get_angle(playBall, {"x":game.world.centerX, "y":game.world.centerY});
        playBall.body.force.x = Math.cos(angle) * 280;
        playBall.body.force.y = Math.sin(angle) * 280;
    }
    
    // Shoot the ball from the cannon
    function fireBall() {
        shootSound.play('shoot');
        pegGameState = 1; // Ball is falling toward bucket
        ballsRemaining--;
        
        // Apply initial velocity toward center
        var angle = get_angle(playBall, {"x":game.world.centerX, "y":game.world.centerX});
        playBall.body.velocity.x = 100 * Math.cos(angle);
        playBall.body.velocity.y = 100 * Math.sin(angle);
    }
    
    // Move the cannon in a circle around the play area
    function updateCannon() {
        cannon.x = game.world.centerX + maxRadius * (Math.cos(cannon.playAngle));
        cannon.y = game.world.centerY + maxRadius * (Math.sin(cannon.playAngle));
        cannon.rotation = cannon.playAngle - Math.PI/2; // Keep cannon pointed toward center
        
        if (pegGameState == 0) { // We are aiming (haven't shot), keep the ball atttached to the cannon
            playBall.body.x = cannon.x;
            playBall.body.y = cannon.y;  
        }
    }
    
    // Called when the ball has fallen into the center
    function bucketCallBack() {
        bucketSound.play('bucket');
        
        playBall.body.reset(cannon.x, cannon.y); // Move the ball back to the cannon and clear forces

        bonusAdder = 0; // Clear bonuses
        bonusMultiplier = 1;
        
        if (ballsRemaining > 0) {// Do we have any balls left?
            pegGameState = 0; // Yes, aiming
        } else {
            pegGameState = 3; // No, game over
        }
    }
    
    function render() {}
    
    // Returns the angle between two objects
    function get_angle(object1, object2) {
        return Math.atan2(object2.y - object1.y, object2.x - object1.x);
    }
};

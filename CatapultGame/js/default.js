// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    WinJS.strictProcessing();

    var canvas, context, stage;
    var bgImage, p1Image, p2Image, ammoImage, p1Lives, p2Lives, title, endGameImage;
    var bgBitmap, p1Bitmap, p2Bitmap, ammoBitmap;
    var preload;

    // calculate display scale factor  - original game assets assume 800x480
    var SCALE_X = window.innerWidth / 800;
    var SCALE_Y = window.innerHeight / 480;
    var MARGIN = 25;
    var GROUND_Y = 390 * SCALE_Y;

    var LIVES_PER_PLAYER = 3;
    var player1Lives = LIVES_PER_PLAYER;
    var player2Lives = LIVES_PER_PLAYER;

    var isShotFlying = false;
    var playerTurn = 1;
    var playerFire = false;
    var shotVelocity;

    var MAX_SHOT_POWER = 10;
    var GRAVITY = 0.07;


    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize
                // your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll());
        }
    };

    function initialize() {
        canvas = document.getElementById("gameCanvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context = canvas.getContext("2d");

        stage = new Stage(canvas);

        // use preloadJS to get sounds and images loaded before starting
       
        preload = new createjs.PreloadJS();
        preload.onComplete = prepareGame;
        var manifest = [
        { id: "screenImage", src: "images/Backgrounds/gameplay_screen.png" },
        { id: "redImage", src: "images/Catapults/Red/redIdle/redIdle.png" },
        { id: "blueImage", src: "images/Catapults/Blue/blueIdle/blueIdle.png" },
        { id: "ammoImage", src: "images/Ammo/rock_ammo.png" },
        { id: "winImage", src: "images/Backgrounds/victory" },
        { id: "loseImage", src: "images/Backgrounds/defeat.png" },
        { id: "blueFire", src: "images/Catapults/Blue/blueFire/blueCatapultFire.png" },
        { id: "redFire", src: "images/Catapults/Red/redFire/redCatapultFire.png" }
        ];
        preload.loadManifest(manifest);
    }

    function prepareGame()
    {
        // draw Bg first, others appear on top
        bgImage = preload.getResult("screenImage").result;
        bgBitmap = new Bitmap(bgImage);
        bgBitmap.scaleX = SCALE_X;
        bgBitmap.scaleY = SCALE_Y;
        stage.addChild(bgBitmap);

        // draw p1 catapult
        p1Image = preload.getResult("redImage").result;
        p1Bitmap = new Bitmap(p1Image);
        p1Bitmap.scaleX = SCALE_X;
        p1Bitmap.scaleY = SCALE_Y;
        p1Bitmap.x = MARGIN;
        p1Bitmap.y = GROUND_Y - p1Image.height * SCALE_Y;
        stage.addChild(p1Bitmap);

        // draw p2 catapult and flip
        p2Image = preload.getResult("blueImage").result;
        p2Bitmap = new Bitmap(p2Image);
        p2Bitmap.regX = p2Image.width;
        p2Bitmap.scaleX = -SCALE_X; // flip from right edge
        p2Bitmap.scaleY = SCALE_Y;
        p2Bitmap.x = canvas.width - MARGIN - (p2Image.width * SCALE_X);
        p2Bitmap.y = GROUND_Y - (p2Image.height * SCALE_Y);
        stage.addChild(p2Bitmap);

        // draw the boulder, and hide for the moment
        ammoImage = preload.getResult("ammoImage").result;
        ammoBitmap = new Bitmap(ammoImage);
        ammoBitmap.scaleX = SCALE_X;
        ammoBitmap.scaleY = SCALE_Y;
        ammoBitmap.visible = false; // hide until fired
        stage.addChild(ammoBitmap);
        
        // player 1 lives
        p1Lives = new Text("Lives Left : " + player1Lives, "20px sans-serif", "red");
        p1Lives.scaleX = SCALE_X;
        p1Lives.scaleY = SCALE_Y;
        p1Lives.x = MARGIN;
        p1Lives.y = MARGIN * SCALE_Y;
        stage.addChild(p1Lives);

        //player 2 lives
        p2Lives = new Text("Lives Left : " + player2Lives, "20px sans-serif", "red");
        p2Lives.scaleX = SCALE_X;
        p2Lives.scaleY = SCALE_Y;
        p2Lives.x = canvas.width - p2Lives.getMeasuredWidth() * SCALE_X - MARGIN;
        p2Lives.y = MARGIN * SCALE_Y;
        stage.addChild(p2Lives);

        // game title
        title = new Text("Catapult Wars", "30px sans-serif", "black");
        title.scaleX = SCALE_X;
        title.scaleY = SCALE_Y;
        title.x = canvas.width / 2 - (title.getMeasuredWidth() * SCALE_X) / 2
        title.y = 30 * SCALE_Y;
        stage.addChild(title);

        stage.update();
        startGame();
    }

    function startGame()
    {
        Ticker.setInterval(window.requestAnimationFrame);
        Ticker.addListener(gameLoop);
    }

    function gameLoop()
    {
        update();
        draw();
    }

    function update() {
        if (isShotFlying)
        {
            // shot in the air
            ammoBitmap.x += shotVelocity.x;
            ammoBitmap.y += shotVelocity.y;

            shotVelocity.y += GRAVITY; //apply gravity to the y(height) values only, obviously

            if (ammoBitmap.y + ammoBitmap.image.height >= GROUND_Y ||
                ammoBitmap.x <= 0 ||
                ammoBitmap.x + ammoBitmap.image.width >= canvas.width)
            {
                // missed
                isShotFlying = false; //stop shot
                ammoBitmap.visible = false;
                playerTurn = playerTurn % 2 + 1; // invert player ( switch between 1 and 2)
            }
            else if (playerTurn == 1)
            {
                if (checkHit(p2Bitmap)) {
                    // Hit
                    p2Lives.text = "Lives Left : " + --player2Lives;
                    processHit();
                }
            }
            else if (playerTurn == 2)
            {
                if (checkHit(p1Bitmap))
                {
                    // Hit
                    p1Lives.text = "Lives Left : " + --player1Lives;
                    processHit();
                }
            }

        }
        else if (playerTurn == 1)
        {
            // TEMP - for now, player automatically fires (randomly)
            ammoBitmap.x = p1Bitmap.x + (p1Bitmap.image.width * SCALE_X / 2);
            ammoBitmap.y = p1Bitmap.y;
            shotVelocity = new Point(
                Math.random() * (4 * SCALE_X) + 3,
                Math.random() * (-3 * SCALE_Y) - 1);
            fireShot();
        }
        else if (playerTurn == 2)
        {
            // AI automatically fires (randomly on it's turn)
            ammoBitmap.x = p2Bitmap.x + (p2Bitmap.image.width * SCALE_X / 2);
            ammoBitmap.y = p2Bitmap.y;
            shotVelocity = new Point(
                Math.random() * (-4 * SCALE_X) - 3,
                Math.random() * (-3 * SCALE_Y) - 1);
            fireShot();
        }
  
    }

    function checkHit(target)
    {
        // EaselJS hit test doesn't factor in scaling
        // so use simple bounding box vs center of rock

        // get centre of rock
        var shotX = ammoBitmap.x + ammoBitmap.image.width / 2;
        var shotY = ammoBitmap.y + ammoBitmap.image.height / 2;

        // return wether center of rock is in rectangle bounding target player
        return (((shotX > target.x) &&
            (shotX <= target.x + (target.image.width * SCALE_X)))
            &&
            ((shotY >= target.y) &&
            (shotY <= target.y + (target.image.height * SCALE_Y))));
    }

    function fireShot()
    {
        ammoBitmap.visible = true;
        isShotFlying = true;
    }

    function processHit()
    {
        isShotFlying = false; // stop shot
        ammoBitmap.visible = false; // hide shot
        playerTurn = playerTurn % 2 + 1; // change player

        if ((player1Lives <= 0) || (player2Lives <= 0)) {
            endGame();
        }
    }

    function endGame()
    {
        Ticker.setPaused(true); // stop game loop

        // show win/lose graphic
        var endGameImage;
        if (player1Lives <= 0)
        {
            endGameImage = preload.getResult("loseImage").result;
        }
        else if (player2Lives <= 0)
        {
            endGameImage = preload.getResult("winImage").result;
        }
        var endGameBitmap = new Bitmap(endGameImage);
        stage.addChild(endGameBitmap);
        endGameBitmap.x = (canvas.width / 2) - (endGameImage.width * SCALE_X / 2);
        endGameBitmap.y = (canvas.height / 2) - (endGameImage.height * SCALE_Y / 2);
        endGameBitmap.scaleX = SCALE_X;
        endGameBitmap.scaleY = SCALE_Y;
        stage.update();
    }

    function draw() {
        // EaselJS allows for easy updates
        stage.update();
    }

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // args.setPromise().
    };

    document.addEventListener("DOMContentLoaded", initialize, false);
    app.start();
})();

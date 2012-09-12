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
    }

    function gameLoop()
    {
        update();
        draw();
    }

    function update() {

    }

    function draw() {

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

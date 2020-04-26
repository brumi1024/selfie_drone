module.exports = (io) => {
    const express = require('express');

    const router = express.Router();
    const droneManager = require('../drone-manager/ardrone')(io);
    const gdrive = require('../gdrive/gdrive');
    const bodyParser = require('body-parser').json({limit: '50mb'});
    const fs = require('fs');

    router.use(express.json({limit: '50mb'}));
    router.use(express.urlencoded({limit: '50mb', extended: true}));

    router.get('/api/command/takeoff', (req, res) => {
        console.log('takeoff');
        droneManager.takeOff();
        res.send(new Date());
    });

    router.get('/api/command/land', (req, res) => {
        console.log('land');
        droneManager.land();
        res.send(new Date());
    });

    router.get('/api/command/move', (req, res) => {
        console.log('move');
        droneManager.move({
            front: req.param("front"),
            back: req.param("back"),
            left: req.param("left"),
            right: req.param("right"),
            up: req.param("up"),
            down: req.param("down"),
            clockwise: req.param("clockwise"),
            counterClockwise: req.param("counterClockwise")
        });
        res.send(new Date());
    });

    router.get('/api/command/stop', (req, res) => {
        console.log('stop');
        droneManager.stop();
        res.send(new Date());
    });

    router.get('/api/command/auto', (req, res) => {
        console.log('autonomousFlight');
        droneManager.autonomousFlight();
        res.send(new Date());
    });

    router.post('/api/uploadimage', bodyParser, (req, res) => {
        let payloadString = '';
        req.on('data', (chunk) => {
            payloadString += chunk.toString();
        });
        req.on('end', () => {
            const base64Data = payloadString.replace(/^data:image\/png;base64,/, "");
            const photoName = 'photo' + Date.now() + '.png'
            fs.writeFile('pictures/' + photoName, base64Data, 'base64', (err) => {
                if (err){
                    console.log(err);
                }
                gdrive.uploadToFolder(photoName).then((imageUrl) => {
                    res.send(imageUrl);
                });
            });
            
        });
        
    });   

    return router;
};

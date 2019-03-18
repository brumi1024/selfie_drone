module.exports = function(io) {
    const express = require('express');

    const router = express.Router();
    const droneManager = require('../drone-manager/ardrone')(io);

    router.get('/api/command/takeoff', function (req, res) {
        console.log('takeoff');
        droneManager.takeOff();
        res.send(new Date());
    });

    router.get('/api/command/land', function (req, res) {
        console.log('land');
        droneManager.land();
        res.send(new Date());
    });

    router.get('/api/command/move', function (req, res) {
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

    router.get('/api/command/stop', function (req, res) {
        console.log('stop');
        droneManager.stop();
        res.send(new Date());
    });

    router.get('/api/command/auto', function (req, res) {
        console.log('autonomousFlight');
        droneManager.autonomousFlight();
        res.send(new Date());
    });

    return router;
};

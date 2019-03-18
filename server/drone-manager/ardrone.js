module.exports = function (io) {
    const arDrone = require('ar-drone');

    const client = arDrone.createClient();
    let droneManager = {};

    client.config('general:navdata_demo', 'FALSE');
    client.disableEmergency();
    client.on('navdata', function(data) {
        io.on('connection', function (socket) {
            socket.emit('batteryStatus', data);
        });
    });

    droneManager.takeOff = function () {
        client.takeoff();
    };

    droneManager.land = function () {
        client.land();
    };

    droneManager.move = function (params) {
        console.log(JSON.stringify(params));
        client.front(params.front);
        client.back(params.back);
        client.left(params.left);
        client.right(params.right);
        client.up(params.up);
        client.down(params.down);
        client.counterClockwise(params.counterClockwise);
        client.clockwise(params.clockwise);
    };

    droneManager.stop = function () {
        client.stop();
    };

    droneManager.autonomousFlight = function () {
        client
            .clockwise(0.5)
            .after(3000, function () {
                this.stop();
            })
            .counterClockwise(0.5)
            .after(3000, function () {
                this.stop();
            });
    };

    return droneManager;
};
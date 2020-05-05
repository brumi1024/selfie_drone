module.exports = function (io) {
    const LOG_PREFIX = 'Command received: ';
    const arDrone = require('ar-drone');
    const client = arDrone.createClient();

    client.config('general:navdata_demo', 'TRUE');
    client.config('video:video_channel', '0');

    client.config('control:euler_angle_max', '0.25');
    client.config('control:altitude_max', '2000');
    client.config('control:control_vz_max', '200');
    client.config('control:control_yaw', '2.0');
    client.disableEmergency();

    let latestNavData;
    client.on('navdata', function (d) {
        latestNavData = d;
    });

    io.on('connection', (socket) => {
        console.log("Connected to client controller.");
        socket.emit('startConfig', {
            'control:euler_angle_max': '0.25',
            'control:altitude_max': '2000',
            'control:control_vz_max': '200',
            'control:control_yaw': '2.0'
        });

        // Flying state provider
        client.on('landing', () => {
          io.emit('state', {state: 'landing'});
        });
        client.on('landed', () => {
          io.emit('state', {state: 'landed'});
        });
        client.on('takeoff', () => {
          io.emit('state', {state: 'takeoff'});
        });
        client.on('hovering', () => {
          io.emit('state', {state: 'hovering'});
        });
        client.on('flying', () => {
          io.emit('state', {state: 'flying'});
        });

        // Basic command handler
        socket.on('basic', (data) => {
            if (data.direction === 'takeoff') {
                console.log(LOG_PREFIX + 'takeoff');
                client.takeoff();
            } else if (data.direction === 'land') {
                console.log(LOG_PREFIX + 'land');
                client.land();
            } else if (data.direction === 'stop') {
                console.log(LOG_PREFIX + 'stop');
                client.stop();
            }

            io.emit('ack', {command: 'basic/' + data.direction, date: new Date()});
        });

        // Move command handler
        socket.on('move', (data) => {
            console.log(LOG_PREFIX + 'move. Direction: ' + data.direction + ", Speed: " + data.speed);
            client[data.direction](data.speed);
            io.emit('ack', {command: 'move', date: new Date()});
        });

        // Auto command handler
        socket.on('auto', (data) => {
            io.emit('ack', {command: 'auto', date: new Date()});
            client.clockwise(0.5);
            setTimeout(() => {
                client.stop();
            }, 3000);
            client.counterClockwise(0.5);
            setTimeout(() => {
                client.stop();
            }, 3000);
        });

        // Config handler
        socket.on('config', (data) => {
            client.config('control:euler_angle_max', data['control:euler_angle_max']);
            client.config('control:altitude_max', data['control:altitude_max']);
            client.config('control:control_vz_max', data['control:control_vz_max']);
            client.config('control:control_yaw', data['control:control_yaw']);
            console.log('config saved');
        })

        // Battery state provider
        let navTimer = setInterval(() => {
            io.emit('navdata', latestNavData);
        }, 100);
    });
};
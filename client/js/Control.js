const ACCELERATION = 0.04;

const keyMap = {
  32: {
    action: 'basic',
    direction: 'stop'
  },
  84: {
    action: 'basic',
    direction: 'takeoff'
  },
  76: {
    action: 'basic',
    direction: 'land'
  },
  88: {
    action: 'move',
    direction: 'up'
  },
  67: {
    action: 'move',
    direction: 'down'
  },
  69: {
    action: 'move',
    direction: 'counterClockwise'
  },
  81: {
    action: 'move',
    direction: 'clockwise'
  },
  87: {
    action: 'move',
    direction: 'front'
  },
  83: {
    action: 'move',
    direction: 'back'
  },
  65: {
    action: 'move',
    direction: 'left'
  },
  68: {
    action: 'move',
    direction: 'right'
  }
};


let Control = function Control(socket) {
        this.socket = socket;
        this.speed = 0;
        this.moving = false;
        this.keysActive = {};

        this.listen();

        var self = this;
        setInterval(() => {
          self.sendCommands();
        }, 100);
};


Control.prototype.listen = function listen() {
        let control = this;

        window.addEventListener('keydown', (event) => {
          control.onKeyDown(event);
        }, false);

        window.addEventListener('keyup', (event) => {
          control.onKeyUp(event);
        }, false);

        this.socket.on('connect', (reason) => {
            document.getElementById('connection_status').innerHTML = 'Connected to server.';
        });
        this.socket.on('disconnect', (reason) => {
            document.getElementById('connection_status').innerHTML = 'Disconnected from server.';
        });
        this.socket.on('state', (data) => {
            document.getElementById('state').innerHTML = data.state;
        });
        this.socket.on('ack', (data) => {
            document.getElementById('last_command').innerHTML = data.command + ' at ' + data.date;
        });
        this.socket.on('navdata', (data) => {
            if (data && data.hasOwnProperty('demo')) {
              document.getElementById('battery').innerHTML = data.demo.batteryPercentage + '%';
            }
        });

        document.getElementById('takeoffBtn').addEventListener('click', (event) => {
            this.socket.emit('basic', {direction: 'takeoff'});
        });
        document.getElementById('landBtn').addEventListener('click', (event) => {
            this.socket.emit('basic', {direction: 'land'});
        });
        document.getElementById('stopBtn').addEventListener('click', (event) => {
            this.socket.emit('basic', {direction: 'stop'});
        });
        document.getElementById('autoBtn').addEventListener('click', (event) => {
            this.socket.emit('basic', {direction: 'auto'});
        });

        this.socket.on('startConfig', (data) => {
            document.getElementById('euler_angle_max').value = data['control:euler_angle_max'];
            document.getElementById('altitude_max').value = data['control:altitude_max'];
            document.getElementById('control_vz_max').value = data['control:control_vz_max'];
            document.getElementById('control_yaw').value = data['control:control_yaw'];            
        });

        document.getElementById('saveConfigBtn').addEventListener('click', (event) => {
            let config = {
              'control:euler_angle_max': document.getElementById('euler_angle_max').value,
              'control:altitude_max': document.getElementById('altitude_max').value,
              'control:control_vz_max': document.getElementById('control_vz_max').value,
              'control:control_yaw': document.getElementById('control_yaw').value
            }
            this.socket.emit('config', config);
        });
};

Control.prototype.onKeyDown = function onKeyDown(event) {
  event.preventDefault();
    if (!keyMap.hasOwnProperty(event.keyCode)) {
        return;
    }
    const keyObjectPressed = keyMap[event.keyCode];

    if (keyObjectPressed.action === 'move') {
        this.moving = keyObjectPressed.direction;

        if (null === this.keysActive || typeof (this.keysActive[event.keyCode]) === 'undefined') {
            this.keysActive[event.keyCode] = ACCELERATION;
        }
    } else {
        this.socket.emit(keyObjectPressed.action, {
            direction: keyObjectPressed.direction
        });
    }
}

Control.prototype.onKeyUp = function onKeyUp(event) {
  event.preventDefault();
    if (!keyMap.hasOwnProperty(event.keyCode)) {
        return;
    }
    var keyObjectDePressed = keyMap[event.keyCode];

    delete this.keysActive[event.keyCode];

    if (Object.keys(this.keysActive).length > 0) {
        this.socket.emit(keyObjectDePressed.action, {
            direction: keyObjectDePressed.direction,
            speed: 0
        });
    } else {
        this.socket.emit('basic', {direction: 'stop'});
    }
}

Control.prototype.sendCommands = function sendCommands() {
        for (let key in this.keysActive) {
            let command = keyMap[key];
            this.socket.emit(command.action, {
                direction: command.direction,
                speed: this.keysActive[key]
            });

            // Update the speed
            this.keysActive[key] = this.keysActive[key] + ACCELERATION / (1 - this.keysActive[key]);
            this.keysActive[key] = Math.min(1, this.keysActive[key]);
        }
}
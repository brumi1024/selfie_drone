new NodecopterStream(document.getElementById("droneStream"));

let droneBatteryState = document.getElementById("battery");
let droneState = document.getElementById("state");

let socket = io.connect('http://localhost:3000');
socket.on('batteryStatus', function (data) {
	if (data && data.hasOwnProperty("demo")) {
		droneBatteryState.textContent = data.demo.batteryPercentage;
		droneState.textContent = data.demo.controlState;
	}
});

let keyMapping = {
	87: "front",
	65: "left",
	83: "back",
	68: "right",
	88: "up",
	67: "down",
	81: "counterClockwise",
	69: "clockwise"
};

let Control = {
	controlValues: {front: 0, back: 0, left: 0, right: 0, up: 0, down: 0, counterClockwise: 0, clockwise: 0},
	speed: 0.1,
	_sent: false,

	onKeydown: function (event) {
		if ([87, 65, 83, 68, 88, 67, 81, 69].includes(event.keyCode)) {
			var lastControlValue = this.controlValues[keyMapping[event.keyCode]];
			this.controlValues[keyMapping[event.keyCode]] = this.speed;
			if (lastControlValue != this.controlValues[keyMapping[event.keyCode]]) {
				this._sent = false;
			}
		}
	},

	onKeyup: function (event) {
		if ([87, 65, 83, 68, 88, 67, 81, 69].includes(event.keyCode)) {
			this._sent = false;
			this.controlValues[keyMapping[event.keyCode]] = 0;
		}
	},

	isSent: function () {
		return this._sent;
	},

	setSent: function () {
		this._sent = true;
	},

	setSpeed(param) {
		this.speed = param;
	}
};

window.addEventListener('keyup', function (event) {
	Control.onKeyup(event);
}, false);
window.addEventListener('keydown', function (event) {
	Control.onKeydown(event);
}, false);

setInterval(checkControl, 1000 / 60);

function checkControl() {
	if (!Control.isSent()) {
		sendCommand("move", Control.controlValues);
		Control.setSent();
	}
}

function sendCommand(command, params) {
	var request = new XMLHttpRequest();
	var URL;
	if (params != null && params != undefined) {
		URL = `http://localhost:3000/api/command/${command}?front=${params.front}&back=${params.back}&left=${params.left}&right=${params.right}
		&up=${params.up}&down=${params.down}&counterClockwise=${params.counterClockwise}&clockwise=${params.clockwise}`;
	} else {
		URL = `http://localhost:3000/api/command/${command}`;
	}
	request.open('GET', URL, true);
	request.onload = function () {
		document.getElementById("last_command").innerHTML = command + " " + this.response;
	}
	request.send();
}

function setSpeed() {
	var desiredSpeed = document.getElementById("droneSpeed").value;
	desiredSpeed = desiredSpeed > 1 ? 1 : desiredSpeed < 0 ? 0.01 : desiredSpeed;

	if (!isNaN(desiredSpeed)) {
		Control.setSpeed(desiredSpeed);
	}

}
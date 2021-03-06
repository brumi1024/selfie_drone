const MODEL_URL = '/js/lib/model_web/'
const LABELS_URL = MODEL_URL + 'labels.json'
const MODEL_JSON = MODEL_URL + 'model.json'
const mode = 'webcam'; // '' to change it to production mode or 'webcam' to webcam mode

let consentGiven = confirm("Photos will be created of you, do you accept it?");

const droneSteamDiv = document.getElementById("droneStream");
const video = document.getElementById('video');
if (mode != 'webcam') {
    new NodecopterStream(droneSteamDiv);
    const droneStreamCanvas = document.getElementById('droneStream').childNodes[0];
} else {
    video.setAttribute('width', 720);
    video.setAttribute('height', 540);
}
const liveViewText = document.getElementById('liveViewText');
const photoWillBeCreatedText = document.getElementById('photoWillBeCreatedText');
const photoCreatedText = document.getElementById('photoCreatedText');
const downloadBtn = document.getElementById('downloadBtn');
const uploadBtn = document.getElementById('uploadBtn');

let photoCounter = 0;
let faceDetected = false;
let actualPhoto;

setStatusText(1);

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/js/lib/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/js/lib/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/js/lib/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/js/lib/models')
]).then(startVideo);

function startVideo() {
    if (mode == 'webcam') {
        navigator.mediaDevices.getUserMedia({video: {}})
        .then((stream)=> {video.srcObject = stream;}, (err) => console.error(err));
    } else {
        let stream = droneStreamCanvas.captureStream(30);
        video.srcObject = stream;
    }
}


async function startTF() {
    const modelPromise = tf.loadGraphModel(MODEL_JSON)
    const labelsPromise = fetch(LABELS_URL).then(data => data.json())
    const values = await Promise.all([modelPromise, labelsPromise]);
    [model] = values;
    detectFrame(video, model);
}
  
async function detectFrame(video, model) {
    thumbs = await TFWrapper(model).detect(video);
    const scoreHighEnough = element => element.score > 0.80;
    if (faceDetected && thumbs.some(scoreHighEnough)) {
        photoCounter++;
        if (photoCounter >= 0) {
            setStatusText(2);
        }
    } else {
        setStatusText(1);
        photoCounter = 0;
    }

    if (photoCounter == 5) {
        setStatusText(3);
        photoCounter = -5;
        capture();
    }
    detectFrame(video, model);
}

function capture() {
    uploadBtn.disabled = false;
    let pictureCanvas = document.getElementById('picture');     
    pictureCanvas.width = video.videoWidth;
    pictureCanvas.height = video.videoHeight;
    pictureCanvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);  
    actualPhoto = new Image();
    let dataUrl = pictureCanvas.toDataURL("image/png");
    actualPhoto.src = dataUrl;
    downloadBtn.setAttribute('download', 'photo.png');
    downloadBtn.setAttribute('href', dataUrl.replace("image/png", "image/octet-stream"));
}

function upload() {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploadimage', true);
    xhr.onload = (response) => {
        id = response.currentTarget.responseText;
        let url = "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fdrive.google.com%2Fopen%3Fid%3D" + id + "&amp;src=sdkpreparse";
        var win = window.open(url, '_blank');
        win.focus();
    }
    xhr.send(actualPhoto.src);
}

function setStatusText(status) {
    switch(status) {
        case 1:
            liveViewText.style.display = 'inline';
            photoWillBeCreatedText.style.display = 'none';
            photoCreatedText.style.display = 'none';
            break;
        case 2:
            liveViewText.style.display = 'none';
            photoWillBeCreatedText.style.display = 'inline';
            photoCreatedText.style.display = 'none';
            break;
        case 3:
            liveViewText.style.display = 'none';
            photoWillBeCreatedText.style.display = 'none';
            photoCreatedText.style.display = 'inline';
            break;
    }
}

if (consentGiven) {
    video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.getElementById('live-view').append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
            faceDetected = detections.length > 0;
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }, 100);

        startTF();
    });
}


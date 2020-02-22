const MODEL_URL = '/js/lib/model_web/'
const LABELS_URL = MODEL_URL + 'labels.json'
const MODEL_JSON = MODEL_URL + 'model.json'

const video = document.getElementById('video');

let photoCounter = 0;
let faceDetected = false;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/js/lib/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/js/lib/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/js/lib/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/js/lib/models')
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({video: {}})
    .then((stream)=> {video.srcObject = stream;}, (err)=> console.error(err));
  }

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
})

async function startTF() {
    const modelPromise = tf.loadGraphModel(MODEL_JSON)
    const labelsPromise = fetch(LABELS_URL).then(data => data.json())
    const values = await Promise.all([modelPromise, labelsPromise]);
    [model] = values;
    detectFrame(video, model);
}
  
async function detectFrame(video, model) {
    thumbs = await TFWrapper(model).detect(video);
    const scoreHighEnough = element => element.score > 0.95;
    if (faceDetected && thumbs.some(scoreHighEnough)) {
        photoCounter++;
    } else {
        photoCounter = 0;
    }

    if (photoCounter == 5) {
        console.log("Photo created.");
        photoCounter = -5;
        capture();
    }
    detectFrame(video, model);
}

function capture() {
    let canvas = document.getElementById('picture');     
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);  
    canvas.toBlob(blob => {
      const img = new Image();
      let url = window.URL ? URL : webkitURL;
      img.src = url.createObjectUrl(blob);
    });
}

document.getElementById('shareBtn').onclick = function() {
    FB.ui({
      display: 'popup',
      method: 'share',
      href: 'http://localhost:3000',
    }, function(response){});
  }
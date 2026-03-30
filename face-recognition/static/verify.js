const video = document.getElementById('video');

// Load models from static directory
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/static/face-api'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/static/face-api'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/static/face-api')
]).then(startVideo);
function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
      video.srcObject = stream;
    })
    .catch(err => console.error("Camera error:", err));
}

video.addEventListener('play', async () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const interval = setInterval(async () => {
    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log("No face detected");
      return;
    }

    clearInterval(interval);
    video.pause();

    const encoding = Array.from(detection.descriptor);

    const response = await fetch('/verify-face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterId, electionId, encoding })
    });

    const result = await response.json();

    if (result.success){
      alert("✅ Face verified! You may proceed to vote.");
      window.location.href = `http://localhost:3001/vote.html?voterId=${voterId}&electionId=${electionId}`;
    }else {
      alert(`❌ Verification failed: ${result.message}`);
      window.location.href = 'http://localhost:3001/ongoing-elections.html';
    }
  }, 3000);
});

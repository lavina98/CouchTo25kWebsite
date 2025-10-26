// Enhanced Service Worker with Background Audio Support
importScripts('./workbox-00a24876.js');

// Skip waiting and claim clients immediately
self.skipWaiting();
workbox.clientsClaim();

// Precache assets
workbox.precaching.precacheAndRoute([
  {url:"/_next/static/7TXCAliUk_vEtjoyxL-vq/_buildManifest.js",revision:"95cd1776aaf54872a674f69f2a52f887"},
  {url:"/_next/static/7TXCAliUk_vEtjoyxL-vq/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},
  {url:"/_next/static/chunks/664-d5eabe57e592a412.js",revision:"d5eabe57e592a412"},
  {url:"/_next/static/chunks/framework-5429a50ba5373c56.js",revision:"5429a50ba5373c56"},
  {url:"/_next/static/chunks/main-3d95fe5764bf3726.js",revision:"3d95fe5764bf3726"},
  {url:"/_next/static/chunks/pages/_app-502efbca11843066.js",revision:"502efbca11843066"},
  {url:"/_next/static/chunks/pages/_error-b6491f42fb2263bb.js",revision:"b6491f42fb2263bb"},
  {url:"/_next/static/chunks/pages/history-43b1903201609314.js",revision:"43b1903201609314"},
  {url:"/_next/static/chunks/pages/index-fc7a7c5880aa56fb.js",revision:"fc7a7c5880aa56fb"},
  {url:"/_next/static/chunks/pages/trainingPlan-c4fbf7273ec5fb06.js",revision:"c4fbf7273ec5fb06"},
  {url:"/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",revision:"837c0df77fd5009c9e46d446188ecfd0"},
  {url:"/_next/static/chunks/webpack-8fa1640cc84ba8fe.js",revision:"8fa1640cc84ba8fe"},
  {url:"/_next/static/css/4e90b415fc561715.css",revision:"4e90b415fc561715"},
  {url:"/_next/static/css/85157c3007b90533.css",revision:"85157c3007b90533"},
  {url:"/_next/static/css/90c96924c3534f82.css",revision:"90c96924c3534f82"},
  {url:"/complete.mp3",revision:"7ed467214ad390dc6dd61482b184e76d"},
  {url:"/manifest.json",revision:"dbd1fcb516b2c0392ee5577075d56e48"},
  {url:"/run.mp3",revision:"5eaa4ecb566be270553cd65330109194"},
  {url:"/trainingPlan.jpeg",revision:"a83203dd21c17816998bad3552e1d6e8"},
  {url:"/walk.mp3",revision:"617cb87d7f225f57535d35f5f74482cb"}
], {ignoreURLParametersMatching: []});

// Clean up outdated caches
workbox.cleanupOutdatedCaches();

// Background Audio Support
let audioContext = null;
let audioBuffers = {};
let activeWorkout = null;

// Initialize audio context and preload audio files
async function initializeAudio() {
  try {
    const AudioContext = self.AudioContext || self.webkitAudioContext;
    if (AudioContext) {
      audioContext = new AudioContext();
      
      // Preload audio files
      const audioFiles = ['./run.mp3', './walk.mp3', './complete.mp3'];
      for (const file of audioFiles) {
        try {
          const response = await fetch(file);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffers[file] = audioBuffer;
        } catch (error) {
          console.log(`Failed to load ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.log('Audio initialization failed:', error);
  }
}

// Play audio in service worker
async function playAudio(fileName) {
  if (!audioContext || !audioBuffers[fileName]) {
    return false;
  }
  
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    
    source.buffer = audioBuffers[fileName];
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 1.0;
    
    source.start();
    return true;
  } catch (error) {
    console.log('Service worker audio failed:', error);
    return false;
  }
}

// Handle background workout management
async function manageBackgroundWorkout(workoutData) {
  activeWorkout = workoutData;
  
  // Continue workout timing in background
  const checkWorkoutProgress = () => {
    if (!activeWorkout || !activeWorkout.isActive) return;
    
    const now = Date.now();
    const elapsed = Math.floor((now - activeWorkout.startTime) / 1000);
    
    // Check for audio cues
    const lapProgress = elapsed % activeWorkout.lapTimeInSeconds;
    
    if (lapProgress === 0 && elapsed > 0) {
      playAudio('./run.mp3');
    } else if (lapProgress === activeWorkout.runTimeInSeconds) {
      playAudio('./walk.mp3');
    }
    
    // Check if workout is complete
    if (elapsed >= activeWorkout.totalTimeInSeconds) {
      playAudio('./complete.mp3');
      activeWorkout = null;
      
      // Notify all clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'WORKOUT_COMPLETE',
            data: { completedTime: elapsed }
          });
        });
      });
      return;
    }
    
    // Schedule next check
    setTimeout(checkWorkoutProgress, 1000);
  };
  
  checkWorkoutProgress();
}

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'INIT_BACKGROUND_AUDIO':
      await initializeAudio();
      break;
      
    case 'START_BACKGROUND_WORKOUT':
      await manageBackgroundWorkout(data);
      break;
      
    case 'STOP_BACKGROUND_WORKOUT':
      activeWorkout = null;
      break;
      
    case 'PLAY_AUDIO':
      const success = await playAudio(data.fileName);
      event.ports[0]?.postMessage({ success });
      break;
  }
});

// Standard caching strategies
workbox.routing.registerRoute(
  "/",
  new workbox.strategies.NetworkFirst({
    cacheName: "start-url",
    plugins: [{
      cacheWillUpdate: async ({request, response, event, state}) => 
        response && response.type === "opaqueredirect" ? 
          new Response(response.body, {status: 200, statusText: "OK", headers: response.headers}) : 
          response
    }]
  }),
  "GET"
);

workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new workbox.strategies.CacheFirst({
    cacheName: "google-fonts-cache",
    plugins: [new workbox.expiration.ExpirationPlugin({maxEntries: 10, maxAgeSeconds: 31536000})]
  }),
  "GET"
);

workbox.routing.registerRoute(
  /\.(?:js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|svg|gif|mp3)$/i,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "static-resources-cache",
    plugins: [new workbox.expiration.ExpirationPlugin({maxEntries: 100, maxAgeSeconds: 259200})]
  }),
  "GET"
);
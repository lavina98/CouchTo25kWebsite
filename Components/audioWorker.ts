// Web Worker for background audio handling
// This runs in a separate thread and can continue when the main thread is suspended

let audioContext: AudioContext | null = null;
let audioBuffers: { [key: string]: AudioBuffer | null } = {};

// Initialize audio context and load audio files
async function initializeAudio() {
  try {
    const AudioContextClass = (self as any).AudioContext || (self as any).webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error('Web Audio API not supported');
    }
    
    audioContext = new AudioContextClass();
    
    // Load audio files
    const audioFiles = ['run.mp3', 'walk.mp3', 'complete.mp3'];
    
    for (const file of audioFiles) {
      try {
        const response = await fetch(file);
        const arrayBuffer = await response.arrayBuffer();
        if (audioContext) {
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          audioBuffers[file] = audioBuffer;
        }
      } catch (error) {
        console.log(`Failed to load ${file}:`, error);
        audioBuffers[file] = null;
      }
    }
    
    self.postMessage({ type: 'AUDIO_INITIALIZED', success: true });
  } catch (error) {
    console.log('Audio initialization failed:', error);
    self.postMessage({ type: 'AUDIO_INITIALIZED', success: false });
  }
}

// Play audio using Web Audio API
async function playAudioBuffer(fileName: string) {
  if (!audioContext || !audioBuffers[fileName]) {
    return false;
  }
  
  try {
    // Resume audio context if suspended
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
    console.log('Web Audio playback failed:', error);
    return false;
  }
}

// Fallback using regular Audio API
async function playAudioElement(fileName: string) {
  try {
    const audio = new Audio(fileName);
    audio.volume = 1.0;
    audio.preload = 'auto';
    
    // Try to play
    await audio.play();
    return true;
  } catch (error) {
    console.log('Audio element playback failed:', error);
    return false;
  }
}

// Handle messages from main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'INIT_AUDIO':
      await initializeAudio();
      break;
      
    case 'PLAY_AUDIO':
      const { fileName } = data;
      
      // Try Web Audio API first
      let success = await playAudioBuffer(fileName);
      
      // Fallback to Audio element
      if (!success) {
        success = await playAudioElement(fileName);
      }
      
      // Send vibration command as additional fallback
      self.postMessage({ 
        type: 'VIBRATE', 
        data: { 
          fileName,
          success 
        } 
      });
      break;
      
    case 'SUSPEND_AUDIO':
      if (audioContext && audioContext.state === 'running') {
        await audioContext.suspend();
      }
      break;
      
    case 'RESUME_AUDIO':
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      break;
  }
};

// Keep worker alive
setInterval(() => {
  // Ping to keep worker active
}, 1000);
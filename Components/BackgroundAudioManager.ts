// Enhanced Audio Manager for background audio playback
// Supports Web Workers, Service Workers, and multiple fallback strategies

export class BackgroundAudioManager {
  private worker: Worker | null = null;
  private audioElements: { [key: string]: HTMLAudioElement } = {};
  private isInitialized = false;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initializeAudioElements();
  }

  // Initialize audio elements and preload them
  private initializeAudioElements() {
    const audioFiles = ['run.mp3', 'walk.mp3', 'complete.mp3'];
    
    audioFiles.forEach(file => {
      const audio = new HTMLAudioElement();
      audio.src = file;
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      // Enable audio to play in background on some browsers
      audio.setAttribute('preload', 'auto');
      if ('preservesPitch' in audio) {
        (audio as any).preservesPitch = false;
      }
      
      this.audioElements[file] = audio;
    });
  }

  // Initialize the audio manager
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Try to initialize Web Audio Context
      await this.initializeWebAudio();
      
      // Try to initialize Web Worker
      await this.initializeWorker();
      
      // Initialize Service Worker for background audio
      await this.initializeServiceWorker();
      
      // Register for background execution events
      this.registerBackgroundHandlers();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.log('Background audio initialization failed:', error);
      return false;
    }
  }

  private async initializeWebAudio() {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
        
        // Resume audio context immediately to avoid suspension
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      }
    } catch (error) {
      console.log('Web Audio Context initialization failed:', error);
    }
  }

  private async initializeWorker() {
    try {
      // Create Web Worker from the audio worker file
      const workerBlob = new Blob([`
        ${await fetch('./Components/audioWorker.ts').then(r => r.text())}
      `], { type: 'application/javascript' });
      
      const workerUrl = URL.createObjectURL(workerBlob);
      this.worker = new Worker(workerUrl);
      
      this.worker.onmessage = (event) => {
        const { type, data } = event.data;
        
        if (type === 'VIBRATE') {
          this.handleVibration(data.fileName);
        }
      };
      
      // Initialize audio in worker
      this.worker.postMessage({ type: 'INIT_AUDIO' });
    } catch (error) {
      console.log('Web Worker initialization failed:', error);
    }
  }

  private async initializeServiceWorker() {
    try {
      if ('serviceWorker' in navigator) {
        // Register the enhanced service worker
        const registration = await navigator.serviceWorker.register('/sw-enhanced.js');
        
        // Initialize background audio in service worker
        if (registration.active) {
          registration.active.postMessage({ type: 'INIT_BACKGROUND_AUDIO' });
        }
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          const { type, data } = event.data;
          
          if (type === 'WORKOUT_COMPLETE') {
            // Handle workout completion from background
            console.log('Workout completed in background:', data);
          }
        });
      }
    } catch (error) {
      console.log('Service Worker initialization failed:', error);
    }
  }

  private registerBackgroundHandlers() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, ensure audio context stays active
        this.enableBackgroundExecution();
      } else {
        // Page is visible again, resume everything
        this.resumeExecution();
      }
    });

    // Handle page focus/blur
    window.addEventListener('blur', () => {
      this.enableBackgroundExecution();
    });

    window.addEventListener('focus', () => {
      this.resumeExecution();
    });

    // Handle before unload
    window.addEventListener('beforeunload', () => {
      this.enableBackgroundExecution();
    });
  }

  private async enableBackgroundExecution() {
    try {
      // Keep audio context running
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Notify worker to stay active
      if (this.worker) {
        this.worker.postMessage({ type: 'RESUME_AUDIO' });
      }

      // Request background execution permission if available
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          // Keep some processing active
        });
      }
    } catch (error) {
      console.log('Background execution setup failed:', error);
    }
  }

  private async resumeExecution() {
    try {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (this.worker) {
        this.worker.postMessage({ type: 'RESUME_AUDIO' });
      }
    } catch (error) {
      console.log('Resume execution failed:', error);
    }
  }

  // Play audio with multiple fallback strategies
  async playAudio(fileName: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    let success = false;

    // Strategy 1: Service Worker audio (for background playback)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const messageChannel = new MessageChannel();
        
        return new Promise((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.success);
          };
          
          navigator.serviceWorker.controller?.postMessage(
            { type: 'PLAY_AUDIO', data: { fileName } },
            [messageChannel.port2]
          );
          
          // Timeout after 1 second
          setTimeout(() => resolve(false), 1000);
        });
      } catch (error) {
        console.log('Service Worker audio failed:', error);
      }
    }

    // Strategy 2: Web Worker audio
    if (!success && this.worker) {
      try {
        this.worker.postMessage({ 
          type: 'PLAY_AUDIO', 
          data: { fileName } 
        });
        success = true;
      } catch (error) {
        console.log('Worker audio failed:', error);
      }
    }

    // Strategy 3: Direct audio element with advanced settings
    if (!success && this.audioElements[fileName]) {
      try {
        const audio = this.audioElements[fileName];
        
        // Reset audio to beginning
        audio.currentTime = 0;
        
        // Enable background playback hints
        if ('webkitAudioContext' in window) {
          audio.setAttribute('webkit-playsinline', 'true');
          audio.setAttribute('playsinline', 'true');
        }
        
        await audio.play();
        success = true;
      } catch (error) {
        console.log('Direct audio playback failed:', error);
      }
    }

    // Strategy 4: Create new audio instance
    if (!success) {
      try {
        const audio = new Audio(fileName);
        audio.volume = 1.0;
        audio.setAttribute('preload', 'auto');
        
        // Try to enable background playback
        if ('webkitAudioContext' in window) {
          audio.setAttribute('webkit-playsinline', 'true');
          audio.setAttribute('playsinline', 'true');
        }
        
        await audio.play();
        success = true;
      } catch (error) {
        console.log('New audio instance failed:', error);
      }
    }

    // Strategy 5: Web Audio API direct
    if (!success && this.audioContext) {
      try {
        await this.playWithWebAudio(fileName);
        success = true;
      } catch (error) {
        console.log('Web Audio API failed:', error);
      }
    }

    // Fallback: Vibration
    this.handleVibration(fileName);

    return success;
  }

  private async playWithWebAudio(fileName: string) {
    if (!this.audioContext) return;

    const response = await fetch(fileName);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    gainNode.gain.value = 1.0;

    source.start();
  }

  private handleVibration(fileName: string) {
    if ('vibrate' in navigator) {
      let pattern: number[] = [];
      
      if (fileName.includes('run')) {
        pattern = [200]; // Short vibration for run
      } else if (fileName.includes('walk')) {
        pattern = [200, 100, 200]; // Double vibration for walk
      } else if (fileName.includes('complete')) {
        pattern = [500, 200, 500, 200, 500]; // Long pattern for complete
      }
      
      navigator.vibrate(pattern);
    }
  }

  // Start background workout tracking in service worker
  startBackgroundWorkout(workoutData: {
    startTime: number;
    isActive: boolean;
    lapTimeInSeconds: number;
    runTimeInSeconds: number;
    totalTimeInSeconds: number;
  }) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'START_BACKGROUND_WORKOUT',
        data: workoutData
      });
    }
  }

  // Stop background workout tracking
  stopBackgroundWorkout() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STOP_BACKGROUND_WORKOUT'
      });
    }
  }

  // Cleanup
  destroy() {
    // Stop background workout
    this.stopBackgroundWorkout();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    Object.values(this.audioElements).forEach(audio => {
      audio.pause();
      audio.src = '';
    });

    this.audioElements = {};
    this.isInitialized = false;
  }
}
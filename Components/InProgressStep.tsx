import { State } from "@/Models/Enum";
import {  useEffect, useState, useRef } from "react";
import styles from './Styles/InProgressStep.module.css'
import { useWakeLock } from './useWakeLock';


export interface InProgressStepProps {
    completedTimeInSeconds: number,
    runTimeInSeconds: number,
    walkTimeInSeconds: number,
    lapTimeInSeconds: number,
    totalTimeInSeconds: number,
    totalLaps: number,
    onStateChange: (state: State) => void,
    setCompletedTimeInSeconds: (value: number) => void
}

export default function InProgressStep(props: InProgressStepProps) {
    const { completedTimeInSeconds, totalTimeInSeconds, lapTimeInSeconds, runTimeInSeconds, setCompletedTimeInSeconds, onStateChange } = props;
    const [seconds, setSeconds] = useState(completedTimeInSeconds);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();
    const startTimeRef = useRef<number>(Date.now() - (completedTimeInSeconds * 1000));
    const [isActive, setIsActive] = useState(true);
    
    // Keep screen awake during workout
    useWakeLock(isActive);

    const convertSecondsToFormatedTime = (seconds: number): string =>{
        return (`${Math.floor(seconds / 60)} : ${seconds % 60}`);
    }

    const onButtonClick = (state: State) => {
        setIsActive(false);
        clearInterval(intervalId);
        setCompletedTimeInSeconds(seconds);
        onStateChange(state);
    };

    // Function to calculate elapsed time based on actual time
    const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setSeconds(elapsed);
        return elapsed;
    };

    // Handle page visibility changes (when phone is locked/unlocked)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && isActive) {
                // Page became visible again, update timer immediately
                updateTimer();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isActive]);

    // Main timer effect with audio scheduling
    useEffect(() => {
        if (!isActive) return;

        // Play initial "run" audio when workout starts
        if (completedTimeInSeconds === 0) {
            playAudio('./run.mp3');
        }

        let timeoutId: NodeJS.Timeout;
        let lastCheckedSecond = completedTimeInSeconds;

        const scheduleNextAudioCue = () => {
            const currentSeconds = updateTimer();
            
            // Check if workout is complete
            if (currentSeconds >= totalTimeInSeconds) {
                setIsActive(false);
                playAudio('./complete.mp3').then(() => {
                    setCompletedTimeInSeconds(currentSeconds);
                    onStateChange(State.Stopped);
                });
                return;
            }

            // Check for missed audio cues (in case we were locked)
            for (let sec = lastCheckedSecond + 1; sec <= currentSeconds; sec++) {
                const lapProgress = sec % lapTimeInSeconds;
                if (lapProgress === 0 && sec > 0) {
                    playAudio('./run.mp3');
                } else if (lapProgress === runTimeInSeconds) {
                    playAudio('./walk.mp3');
                }
            }
            lastCheckedSecond = currentSeconds;

            // Schedule next check - use high frequency for better accuracy
            timeoutId = setTimeout(scheduleNextAudioCue, 100);
        };

        // Start the audio scheduling loop
        scheduleNextAudioCue();

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isActive, completedTimeInSeconds, totalTimeInSeconds, lapTimeInSeconds, runTimeInSeconds, setCompletedTimeInSeconds, onStateChange]);

    // Audio playback function with multiple fallbacks
    async function playAudio(fileName: string) {
        try {
            // Method 1: Regular Audio object
            const audio = new Audio(fileName);
            audio.volume = 1.0;
            
            // Force audio to be treated as important
            if ('webkitAudioContext' in window || 'AudioContext' in window) {
                // Resume audio context if suspended
                const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    const audioContext = new AudioContext();
                    if (audioContext.state === 'suspended') {
                        await audioContext.resume();
                    }
                }
            }
            
            await audio.play();
            
            // Method 2: Vibration as backup notification
            if ('vibrate' in navigator) {
                if (fileName.includes('run')) {
                    navigator.vibrate([200]); // Short vibration for run
                } else if (fileName.includes('walk')) {
                    navigator.vibrate([200, 100, 200]); // Double vibration for walk
                } else if (fileName.includes('complete')) {
                    navigator.vibrate([500, 200, 500, 200, 500]); // Long pattern for complete
                }
            }
        } catch (error) {
            console.log('Audio playback failed:', error);
            
            // Fallback: Just vibration if audio fails
            if ('vibrate' in navigator) {
                if (fileName.includes('run')) {
                    navigator.vibrate([200]);
                } else if (fileName.includes('walk')) {
                    navigator.vibrate([200, 100, 200]);
                } else if (fileName.includes('complete')) {
                    navigator.vibrate([500, 200, 500, 200, 500]);
                }
            }
        }
    }

    return (
        <div className={styles.inProgressStepDiv}> 
            <div> Time:{convertSecondsToFormatedTime(seconds)} / {convertSecondsToFormatedTime(totalTimeInSeconds)}</div>
            <div>Laps: {Math.floor(seconds / lapTimeInSeconds)} / {props.totalLaps}</div>
            <button className={styles.pauseButton} onClick={(e) => {onButtonClick(State.Paused); }}>Pause</button>
            <button className={styles.stopButton} onClick={(e) => {onButtonClick(State.Stopped);}}>Stop</button>
        </div>
    );
}
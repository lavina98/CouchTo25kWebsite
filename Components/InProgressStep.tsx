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

    // Main timer effect
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const currentSeconds = updateTimer();
            
            // Check if workout is complete
            if (currentSeconds >= totalTimeInSeconds) {
                setIsActive(false);
                clearInterval(interval);
                playAudio('./complete.mp3').then(() => {
                    setCompletedTimeInSeconds(currentSeconds);
                    onStateChange(State.Stopped);
                });
                return;
            }

            // Play audio cues
            const lapProgress = currentSeconds % lapTimeInSeconds;
            if (lapProgress === 0) {
                playAudio('./run.mp3');
            } else if (lapProgress === runTimeInSeconds) {
                playAudio('./walk.mp3');
            }
        }, 1000);

        setIntervalId(interval);
        return () => clearInterval(interval);
    }, [isActive, totalTimeInSeconds, lapTimeInSeconds, runTimeInSeconds, setCompletedTimeInSeconds, onStateChange]);

    // Audio playback function
    async function playAudio(fileName: string) {
        try {
            const audio = new Audio(fileName);
            await audio.play();
        } catch (error) {
            console.log('Audio playback failed:', error);
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
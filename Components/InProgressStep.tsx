import { State } from "@/Models/Enum";
import {  useEffect, useState } from "react";
import styles from './Styles/InProgressStep.module.css'


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
    const [seconds, setSeconds] = useState(props.completedTimeInSeconds);
    const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();

    const convertSecondsToFormatedTime = (seconds: number): string =>{
        return (`${Math.floor(seconds / 60)} : ${seconds % 60}`);
    }

    const onButtonClick = (state: State) => {
        clearInterval(intervalId);
        props.setCompletedTimeInSeconds(seconds);
        props.onStateChange(state);
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setSeconds(seconds => seconds + 1);          
        }, 1000);
        setIntervalId(interval);
        return () => clearInterval(intervalId); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
    }, []);

    useEffect(() => {
        async function playAudio(fileName:string) {
            const audio = new Audio(fileName);
            await audio.play();
        }

        if (seconds >= props.totalTimeInSeconds) {
            playAudio('./complete.mp3').then(() => {
                clearInterval(intervalId);
                props.setCompletedTimeInSeconds(seconds);
                props.onStateChange(State.Stopped);
            });
       
        }
        else {
            if(seconds % props.lapTimeInSeconds == 0) {
                playAudio('./run.mp3');
            }
            else if(seconds % props.lapTimeInSeconds == props.runTimeInSeconds) {
                playAudio('./walk.mp3');
            }
        }
    }, [seconds, intervalId, props.totalTimeInSeconds]);

    return (
        <div className={styles.inProgressStepDiv}> 
            <div> Time:{convertSecondsToFormatedTime(seconds)} / {convertSecondsToFormatedTime(props.totalTimeInSeconds)}</div>
            <div>Laps: {Math.floor(seconds / props.lapTimeInSeconds)} / {props.totalLaps}</div>
            <button className={styles.pauseButton} onClick={(e) => {onButtonClick(State.Paused); }}>Pause</button>
            <button className={styles.stopButton} onClick={(e) => {onButtonClick(State.Stopped);}}>Stop</button>
        </div>
    );
}
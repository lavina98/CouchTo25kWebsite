import { State } from "@/Models/Enum";
import React, { useState } from "react";
import styles from './Styles/StartStep.module.css'


export interface StartStepProps {
    runTimeInSeconds: number,
    onRunTimeChangeTimeInSeconds: (value: number) => void,
    walkTimeInSeconds: number,
    onWalkTimeChangeTimeInSeconds: (value: number) => void,
    totalTimeInSeconds: number,
    onTotalTimeChangeTimeInSeconds: (value: number) => void,
    OnStateChange: (state: State) => void
}

export default function StartStep(props: StartStepProps) {

    const convertMinuteToSeconds = (minutes: number): number =>{
        return minutes * 60;
    };
    const convertSecondsToMinuteTime = (seconds: number): number =>{
        return Number(seconds / 60);
    }

    const onTimeUpdate = (e: React.ChangeEvent<HTMLInputElement>, setter: (value: number) => void) => {
        setter(convertMinuteToSeconds(Number(e.target.value)));
    }


    return (
        <div className={styles.startStepDiv}>
            <div >
            I want to run 
                <input type="number" onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTimeUpdate(e,  props.onRunTimeChangeTimeInSeconds)} value={convertSecondsToMinuteTime(props.runTimeInSeconds)} /> 
            minutes
            </div>
            <div>
            After that I want to walk 
            <input type="number" onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTimeUpdate(e,props.onWalkTimeChangeTimeInSeconds)} value={convertSecondsToMinuteTime(props.walkTimeInSeconds)} /> minutes
            </div>
            <div>So each lap duration is {convertSecondsToMinuteTime(props.runTimeInSeconds + props.walkTimeInSeconds)} minutes</div>
            <div>
                Total time I want to do this for is 
                <input type="number" onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTimeUpdate(e, props.onTotalTimeChangeTimeInSeconds)} value={convertSecondsToMinuteTime(props.totalTimeInSeconds)} /> minutes
            </div>
            <button className={styles.startButton} onClick={(e) => props.OnStateChange(State.ConfirmStart)}> Start</button>
        </div>
    )

}


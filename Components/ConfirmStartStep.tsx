import { State } from "@/Models/Enum";
import styles from './Styles/ConfirmStartStep.module.css'


interface IConfirmStartStepProps {
    runTimeInSeconds: number,
    walkTimeInSeconds: number,
    totalTimeInSeconds: number,
    totalLaps: number,
    onStateChange: (state: State) => void,
    setCompletedTimeInSeconds: (value: number) => void
}

export default function ConfirmStartStep(props: IConfirmStartStepProps) {

    const convertSecondsToFormatedTime = (seconds: number): string => {
        return (`${Math.floor(seconds / 60)}:${seconds % 60}`);
    }
    return (
        <div className={styles.confirmStartStepDiv}>
            <div>
                    <div>You will be doing {props.totalLaps} laps. </div>
                    <div>You will be doing {convertSecondsToFormatedTime(props.runTimeInSeconds)} minutes of running
                        and {convertSecondsToFormatedTime(props.walkTimeInSeconds)} minutes of walking 
                        for a total of {convertSecondsToFormatedTime(props.totalTimeInSeconds)} minutes</div>  
                    <div>Are you ready?</div>
             </div>
            <button className={styles.yesButton} onClick={(e) => props.onStateChange(State.InProgress)}>Yes</button>
            <button className={styles.noButton} onClick={(e) => props.onStateChange(State.NotStarted)}>No</button>
        </div>
    )
}
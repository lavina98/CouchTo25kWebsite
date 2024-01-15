import { useEffect, useState } from "react";
import StartStep from "./StartStep";
import InProgressStep from "./InProgressStep";
import { State } from "@/Models/Enum";
import ConfirmStartStep from "./ConfirmStartStep";
import styles from './Styles/Overview.module.css'
import NavBar from "./NavBar";



export default function Overview() {
    const [status, setStatus] = useState<State>(State.NotStarted);
    const [runTimeInSeconds, setRunTimeInSeconds] = useState(0);
    const [walkTimeInSeconds, setWalkTimeInSeconds] = useState(0);
    const [totalTimeInSeconds, setTotalTimeInSeconds] = useState(0);
    const [completedTimeInSeconds, setCompletedTimeInSeconds] = useState(0);


    const convertSecondsToFormatedTime = (seconds: number): string => {
        return (`${Math.floor(seconds / 60)} : ${seconds % 60}`);
    }

    useEffect(() => {
        async function setStopped() {
            await fetch('api/history', {
                method: 'POST',
                body: JSON.stringify({
                    date: new Date().toISOString(),
                    duration: completedTimeInSeconds,
                    laps: Math.floor(completedTimeInSeconds / (runTimeInSeconds + walkTimeInSeconds)),
                    eachLapRunTime: runTimeInSeconds,
                    eachLapWalkTime: walkTimeInSeconds
                })
            });
        }


        if (status == State.Stopped) {
            setStopped();
        }} 
         , [status]);

    if (status == State.NotStarted) {
        return (
            <div>
                <NavBar />
                <StartStep
                    runTimeInSeconds={runTimeInSeconds}
                    onRunTimeChangeTimeInSeconds={setRunTimeInSeconds}
                    walkTimeInSeconds={walkTimeInSeconds}
                    onWalkTimeChangeTimeInSeconds={setWalkTimeInSeconds}
                    totalTimeInSeconds={totalTimeInSeconds}
                    onTotalTimeChangeTimeInSeconds={setTotalTimeInSeconds}
                    OnStateChange={setStatus} />
            </div>)
    }

    else if (status == State.ConfirmStart) {
        const laps = Math.floor(totalTimeInSeconds / (runTimeInSeconds + walkTimeInSeconds));
        const actualTotalTimeInSeconds = laps * (runTimeInSeconds + walkTimeInSeconds);
        if (totalTimeInSeconds !== actualTotalTimeInSeconds) {
            setTotalTimeInSeconds(actualTotalTimeInSeconds);
        }
        return (
            <div>
                <NavBar />
                <ConfirmStartStep
                    runTimeInSeconds={runTimeInSeconds}
                    walkTimeInSeconds={walkTimeInSeconds}
                    totalTimeInSeconds={totalTimeInSeconds}
                    totalLaps={laps}
                    onStateChange={setStatus}
                    setCompletedTimeInSeconds={setCompletedTimeInSeconds}
                />
            </div>
        )

    }
    else if (status == State.InProgress) {
        return (
            <div>
                <NavBar />
                <InProgressStep
                    completedTimeInSeconds={completedTimeInSeconds}
                    runTimeInSeconds={runTimeInSeconds}
                    walkTimeInSeconds={walkTimeInSeconds}
                    totalTimeInSeconds={totalTimeInSeconds}
                    lapTimeInSeconds={runTimeInSeconds + walkTimeInSeconds}
                    totalLaps={Math.floor(totalTimeInSeconds / (runTimeInSeconds + walkTimeInSeconds))}
                    onStateChange={setStatus}
                    setCompletedTimeInSeconds={setCompletedTimeInSeconds}
                />
            </div>)
    }

    else if (status == State.Paused) {
        return (
            <div>
                <NavBar />
                <div className={styles.pausedDiv}>
                    <h1>Paused</h1>
                    <button className={styles.resumeButton} onClick={(e) => setStatus(State.InProgress)}>Resume</button>
                    <button className={styles.stopButton} onClick={(e) => setStatus(State.Stopped)}>Stop</button>
                </div>
            </div>)
    }

    else if (status == State.Stopped) {

        
        return (
            <div>
                <NavBar />
                <div className={styles.stoppedDiv}>
                    <h1>Stopped</h1>
                    <div> You completed {convertSecondsToFormatedTime(completedTimeInSeconds)} minutes out of {convertSecondsToFormatedTime(totalTimeInSeconds)} minutes</div>
                    <div> You did {Math.floor(completedTimeInSeconds/(runTimeInSeconds + walkTimeInSeconds))} /  {Math.floor(totalTimeInSeconds/(runTimeInSeconds + walkTimeInSeconds))} laps</div>
                    <div> Run time for each lap was {convertSecondsToFormatedTime(runTimeInSeconds)} minutes</div>
                    <div> Walk time for each lap was {convertSecondsToFormatedTime(walkTimeInSeconds)} minutes</div>
                </div>
            </div>)
    }

    else {
        return <div>Invalid State</div>
    }

}
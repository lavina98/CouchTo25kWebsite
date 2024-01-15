import { Exercise } from "@/Models/Exercise"
import { useEffect, useState } from "react"
import styles from './Styles/History.module.css'
import NavBar from "./NavBar";


export default function History() {
    const [exerciseHistory, setExerciseHistory] = useState<Exercise[]>([])

    useEffect(() => {
        async function getHistory() {
            const history = await fetch('api/history');
            let exerciseJson = await history.json() as Exercise[];
            exerciseJson = exerciseJson.sort((a, b) => new Date(a.date ??0 ).getTime() - new Date(b.date ??0 ).getTime());
            setExerciseHistory(exerciseJson);
        }
        getHistory()
    }, [])


    const convertSecondsToFormatedTime = (seconds: number): string => {
        return (`${Math.floor(seconds / 60)} : ${seconds % 60}`);
    }
    return (
        <div>
            <NavBar />
            <div className={styles.exerciseContainer}>
                {exerciseHistory.map((exercise: Exercise, index: number) => (
                    <div key={index} className={styles.exerciseDiv}>
                        <p>Exercise number {index+1}</p>
                        <p>Date -{new Date(exercise.date ?? 0).toLocaleString()}</p>
                        <p>Duration- {convertSecondsToFormatedTime(exercise.duration ??0 )} minutes</p>
                        <p>Laps- {exercise.laps}</p>
                        <p>Each Lap Run Time- {convertSecondsToFormatedTime(exercise.eachLapRunTime ?? 0)} minutes</p>
                        <p>Each Lap Walk Time- {convertSecondsToFormatedTime(exercise.eachLapWalkTime??0)} minutes</p>
                </div>
                ))}
            </div>
        </div>

    )
}
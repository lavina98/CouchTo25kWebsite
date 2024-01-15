import type { NextApiRequest, NextApiResponse } from 'next'
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { collection, getDocs, addDoc } from "firebase/firestore"; 
import { Exercise } from '@/Models/Exercise';


const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const collectionName = "exerciseHistory";


export default function handler(req: NextApiRequest, res: NextApiResponse) {
    
    if(req.method === 'POST') {
        const exercise: Exercise = JSON.parse(req.body);
        addExerciseHistory(exercise).then((querySnapshot) => {
            res.status(200).json({ message: 'Hello from Next.js!' })}
             );
       
    }

    if(req.method === 'GET') {

    getExerciseHistory().then((exercises) => {
      res.status(200).json(exercises)
      });

   
    }

}

async function addExerciseHistory(exercise: Exercise) {
    const docRef = await addDoc(collection(db, collectionName), exercise);
      console.log("Document written with ID: ", docRef.id);
}


async function getExerciseHistory() : Promise<Exercise[]> {
    const exerciseHistory: Exercise[] = [];
    const querySnapshot = await getDocs(collection(db, collectionName));
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${doc.data()}`);
      exerciseHistory.push(doc.data() as Exercise);
    });
    return exerciseHistory;
}
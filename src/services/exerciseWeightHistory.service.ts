import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase.config';

const COLLECTION = 'coachemExerciseWeightHistory';

export interface ExerciseWeightRecord {
  id?: string;
  athleteId: string;
  workoutId?: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  date: string;
}

function toRecord(docSnap: any): ExerciseWeightRecord {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    athleteId: data.athleteId,
    workoutId: data.workoutId,
    exerciseId: data.exerciseId,
    exerciseName: data.exerciseName,
    weight: Number(data.weight) || 0,
    date: data.date || new Date().toISOString(),
  };
}

export async function addExerciseWeightRecord(record: ExerciseWeightRecord): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    athleteId: record.athleteId,
    workoutId: record.workoutId || null,
    exerciseId: record.exerciseId,
    exerciseName: record.exerciseName,
    weight: Number(record.weight),
    date: record.date || new Date().toISOString(),
  });
}

export async function listExerciseWeightHistoryByAthlete(athleteId: string): Promise<ExerciseWeightRecord[]> {
  if (!athleteId) return [];
  const q = query(collection(db, COLLECTION), where('athleteId', '==', athleteId));
  const snap = await getDocs(q);
  return snap.docs
    .map(toRecord)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getLatestExerciseWeightForAthlete(
  athleteId: string,
  exerciseId: string
): Promise<ExerciseWeightRecord | null> {
  if (!athleteId || !exerciseId) return null;
  const q = query(collection(db, COLLECTION), where('athleteId', '==', athleteId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const latest = snap.docs
    .map(toRecord)
    .filter((record) => record.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  return latest || null;
}


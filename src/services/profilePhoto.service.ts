/**
 * Foto de perfil – Firebase Storage + Firestore (users + coachemAthletes quando existir).
 * O treinador lê a foto via coachemAthletes.photoURL (mesmo id do Auth do atleta).
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from './firebase.config';

const COLLECTION_ATHLETES = 'coachemAthletes';

export async function uploadProfilePhoto(localUri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Sessão inválida. Faça login novamente.');
  }
  const uid = user.uid;

  const response = await fetch(localUri);
  const blob = await response.blob();
  const contentType = blob.type || 'image/jpeg';

  const storageRef = ref(storage, `profilePhotos/${uid}/avatar.jpg`);
  await uploadBytes(storageRef, blob, { contentType });
  const url = await getDownloadURL(storageRef);

  await updateDoc(doc(db, 'users', uid), {
    photoURL: url,
    updatedAt: serverTimestamp(),
  });

  await updateProfile(user, { photoURL: url });

  const athleteRef = doc(db, COLLECTION_ATHLETES, uid);
  const athleteSnap = await getDoc(athleteRef);
  if (athleteSnap.exists()) {
    await updateDoc(athleteRef, {
      photoURL: url,
      updatedAt: serverTimestamp(),
    });
  }

  // Docs legados: id do documento ≠ uid, mas campo authUid aponta para a conta do atleta
  const linked = await getDocs(
    query(collection(db, COLLECTION_ATHLETES), where('authUid', '==', uid))
  );
  for (const d of linked.docs) {
    if (d.id === uid) continue;
    await updateDoc(d.ref, {
      photoURL: url,
      updatedAt: serverTimestamp(),
    });
  }

  return url;
}

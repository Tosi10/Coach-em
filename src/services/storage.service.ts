/**
 * Storage Service - Upload de arquivos (vídeos, imagens) para Firebase Storage
 */

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase.config';

/**
 * Faz upload de um vídeo de exercício para o Firebase Storage.
 * @param localUri URI local do vídeo (ex: file:// ou content://)
 * @param exerciseId ID do exercício (para organizar na pasta exercises/{exerciseId}/video)
 * @returns URL de download do vídeo ou null se falhar (ex: Firebase não configurado)
 */
export async function uploadExerciseVideo(
  localUri: string,
  exerciseId: string
): Promise<string | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const filename = `video_${Date.now()}.mp4`;
    const storageRef = ref(storage, `exercises/${exerciseId}/${filename}`);

    await new Promise<void>((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTask.on(
        'state_changed',
        () => {},
        (err) => reject(err),
        () => resolve()
      );
    });

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.warn('Upload de vídeo falhou (Firebase pode não estar configurado):', error);
    return null;
  }
}

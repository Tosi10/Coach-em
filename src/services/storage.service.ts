/**
 * Storage Service - Upload de arquivos (vídeos, imagens) para Firebase Storage
 */

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase.config';

function uriToBlob(localUri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onerror = () => reject(new Error('Falha ao ler arquivo local para upload.'));
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.responseType = 'blob';
    xhr.open('GET', localUri, true);
    xhr.send(null);
  });
}

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
    const blob = await uriToBlob(localUri);
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
    // Em alguns runtimes o Blob possui close() para liberar memória.
    (blob as { close?: () => void }).close?.();
    return downloadURL;
  } catch (error) {
    console.warn('Upload de vídeo falhou (URI/rules/conexão):', localUri, error);
    return null;
  }
}

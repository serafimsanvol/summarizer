import { existsSync } from 'fs';
import { readFile } from 'fs/promises';

export const extractVideoId = (url: string) => {
  if (url.includes('watch?v=')) {
    return new URL(url).searchParams.get('v');
  }

  const params = url.split('/').pop();

  return params.split('?').shift();
};

export const getFileBuffer = async (videoId: string) => {
  const path = `${__dirname}/${videoId}.mp3`;

  if (!existsSync(path)) throw new Error('File not found');

  return await readFile(path);
};
export const getFileBufferFromURL = async (url: string) => {
  return await fetch(url).then((res) => res.arrayBuffer());
};

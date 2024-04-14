import { Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import axios from 'axios';
import * as ffmpeg from 'fluent-ffmpeg';
import * as ytdl from 'ytdl-core';

import { PrismaService } from 'src/prisma/prisma.service';
import { getFileBuffer, getFileBufferFromURL } from './helpers';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class VideoService {
  constructor(
    private prismaService: PrismaService,
    private cloudinarySevice: CloudinaryService,
  ) {}
  async transcribeVideo(videoId: string) {
    const responses = await this.prismaService.whisperResponse.findMany({
      where: { youtubeId: videoId },
    });
    if (responses.length) {
      return JSON.parse(responses[0].response);
    }

    try {
      const resourceURL = this.cloudinarySevice
        .v2()
        .utils.url(`${videoId}.mp3`, {
          resource_type: 'raw',
        });

      let buffer;
      if (process.env.NODE_ENV === 'production') {
        buffer = await getFileBufferFromURL(resourceURL);
      } else {
        buffer = await getFileBuffer(videoId);
      }

      const res = await axios({
        method: 'post',
        url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/openai/whisper`,
        data: buffer,
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Bearer ${process.env.CLOUDFLARE_WORKER_AI_TOKEN}`,
        },
      });

      this.saveWhisperResponse(res.data, videoId);
      // InferenceUpstreamError: InferenceUpstreamError: ERROR 3010: Invalid or incomplete input for the model: failed to decode JSON: Request is too large
      return res.data;
    } catch (error) {
      console.log(error?.response?.data);
      throw error;
    }
  }

  async saveVideo(videoId: string): Promise<string> {
    const stream = ytdl(videoId, {
      quality: 'highestaudio',
    });
    const filePath = `${__dirname}/${videoId}.mp3`;
    const start = Date.now();
    return await new Promise((resolve) =>
      ffmpeg(stream)
        .audioBitrate(32)
        .noVideo()
        .save(filePath)
        .on('progress', (p) => {
          process.stdout.write(`${p.targetSize}kb downloaded\n`);
        })
        .on('end', () => {
          console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
          return resolve(filePath);
        }),
    );
  }

  async uploadVideo(path: string) {
    const byteArrayBuffer = await readFile(path);

    return await new Promise((resolve, reject) => {
      this.cloudinarySevice
        .v2()
        .uploader.upload_stream(
          { resource_type: 'raw', public_id: path.split('/').pop() },
          (error, uploadResult) => {
            if (error) {
              return reject(error);
            }
            return resolve(uploadResult);
          },
        )
        .end(byteArrayBuffer);
    });
  }

  private async saveWhisperResponse(response: string, videoId: string) {
    try {
      return await this.prismaService.whisperResponse.create({
        data: {
          id: videoId,
          youtubeId: videoId,
          response: JSON.stringify(response),
        },
      });
    } catch (error) {
      console.log('saveWhisperResponse:', error);
    }
  }

  async summarizeText(text: string) {
    try {
      const res = await axios({
        method: 'post',
        url: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/facebook/bart-large-cnn`,
        data: {
          input_text: text,
        },
        headers: {
          'Content-Type': 'application/octet-stream',
          Authorization: `Bearer ${process.env.CLOUDFLARE_WORKER_AI_TOKEN}`,
        },
      });

      return res.data;
    } catch (error) {
      console.log(error?.response?.data);
      throw error;
    }
  }

  async isVideoSaved(videoId: string) {
    return await this.prismaService.whisperResponse.count({
      where: { youtubeId: videoId },
    });
  }
}

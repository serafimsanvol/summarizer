import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { VideoService } from './video.service';
import { existsSync } from 'fs';
import { extractVideoId } from './helpers';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('summarize')
  async summarize(@Body('text') text: string) {
    return this.videoService.summarizeText(text);
  }

  @Get('save')
  async save(@Query('url') url: string) {
    const successResult = { success: true };

    const videoId = extractVideoId(url);

    const filePath = `${__dirname}/${videoId}.mp3`;

    if (existsSync(filePath)) return successResult;

    if (await this.videoService.isVideoSaved(videoId)) return successResult;

    await this.videoService.saveVideo(videoId);
    await this.videoService.uploadVideo(filePath);

    return successResult;
  }

  @Get('transcribe')
  async transcribe(@Query('url') url: string) {
    const videoId = extractVideoId(url);
    return this.videoService.transcribeVideo(videoId);
  }
}

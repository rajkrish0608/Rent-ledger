import { Controller, Post, Get, Put, Body, Query, Param, UseGuards, Request, Req, StreamableFile, Res, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';
import { Request as ExpressRequest, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { CreateMediaFileDto } from './dto/create-media-file.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OcrService } from '../ocr/ocr.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

/**
 * Controller for handling media uploads.
 * Primarily handles generating secure upload URLs (S3) or proxing uploads (Local).
 */
@Controller('media')
export class MediaController {
    constructor(
        private readonly mediaService: MediaService,
        @Inject(forwardRef(() => OcrService))
        private readonly ocrService: OcrService,
        @InjectQueue('ocr-processing')
        private readonly ocrQueue: Queue,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('upload-url')
    async getUploadUrl(@Body() body: { filename: string, mimetype: string }, @Request() req: any) {
        // Generate unique key to prevent collisions
        // Structure: uploads/timestamp_random_filename
        const sanitizedParams = body.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${sanitizedParams}`;

        const url = await this.mediaService.getUploadUrl(key, body.mimetype);

        return {
            uploadUrl: url,
            key: key,
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post('confirm')
    async confirm(@Body() dto: CreateMediaFileDto, @CurrentUser() user: User) {
        const media = await this.mediaService.createMediaFile(dto, user);

        // Trigger OCR processing (fire and forget or await depending on requirements)
        // Awaiting for now to ensure debugging
        try {
            if (media.file_type === 'IMAGE' || media.file_type === 'PDF' || media.mime_type.startsWith('image/')) {
                // Queue OCR processing in background
                await this.ocrQueue.add('process-ocr', {
                    mediaId: media.id,
                });
            }
        } catch (e) {
            console.error('OCR processing failed', e);
            // Don't fail the request, just log error
        }

        return media;
    }

    @UseGuards(JwtAuthGuard)
    @Post('download-url')
    async getDownloadUrl(@Body() body: { key: string }) {
        const url = await this.mediaService.getDownloadUrl(body.key);
        return { downloadUrl: url };
    }

    // --- Local Development Endpoints (Mimic S3) ---

    @Put('upload/local')
    async uploadLocal(@Query('key') key: string, @Req() req: ExpressRequest) {
        if (!key) throw new NotFoundException('Key required');

        console.log(`Receiving local upload for key: ${key}`);

        // Save raw stream to file
        await this.mediaService.saveLocalStream(key, req);

        return { success: true };
    }

    @Get('download/local/:key')
    async downloadLocal(@Param('key') key: string, @Res({ passthrough: true }) res: Response) {
        // Serve file stream
        try {
            const stream = this.mediaService.getLocalStream(key);
            res.set({
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': `attachment; filename="${key}"`,
            });
            return new StreamableFile(stream);
        } catch (e) {
            throw new NotFoundException('File not found');
        }
    }
}

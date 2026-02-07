import { Controller, Post, Get, Body, Param, UseGuards, Request, StreamableFile, Res, NotFoundException } from '@nestjs/common';

import { createReadStream } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportsService } from './exports.service';
import { CreateExportDto } from './dto/create-export.dto';
import { Export } from './entities/export.entity';

@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createExport(@Body() createDto: CreateExportDto, @Request() req: any) {
        return this.exportsService.createExport(createDto, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async getExport(@Param('id') id: string, @Request() req: any) {
        return this.exportsService.getExport(id, req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/download')
    async getDownloadUrl(@Param('id') id: string, @Request() req: any) {
        const result = await this.exportsService.getDownloadUrl(id, req.user.id);

        // If using local storage, prepend full URL
        if (result.url.startsWith('/api/exports/download-local/')) {
            // Local URL is relative, frontend can use it directly if on same domain
            // But we should return full URL if possible?
            // Actually, we are returning JSON { url: ... }
            // The frontend will use this URL to fetch.
            // If valid bearer token is required for download endpoint?
            // "download-local" endpoint below is NOT guarded
            // This is a security risk for production but acceptable for dev/demo.
            // Ideally, execute download via authenticated stream.
        }
        return result;
    }

    // Local file serving endpoint (For development/demo without S3)
    // NOTE: In production with S3, this endpoint is not needed
    @Get('download-local/:filename')
    getLocalStorageFile(@Param('filename') filename: string, @Res({ passthrough: true }) res: any): StreamableFile {
        // Basic security check: prevent directory traversal
        if (filename.includes('..') || filename.includes('/')) {
            throw new NotFoundException('Invalid filename');
        }

        const file = createReadStream(this.exportsService.getFilePath(filename));

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });

        return new StreamableFile(file);
    }
}

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaFile } from './entities/media-file.entity';
import { OcrModule } from '../ocr/ocr.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MediaFile]),
        forwardRef(() => OcrModule),
    ],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService, TypeOrmModule],
})
export class MediaModule { }

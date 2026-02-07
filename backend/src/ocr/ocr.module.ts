import { Module, forwardRef } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { MediaModule } from '../media/media.module';
import { BullModule } from '@nestjs/bullmq';
import { OcrProcessor } from './ocr.processor';

@Module({
    imports: [
        forwardRef(() => MediaModule),
        BullModule.registerQueue({
            name: 'ocr-processing',
        }),
    ],
    providers: [OcrService, OcrProcessor],
    exports: [OcrService, BullModule],
})
export class OcrModule { }

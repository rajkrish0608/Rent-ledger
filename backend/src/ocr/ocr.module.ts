import { Module, forwardRef } from '@nestjs/common';
import { OcrService } from './ocr.service';
import { MediaModule } from '../media/media.module';

@Module({
    imports: [forwardRef(() => MediaModule)],
    providers: [OcrService],
    exports: [OcrService],
})
export class OcrModule { }

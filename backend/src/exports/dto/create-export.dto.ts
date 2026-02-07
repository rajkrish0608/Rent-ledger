import { IsUUID, IsNotEmpty, IsOptional, IsObject, IsBoolean, IsEnum } from 'class-validator';

export class CreateExportDto {
    @IsUUID()
    @IsNotEmpty()
    rental_id: string;

    @IsOptional()
    @IsObject()
    options?: {
        include_media?: boolean;
        include_all_events?: boolean;
        format?: 'pdf' | 'json';
    };
}

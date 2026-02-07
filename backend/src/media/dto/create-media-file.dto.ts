import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsJSON } from 'class-validator';

export class CreateMediaFileDto {
    @IsNotEmpty()
    @IsString()
    key: string;

    @IsNotEmpty()
    @IsString()
    file_type: string;

    @IsNotEmpty()
    @IsString()
    file_name: string;

    @IsNotEmpty()
    @IsNumber()
    file_size: number;

    @IsNotEmpty()
    @IsString()
    mime_type: string;

    @IsOptional()
    @IsUUID()
    rental_id?: string;

    @IsOptional()
    @IsUUID()
    event_id?: string;

    @IsOptional()
    metadata?: Record<string, any>;
}

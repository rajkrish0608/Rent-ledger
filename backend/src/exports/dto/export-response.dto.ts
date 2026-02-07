export class ExportResponseDto {
    id: string;
    rental_id: string;
    status: string;
    download_url?: string;
    expires_at?: string;
    created_at: string;
    error_message?: string;
}

export class EventResponseDto {
    id: string;
    rental_id: string;
    event_type: string;
    event_data: Record<string, any>;
    actor_id: string;
    actor_name: string;
    actor_type: string;
    timestamp: string;
    current_event_hash: string;
    previous_event_hash?: string;
    created_at: string;
}

import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/rental_event.dart';

part 'rental_event_model.g.dart';

@JsonSerializable()
class RentalEventModel {
  final String id;
  @JsonKey(name: 'rental_id')
  final String rentalId;
  @JsonKey(name: 'event_type')
  final String eventType;
  @JsonKey(name: 'event_data')
  final Map<String, dynamic> eventData;
  @JsonKey(name: 'actor_id')
  final String actorId;
  @JsonKey(name: 'actor_name')
  final String actorName;
  @JsonKey(name: 'actor_type')
  final String actorType;
  final String timestamp;
  @JsonKey(name: 'current_event_hash')
  final String currentEventHash;
  @JsonKey(name: 'previous_event_hash')
  final String? previousEventHash;
  @JsonKey(name: 'created_at')
  final String createdAt;

  RentalEventModel({
    required this.id,
    required this.rentalId,
    required this.eventType,
    required this.eventData,
    required this.actorId,
    required this.actorName,
    required this.actorType,
    required this.timestamp,
    required this.currentEventHash,
    this.previousEventHash,
    required this.createdAt,
  });

  factory RentalEventModel.fromJson(Map<String, dynamic> json) =>
      _$RentalEventModelFromJson(json);

  Map<String, dynamic> toJson() => _$RentalEventModelToJson(this);

  RentalEvent toEntity() {
    return RentalEvent(
      id: id,
      rentalId: rentalId,
      eventType: EventType.fromString(eventType),
      eventData: eventData,
      actorId: actorId,
      actorName: actorName,
      actorType: ActorType.fromString(actorType),
      timestamp: DateTime.parse(timestamp),
      currentEventHash: currentEventHash,
      previousEventHash: previousEventHash,
      createdAt: DateTime.parse(createdAt),
    );
  }
}

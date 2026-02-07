// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rental_event_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

RentalEventModel _$RentalEventModelFromJson(Map<String, dynamic> json) =>
    RentalEventModel(
      id: json['id'] as String,
      rentalId: json['rental_id'] as String,
      eventType: json['event_type'] as String,
      eventData: json['event_data'] as Map<String, dynamic>,
      actorId: json['actor_id'] as String,
      actorName: json['actor_name'] as String,
      actorType: json['actor_type'] as String,
      timestamp: json['timestamp'] as String,
      currentEventHash: json['current_event_hash'] as String,
      previousEventHash: json['previous_event_hash'] as String?,
      createdAt: json['created_at'] as String,
    );

Map<String, dynamic> _$RentalEventModelToJson(RentalEventModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'rental_id': instance.rentalId,
      'event_type': instance.eventType,
      'event_data': instance.eventData,
      'actor_id': instance.actorId,
      'actor_name': instance.actorName,
      'actor_type': instance.actorType,
      'timestamp': instance.timestamp,
      'current_event_hash': instance.currentEventHash,
      'previous_event_hash': instance.previousEventHash,
      'created_at': instance.createdAt,
    };

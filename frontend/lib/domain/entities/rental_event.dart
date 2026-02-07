class RentalEvent {
  final String id;
  final String rentalId;
  final EventType eventType;
  final Map<String, dynamic> eventData;
  final String actorId;
  final String actorName;
  final ActorType actorType;
  final DateTime timestamp;
  final String currentEventHash;
  final String? previousEventHash;
  final DateTime createdAt;

  const RentalEvent({
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
}

enum EventType {
  moveIn('MOVE_IN', 'Move In'),
  moveOut('MOVE_OUT', 'Move Out'),
  rentPaid('RENT_PAID', 'Rent Paid'),
  rentDelayed('RENT_DELAYED', 'Rent Delayed'),
  repairRequest('REPAIR_REQUEST', 'Repair Request'),
  repairCompleted('REPAIR_COMPLETED', 'Repair Completed'),
  noticeIssued('NOTICE_ISSUED', 'Notice Issued'),
  complaint('COMPLAINT', 'Complaint'),
  inspection('INSPECTION', 'Inspection'),
  disputeFlagged('DISPUTE_FLAGGED', 'Dispute Flagged');

  final String value;
  final String displayName;

  const EventType(this.value, this.displayName);

  static EventType fromString(String value) {
    return EventType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => EventType.inspection,
    );
  }
}

enum ActorType {
  tenant('TENANT', 'Tenant'),
  landlord('LANDLORD', 'Landlord'),
  broker('BROKER', 'Broker'),
  society('SOCIETY', 'Society'),
  system('SYSTEM', 'System');

  final String value;
  final String displayName;

  const ActorType(this.value, this.displayName);

  static ActorType fromString(String value) {
    return ActorType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => ActorType.system,
    );
  }
}

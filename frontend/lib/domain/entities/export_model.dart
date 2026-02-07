class Export {
  final String id;
  final String rentalId;
  final String status;
  final String? downloadUrl;
  final String? errorMessage;
  final DateTime createdAt;
  final DateTime updatedAt;

  Export({
    required this.id,
    required this.rentalId,
    required this.status,
    this.downloadUrl,
    this.errorMessage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Export.fromJson(Map<String, dynamic> json) {
    return Export(
      id: json['id'],
      rentalId: json['rental_id'],
      status: json['status'],
      downloadUrl: json['download_url'],
      errorMessage: json['error_message'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }
}

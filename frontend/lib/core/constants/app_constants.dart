// API Configuration
class ApiConstants {
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Auth Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  
  // Rentals Endpoints
  static const String rentals = '/rentals';
  static String rentalById(String id) => '/rentals/$id';
  static const String events = '/events';
  static String rentalEvents(String id) => '/rentals/$id/events';
  static String verifyRental(String id) => '/rentals/$id/verify';
  
  // Media Endpoints
  static const String mediaUploadUrl = '/media/upload-url';
  static const String mediaConfirm = '/media/confirm';
  static String mediaDownload(String id) => '/media/$id/download';
  
  // Export Endpoints
  static const String exports = '/exports';
  static String exportStatus(String id) => '/exports/$id';
  static String exportDownload(String id) => '/exports/$id/download';
}

// App Constants
class AppConstants {
  static const String appName = 'RentLedger';
  static const String appTagline = 'The system of record for rentals';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
}

// User Roles
enum UserRole {
  tenant,
  landlord,
  broker,
  societyAdmin,
  internalAdmin;
  
  String get value {
    switch (this) {
      case UserRole.tenant:
        return 'TENANT';
      case UserRole.landlord:
        return 'LANDLORD';
      case UserRole.broker:
        return 'BROKER';
      case UserRole.societyAdmin:
        return 'SOCIETY_ADMIN';
      case UserRole.internalAdmin:
        return 'INTERNAL_ADMIN';
    }
  }
}

// Event Types
class EventTypes {
  static const String rentalCreated = 'RENTAL_CREATED';
  static const String moveIn = 'MOVE_IN';
  static const String moveOut = 'MOVE_OUT';
  static const String rentPaid = 'RENT_PAID';
  static const String maintenanceRequest = 'MAINTENANCE_REQUEST';
  static const String inspectionScheduled = 'INSPECTION_SCHEDULED';
  static const String documentUploaded = 'DOCUMENT_UPLOADED';
  static const String disputeRaised = 'DISPUTE_RAISED';
  static const String disputeResolved = 'DISPUTE_RESOLVED';
}

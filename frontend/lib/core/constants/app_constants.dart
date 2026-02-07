class ApiConstants {
  static const String baseUrl = 'http://localhost:3000/api';

  // Auth Endpoints
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String fcmToken = '/auth/fcm-token';

  // Rental Endpoints
  static const String rentals = '/rentals';
  static String rentalById(String id) => '/rentals/$id';
  static String verifyRental(String id) => '/rentals/$id/verify';
  static String searchRental(String id) => '/rentals/$id/search';

  // Media Endpoints
  static const String uploadMedia = '/media/upload';
  static String confirmMedia(String id) => '/media/$id/confirm';
  static String mediaUrl(String id) => '/media/$id';

  // Export Endpoints
  static String createExport(String id) => '/exports/rental/$id';
  static String exportStatus(String id) => '/exports/$id';
}

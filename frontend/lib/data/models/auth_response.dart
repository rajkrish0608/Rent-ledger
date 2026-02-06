import 'user_model.dart';

class AuthResponse {
  final UserModel user;
  final String accessToken;
  final String refreshToken;

  AuthResponse({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> map) {
    return AuthResponse(
      user: UserModel.fromJson(map['user']),
      accessToken: map['accessToken'],
      refreshToken: map['refreshToken'],
    );
  }
}

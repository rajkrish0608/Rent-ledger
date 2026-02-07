import 'package:dio/dio.dart';
import '../../core/constants/app_constants.dart';
import '../models/auth_response.dart';

class AuthRemoteDataSource {
  final Dio dio;

  AuthRemoteDataSource(this.dio);

  Future<AuthResponse> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    required String role,
  }) async {
    final response = await dio.post(
      ApiConstants.register,
      data: {
        'email': email,
        'password': password,
        'name': name,
        if (phone != null) 'phone': phone,
        'role': role,
      },
    );

    return AuthResponse.fromJson(response.data);
  }

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await dio.post(
      ApiConstants.login,
      data: {
        'email': email,
        'password': password,
      },
    );

    return AuthResponse.fromJson(response.data);
  }

  Future<void> logout(String refreshToken) async {
    await dio.post(
      ApiConstants.logout,
      data: {'refreshToken': refreshToken},
    );
  }

  Future<void> updateFcmToken(String fcmToken) async {
    await dio.patch(
      ApiConstants.fcmToken,
      data: {'fcmToken': fcmToken},
    );
  }
}

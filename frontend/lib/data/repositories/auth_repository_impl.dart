import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';
import 'dart:convert';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final FlutterSecureStorage secureStorage;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.secureStorage,
  });

  @override
  Future<User> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    required String role,
  }) async {
    final response = await remoteDataSource.register(
      email: email,
      password: password,
      name: name,
      phone: phone,
      role: role,
    );

    // Save tokens
    await secureStorage.write(key: 'access_token', value: response.accessToken);
    await secureStorage.write(key: 'refresh_token', value: response.refreshToken);
    await secureStorage.write(key: 'user_data', value: jsonEncode(response.user.toJson()));

    return response.user;
  }

  @override
  Future<User> login({
    required String email,
    required String password,
  }) async {
    final response = await remoteDataSource.login(
      email: email,
      password: password,
    );

    // Save tokens
    await secureStorage.write(key: 'access_token', value: response.accessToken);
    await secureStorage.write(key: 'refresh_token', value: response.refreshToken);
    await secureStorage.write(key: 'user_data', value: jsonEncode(response.user.toJson()));

    return response.user;
  }

  @override
  Future<void> logout() async {
    final refreshToken = await secureStorage.read(key: 'refresh_token');
    if (refreshToken != null) {
      await remoteDataSource.logout(refreshToken);
    }

    await secureStorage.deleteAll();
  }

  @override
  Future<User?> getCurrentUser() async {
    final userDataString = await secureStorage.read(key: 'user_data');
    if (userDataString == null) return null;

    final userData = jsonDecode(userDataString);
    return UserModel.fromJson(userData);
  }

  @override
  Future<void> updateFcmToken(String token) async {
    await remoteDataSource.updateFcmToken(token);
  }
}

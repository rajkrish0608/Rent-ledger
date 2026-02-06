import '../entities/user.dart';

abstract class AuthRepository {
  Future<User> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    required String role,
  });

  Future<User> login({
    required String email,
    required String password,
  });

  Future<void> logout();

  Future<User?> getCurrentUser();
}

import '../entities/user.dart';

abstract class AuthRepository {
  Future\u003cUser\u003e register({
    required String email,
    required String password,
    required String name,
    String? phone,
    required String role,
  });

  Future\u003cUser\u003e login({
    required String email,
    required String password,
  });

  Future\u003cvoid\u003e logout();

  Future\u003cUser?\u003e getCurrentUser();
}

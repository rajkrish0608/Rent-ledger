import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user.dart';
import 'providers.dart';

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final Ref ref;

  AuthNotifier(this.ref) : super(const AsyncValue.loading()) {
    _loadUser();
  }

  Future<void> _loadUser() async {
    try {
      final user = await ref.read(authRepositoryProvider).getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e) {
      state = AsyncValue.data(null);
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String name,
    String? phone,
    required String role,
  }) async {
    state = const AsyncValue.loading();
    try {
      final user = await ref.read(authRepositoryProvider).register(
            email: email,
            password: password,
            name: name,
            phone: phone,
            role: role,
          );
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AsyncValue.loading();
    try {
      final user = await ref.read(authRepositoryProvider).login(
            email: email,
            password: password,
          );
      state = AsyncValue.data(user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncValue.data(null);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  return AuthNotifier(ref);
});

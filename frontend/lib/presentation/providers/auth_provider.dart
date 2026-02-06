import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/user.dart';
import 'providers.dart';

class AuthNotifier extends StateNotifier\u003cAsyncValue\u003cUser?\u003e\u003e {
  final Ref ref;

  AuthNotifier(this.ref) : super(const AsyncValue.loading()) {
    _loadUser();
  }

  Future\u003cvoid\u003e _loadUser() async {
    try {
      final user = await ref.read(authRepositoryProvider).getCurrentUser();
      state = AsyncValue.data(user);
    } catch (e) {
      state = AsyncValue.data(null);
    }
  }

  Future\u003cvoid\u003e register({
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

  Future\u003cvoid\u003e login({
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

  Future\u003cvoid\u003e logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncValue.data(null);
  }
}

final authProvider = StateNotifierProvider\u003cAuthNotifier, AsyncValue\u003cUser?\u003e\u003e((ref) {
  return AuthNotifier(ref);
});

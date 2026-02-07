import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:rentledger/domain/entities/user.dart';
import 'package:rentledger/domain/repositories/auth_repository.dart';
import 'package:rentledger/presentation/providers/auth_provider.dart';
import 'package:rentledger/presentation/providers/providers.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late MockAuthRepository mockAuthRepository;
  late ProviderContainer container;

  setUp(() {
    mockAuthRepository = MockAuthRepository();
    container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(mockAuthRepository),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  final mockUser = User(
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'TENANT',
  );

  test('initial state should be loading and then data(null) if no user', () async {
    when(() => mockAuthRepository.getCurrentUser()).thenAnswer((_) async => null);

    // Assert initial state is loading
    expect(container.read(authProvider), const AsyncValue<User?>.loading());

    // Wait for the provider to finish initialization
    await container.read(authProvider.notifier).register(email: '', password: '', name: '', role: ''); 
    // Wait for initialization
    await Future.microtask(() {});

    expect(container.read(authProvider).value, null);
  });

  test('login should update state with user on success', () async {
    when(() => mockAuthRepository.getCurrentUser()).thenAnswer((_) async => null);
    when(() => mockAuthRepository.login(
          email: 'test@example.com',
          password: 'password',
        )).thenAnswer((_) async => mockUser);

    final notifier = container.read(authProvider.notifier);
    
    await notifier.login(email: 'test@example.com', password: 'password');

    expect(container.read(authProvider).value, mockUser);
  });

  test('logout should update state to null', () async {
    when(() => mockAuthRepository.getCurrentUser()).thenAnswer((_) async => mockUser);
    when(() => mockAuthRepository.logout()).thenAnswer((_) async => {});

    final notifier = container.read(authProvider.notifier);
    
    await notifier.logout();

    expect(container.read(authProvider).value, null);
    verify(() => mockAuthRepository.logout()).called(1);
  });
}

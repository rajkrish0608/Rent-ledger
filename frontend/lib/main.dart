import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/theme/app_theme.dart';
import 'core/constants/app_constants.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/screens/auth/login_screen.dart';
import 'presentation/screens/auth/register_screen.dart';
import 'presentation/screens/rentals/my_rentals_screen.dart';
import 'presentation/screens/rentals/timeline_screen.dart';
import 'presentation/screens/rentals/add_event_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: RentLedgerApp(),
    ),
  );
}

class RentLedgerApp extends ConsumerWidget {
  const RentLedgerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = GoRouter(
      initialLocation: '/splash',
      redirect: (context, state) {
        final authState = ref.read(authProvider);
        final isLoggedIn = authState.value != null;

        // If on splash, check auth and redirect
        if (state.matchedLocation == '/splash') {
          return isLoggedIn ? '/rentals' : '/login';
        }

        // If not logged in and trying to access protected routes
        if (!isLoggedIn && 
            (state.matchedLocation.startsWith('/rentals') || 
             state.matchedLocation.startsWith('/home'))) {
          return '/login';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/splash',
          builder: (context, state) => const SplashScreen(),
        ),
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          builder: (context, state) => RegisterScreen(),
        ),
        GoRoute(
          path: '/rentals',
          builder: (context, state) => const MyRentalsScreen(),
        ),
        GoRoute(
          path: '/rentals/:id',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return TimelineScreen(rentalId: id);
          },
        ),
        GoRoute(
          path: '/rentals/:id/add-event',
          builder: (context, state) {
            final id = state.pathParameters['id']!;
            return AddEventScreen(rentalId: id);
          },
        ),
      ],
    );

    return MaterialApp.router(
      title: AppConstants.appName,
      theme: AppTheme.lightTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}

// Splash Screen
class SplashScreen extends ConsumerWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Auto-navigate after checking auth
    Future.delayed(const Duration(seconds: 2), () {
      if (context.mounted) {
        final authState = ref.read(authProvider);
        final isLoggedIn = authState.value != null;
        context.go(isLoggedIn ? '/rentals' : '/login');
      }
    });

    return Scaffold(
      backgroundColor: AppTheme.primaryColor,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              AppConstants.appName,
              style: Theme.of(context).textTheme.displayLarge?.copyWith(
                    color: Colors.white,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              AppConstants.appTagline,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white70,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

// Home Screen
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('RentLedger'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: Center(
        child: authState.when(
          data: (user) {
            if (user == null) return const Text('Not logged in');
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Welcome, ${user.name}!',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Email: ${user.email}',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                Text(
                  'Role: ${user.role}',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            );
          },
          loading: () => const CircularProgressIndicator(),
          error: (error, _) => Text('Error: $error'),
        ),
      ),
    );
  }
}

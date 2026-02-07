import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../presentation/providers/auth_providers.dart';

class FcmService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final Ref ref;

  FcmService(this.ref);

  Future<void> initialize() async {
    // 1. Request Permission
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else {
      print('User declined or has not accepted permission');
      return;
    }

    // 2. Local Notifications Setup (for foreground messages)
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings initializationSettingsDarwin =
        DarwinInitializationSettings();

    const InitializationSettings initializationSettings = InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsDarwin,
    );

    await _localNotifications.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle notification tap
        print('Notification tapped: ${details.payload}');
      },
    );

    // 3. Listen for foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Foreground message received: ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // 4. Handle background/terminated state messages
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Notification opened app: ${message.data}');
      // Navigate to specific screen if needed
    });

    // 5. Token Management
    _setupTokenRefresh();
  }

  Future<void> _setupTokenRefresh() async {
    // Initial token
    final token = await _messaging.getToken();
    if (token != null) {
      _updateTokenOnBackend(token);
    }

    // Refresh listener
    _messaging.onTokenRefresh.listen((newToken) {
      _updateTokenOnBackend(newToken);
    });
  }

  Future<void> _updateTokenOnBackend(String token) async {
    print('Updating FCM token on backend: $token');
    try {
      final authRepository = ref.read(authRepositoryProvider);
      await authRepository.updateFcmToken(token);
    } catch (e) {
      print('Failed to update FCM token on backend: $e');
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null) {
      await _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: DarwinNotificationDetails(),
        ),
        payload: message.data.toString(),
      );
    }
  }
}

final fcmServiceProvider = Provider<FcmService>((ref) => FcmService(ref));

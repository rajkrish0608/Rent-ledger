import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/entities/rental.dart';
import '../../domain/entities/rental_event.dart';
import '../../data/repositories/rental_repository_impl.dart';
import '../providers/providers.dart';

// Provider for rental repository
final rentalRepositoryProvider = Provider<RentalRepositoryImpl>((ref) {
  return RentalRepositoryImpl(ref.watch(dioProvider));
});

// Provider to fetch user's rentals
final myRentalsProvider = FutureProvider<List<Rental>>((ref) async {
  final repository = ref.watch(rentalRepositoryProvider);
  return repository.getMyRentals();
});

// Provider to fetch a single rental by ID
final rentalProvider = FutureProvider.family<Rental, String>((ref, rentalId) async {
  final repository = ref.watch(rentalRepositoryProvider);
  return repository.getRentalById(rentalId);
});

// Provider to fetch events for a rental
final rentalEventsProvider = FutureProvider.family<List<RentalEvent>, String>(
  (ref, rentalId) async {
    final repository = ref.watch(rentalRepositoryProvider);
    return repository.getEventsByRental(rentalId);
  },
);

// State notifier for creating events
class EventCreationNotifier extends StateNotifier<AsyncValue<void>> {
  final RentalRepositoryImpl repository;

  EventCreationNotifier(this.repository) : super(const AsyncValue.data(null));

  Future<void> createEvent({
    required String rentalId,
    required EventType eventType,
    required Map<String, dynamic> eventData,
    required ActorType actorType,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await repository.createEvent(
        rentalId: rentalId,
        eventType: eventType,
        eventData: eventData,
        actorType: actorType,
      );
    });
  }
}

final eventCreationProvider = StateNotifierProvider<EventCreationNotifier, AsyncValue<void>>(
  (ref) => EventCreationNotifier(ref.watch(rentalRepositoryProvider)),
);

// State notifier for creating rentals
class RentalCreationNotifier extends StateNotifier<AsyncValue<Rental?>> {
  final RentalRepositoryImpl repository;

  RentalCreationNotifier(this.repository) : super(const AsyncValue.data(null));

  Future<Rental?> createRental({
    required String propertyAddress,
    String? propertyUnit,
    required DateTime startDate,
    List<Map<String, String>>? participants,
  }) async {
    state = const AsyncValue.loading();
    
    Rental? createdRental;
    state = await AsyncValue.guard(() async {
      createdRental = await repository.createRental(
        propertyAddress: propertyAddress,
        propertyUnit: propertyUnit,
        startDate: startDate,
        participants: participants,
      );
      return createdRental;
    });
    
    return createdRental;
  }

  void reset() {
    state = const AsyncValue.data(null);
  }
}

final rentalCreationProvider = StateNotifierProvider<RentalCreationNotifier, AsyncValue<Rental?>>(
  (ref) => RentalCreationNotifier(ref.watch(rentalRepositoryProvider)),
);

// Provider for search query on a timeline
final timelineSearchQueryProvider = StateProvider.family<String, String>((ref, rentalId) => '');

// Provider to track if searching is active
final timelineIsSearchingProvider = StateProvider.family<bool, String>((ref, rentalId) => false);

// Provider for filtered/searched events
final timelineSearchResultProvider = FutureProvider.family<List<RentalEvent>, String>((ref, rentalId) async {
  final query = ref.watch(timelineSearchQueryProvider(rentalId));
  final repository = ref.watch(rentalRepositoryProvider);
  
  if (query.isEmpty) {
    // If no query, return the default events (wait for the family provider)
    return ref.watch(rentalEventsProvider(rentalId).future);
  }
  
  // Call the search API
  return repository.searchTimeline(rentalId, query);
});

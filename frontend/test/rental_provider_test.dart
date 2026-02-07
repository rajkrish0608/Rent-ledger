import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:rentledger/domain/entities/rental.dart';
import 'package:rentledger/domain/entities/rental_event.dart';
import 'package:rentledger/data/repositories/rental_repository_impl.dart';
import 'package:rentledger/presentation/providers/rental_providers.dart';

class MockRentalRepository extends Mock implements RentalRepositoryImpl {}

void main() {
  late MockRentalRepository mockRentalRepository;
  late ProviderContainer container;

  setUp(() {
    mockRentalRepository = MockRentalRepository();
    container = ProviderContainer(
      overrides: [
        rentalRepositoryProvider.overrideWithValue(mockRentalRepository),
      ],
    );
  });

  tearDown(() {
    container.dispose();
  });

  final mockRental = Rental(
    id: 'rental-1',
    propertyAddress: '123 Main St',
    propertyUnit: '4B',
    startDate: DateTime(2024, 1, 1),
    status: RentalStatus.active,
    participants: [],
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
  );

  test('myRentalsProvider should fetch and return rentals', () async {
    when(() => mockRentalRepository.getMyRentals()).thenAnswer((_) async => [mockRental]);

    final rentals = await container.read(myRentalsProvider.future);

    expect(rentals, [mockRental]);
    verify(() => mockRentalRepository.getMyRentals()).called(1);
  });

  test('rentalCreationProvider should update state with created rental', () async {
    final startDate = DateTime(2024, 1, 1);
    when(() => mockRentalRepository.createRental(
          propertyAddress: '123 Main St',
          propertyUnit: '4B',
          startDate: startDate,
          participants: any(named: 'participants'),
        )).thenAnswer((_) async => mockRental);

    final notifier = container.read(rentalCreationProvider.notifier);
    
    final result = await notifier.createRental(
      propertyAddress: '123 Main St',
      propertyUnit: '4B',
      startDate: startDate,
    );

    expect(result, mockRental);
    expect(container.read(rentalCreationProvider).value, mockRental);
  });

  test('timelineSearchQueryProvider should update query state', () {
    const rentalId = 'rental-1';
    final notifier = container.read(timelineSearchQueryProvider(rentalId).notifier);
    
    notifier.state = 'search query';
    
    expect(container.read(timelineSearchQueryProvider(rentalId)), 'search query');
  });
}

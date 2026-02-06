# RentLedger - Unified Implementation Plan (Part 3)
## Sections 7-10: Dashboards, UI/UX, Reputation, and OCR

---

## 7. Broker Dashboard

### 7.1 Backend: Dashboard Analytics

- [ ] **Create dashboard service:**
  ```typescript
  // src/dashboard/dashboard.service.ts
  @Injectable()
  export class DashboardService {
    constructor(
      @InjectRepository(Rental)
      private rentalsRepo: Repository<Rental>,
      @InjectRepository(RentalEvent)
      private eventsRepo: Repository<RentalEvent>,
    ) {}
    
    async getBrokerStats(brokerId: string): Promise<DashboardStats> {
      const activeRentals = await this.rentalsRepo.count({
        where: {
          status: 'ACTIVE',
          participants: { user_id: brokerId, role: 'BROKER' },
        },
      });
      
      const closedRentals = await this.rentalsRepo.count({
        where: {
          status: 'CLOSED',
          participants: { user_id: brokerId, role: 'BROKER' },
        },
      });
      
      const pendingMoveOuts = await this.rentalsRepo.count({
        where: {
          status: 'ACTIVE',
          end_date: LessThan(new Date()),
          participants: { user_id: brokerId, role: 'BROKER' },
        },
      });
      
      const recentActivity = await this.eventsRepo.find({
        where: {
          rental: {
            participants: { user_id: brokerId, role: 'BROKER' },
          },
        },
        order: { timestamp: 'DESC' },
        take: 10,
        relations: ['rental', 'actor'],
      });
      
      return {
        active_rentals: activeRentals,
        closed_rentals: closedRentals,
        pending_move_outs: pendingMoveOuts,
        recent_activity: recentActivity,
      };
    }
    
    async getDisputeRentals(brokerId: string): Promise<Rental[]> {
      // Rentals flagged with dispute events
      return this.rentalsRepo
        .createQueryBuilder('rental')
        .leftJoinAndSelect('rental.events', 'event')
        .leftJoinAndSelect('rental.participants', 'participant')
        .where('participant.user_id = :brokerId', { brokerId })
        .andWhere('participant.role = :role', { role: 'BROKER' })
        .andWhere('event.event_type = :disputeType', { disputeType: 'DISPUTE_FLAGGED' })
        .getMany();
    }
  }
  ```

- [ ] **Create dashboard controller:**
  ```typescript
  @Controller('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('BROKER', 'SOCIETY_ADMIN')
  export class DashboardController {
    @Get('stats')
    async getStats(@CurrentUser() user: User) {
      return this.dashboardService.getBrokerStats(user.id);
    }
    
    @Get('disputes')
    async getDisputes(@CurrentUser() user: User) {
      return this.dashboardService.getDisputeRentals(user.id);
    }
  }
  ```

### 7.2 Flutter: Broker Dashboard UI

- [ ] **Create dashboard screen:**
  ```dart
  // lib/presentation/screens/broker/broker_dashboard_screen.dart
  class BrokerDashboardScreen extends ConsumerWidget {
    const BrokerDashboardScreen({Key? key}) : super(key: key);
    
    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final statsAsyncValue = ref.watch(dashboardStatsProvider);
      
      return Scaffold(
        appBar: AppBar(
          title: const Text('Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.person),
              onPressed: () => context.go('/account'),
            ),
          ],
        ),
        drawer: const BrokerNavigationDrawer(),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(dashboardStatsProvider);
          },
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Overview',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 16),
                statsAsyncValue.when(
                  data: (stats) => _StatsGrid(stats: stats),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => ErrorWidget(error: err.toString()),
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Activity',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    TextButton(
                      onPressed: () => context.go('/rentals'),
                      child: const Text('View All'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                statsAsyncValue.when(
                  data: (stats) => _RecentActivityList(
                    activities: stats.recentActivity,
                  ),
                  loading: () => const SizedBox.shrink(),
                  error: (err, stack) => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.go('/rentals/create'),
          icon: const Icon(Icons.add),
          label: const Text('Create Rental'),
        ),
      );
    }
  }
  
  class _StatsGrid extends StatelessWidget {
    final DashboardStats stats;
    
    const _StatsGrid({required this.stats});
    
    @override
    Widget build(BuildContext context) {
      return GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.5,
        children: [
          _StatCard(
            title: 'Active Rentals',
            value: stats.activeRentals.toString(),
            icon: Icons.home,
            color: Colors.blue,
          ),
          _StatCard(
            title: 'Closed Rentals',
            value: stats.closedRentals.toString(),
            icon: Icons.check_circle,
            color: Colors.green,
          ),
          _StatCard(
            title: 'Pending Move-outs',
            value: stats.pendingMoveOuts.toString(),
            icon: Icons.warning,
            color: Colors.orange,
          ),
          _StatCard(
            title: 'Total Managed',
            value: (stats.activeRentals + stats.closedRentals).toString(),
            icon: Icons.analytics,
            color: Colors.purple,
          ),
        ],
      );
    }
  }
  
  class _StatCard extends StatelessWidget {
    final String title;
    final String value;
    final IconData icon;
    final Color color;
    
    const _StatCard({
      required this.title,
      required this.value,
      required this.icon,
      required this.color,
    });
    
    @override
    Widget build(BuildContext context) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(icon, color: color, size: 24),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }
  }
  ```

- [ ] **Create rentals list screen:**
  ```dart
  // lib/presentation/screens/broker/rentals_list_screen.dart
  class RentalsListScreen extends ConsumerStatefulWidget {
    const RentalsListScreen({Key? key}) : super(key: key);
    
    @override
    ConsumerState<RentalsListScreen> createState() => _RentalsListScreenState();
  }
  
  class _RentalsListScreenState extends ConsumerState<RentalsListScreen> {
    String _statusFilter = 'ALL';
    String _searchQuery = '';
    
    @override
    Widget build(BuildContext context) {
      final rentalsAsyncValue = ref.watch(myRentalsProvider);
      
      return Scaffold(
        appBar: AppBar(
          title: const Text('Rentals'),
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(60),
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        hintText: 'Search by address...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        filled: true,
                        fillColor: Colors.white,
                      ),
                      onChanged: (value) {
                        setState(() => _searchQuery = value);
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  DropdownButton<String>(
                    value: _statusFilter,
                    items: const [
                      DropdownMenuItem(value: 'ALL', child: Text('All')),
                      DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                      DropdownMenuItem(value: 'CLOSED', child: Text('Closed')),
                    ],
                    onChanged: (value) {
                      setState(() => _statusFilter = value!);
                    },
                  ),
                ],
              ),
            ),
          ),
        ),
        body: rentalsAsyncValue.when(
          data: (rentals) {
            final filtered = rentals.where((rental) {
              final matchesStatus = _statusFilter == 'ALL' ||
                  rental.status.toString().split('.').last.toUpperCase() ==
                      _statusFilter;
              final matchesSearch = _searchQuery.isEmpty ||
                  rental.propertyAddress
                      .toLowerCase()
                      .contains(_searchQuery.toLowerCase());
              return matchesStatus && matchesSearch;
            }).toList();
            
            if (filtered.isEmpty) {
              return const Center(child: Text('No rentals found'));
            }
            
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                return RentalListCard(
                  rental: filtered[index],
                  onTap: () => context.go('/rentals/${filtered[index].id}'),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => context.go('/rentals/create'),
          child: const Icon(Icons.add),
        ),
      );
    }
  }
  
  class RentalListCard extends StatelessWidget {
    final Rental rental;
    final VoidCallback onTap;
    
    const RentalListCard({
      required this.rental,
      required this.onTap,
    });
    
    @override
    Widget build(BuildContext context) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        rental.propertyAddress,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    _StatusBadge(status: rental.status),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.people, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${rental.participants.length} participants',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.event, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      '${rental.eventCount} events',
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Started: ${DateFormat('MMM dd, yyyy').format(rental.startDate)}',
                  style: TextStyle(color: Colors.grey[600], fontSize: 13),
                ),
              ],
            ),
          ),
        ),
      );
    }
  }
  ```

---

## 8. Housing Society Dashboard

### 8.1 Backend: Society-Specific Features

- [ ] **Create society service:**
  ```typescript
  // src/society/society.service.ts
  @Injectable()
  export class SocietyService {
    constructor(
      @InjectRepository(Rental)
      private rentalsRepo: Repository<Rental>,
      @InjectRepository(User)
      private usersRepo: Repository<User>,
    ) {}
    
    async getSocietyRentals(societyAdminId: string): Promise<Rental[]> {
      // Get society admin's society
      const admin = await this.usersRepo.findOne({
        where: { id: societyAdminId },
        relations: ['society'],
      });
      
      if (!admin?.society) {
        throw new NotFoundException('Society not found');
      }
      
      // Get all rentals in this society
      return this.rentalsRepo.find({
        where: {
          property_address: Like(`%${admin.society.name}%`),
        },
        relations: ['participants', 'participants.user'],
        order: { created_at: 'DESC' },
      });
    }
    
    async logMoveInOut(
      dto: LogMoveInOutDto,
      societyAdminId: string,
    ): Promise<RentalEvent> {
      // Verify society admin has permission
      // Create MOVE_IN or MOVE_OUT event
      // ...
    }
    
    async requestAccessToRental(
      rentalId: string,
      societyAdminId: string,
      reason: string,
    ): Promise<AccessRequest> {
      // Create access request
      // Notify tenant/landlord
      // ...
    }
  }
  ```

### 8.2 Flutter: Society Dashboard

- [ ] **Create society dashboard:**
  ```dart
  // lib/presentation/screens/society/society_dashboard_screen.dart
  class SocietyDashboardScreen extends ConsumerWidget {
    const SocietyDashboardScreen({Key? key}) : super(key: key);
    
    @override
    Widget build(BuildContext context, WidgetRef ref) {
      final rentalsAsyncValue = ref.watch(societyRentalsProvider);
      
      return Scaffold(
        appBar: AppBar(
          title: const Text('Society Dashboard'),
        ),
        drawer: const SocietyNavigationDrawer(),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'All Rentals',
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              rentalsAsyncValue.when(
                data: (rentals) => _RentalsByBuilding(rentals: rentals),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => ErrorWidget(error: err.toString()),
              ),
            ],
          ),
        ),
      );
    }
  }
  ```

---

## 9. UI/UX Implementation

### 9.1 Design System Setup

- [ ] **Create app theme:**
  ```dart
  // lib/core/theme/app_theme.dart
  class AppTheme {
    // Colors - Institutional, calm, neutral
    static const Color primaryColor = Color(0xFF1E3A8A); // Deep indigo
    static const Color backgroundColor = Color(0xFFF8F9FB); // Off-white
    static const Color surfaceColor = Color(0xFFFFFFFF); // White
    static const Color textPrimary = Color(0xFF0F172A); // Charcoal
    static const Color textSecondary = Color(0xFF64748B); // Gray
    static const Color dividerColor = Color(0xFFCBD5E1); // Slate
    
    static ThemeData get lightTheme {
      return ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.light(
          primary: primaryColor,
          background: backgroundColor,
          surface: surfaceColor,
          onPrimary: Colors.white,
          onBackground: textPrimary,
          onSurface: textPrimary,
        ),
        
        // Typography - Inter font
        textTheme: GoogleFonts.interTextTheme().copyWith(
          bodyLarge: const TextStyle(fontSize: 16, height: 1.6),
          bodyMedium: const TextStyle(fontSize: 15, height: 1.6),
          titleLarge: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
          titleMedium: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        
        // Card theme - Flat with border
        cardTheme: CardTheme(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: Colors.grey[300]!),
          ),
        ),
        
        // Button themes
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            elevation: 0,
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 12,
            ),
          ),
        ),
        
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: primaryColor,
            side: const BorderSide(color: primaryColor),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 12,
            ),
          ),
        ),
        
        // Input decoration
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(6),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(6),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(6),
            borderSide: const BorderSide(color: primaryColor, width: 2),
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
        ),
        
        // App bar theme
        appBarTheme: const AppBarTheme(
          elevation: 0,
          backgroundColor: Colors.white,
          foregroundColor: textPrimary,
          centerTitle: false,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: textPrimary,
          ),
        ),
        
        // Divider theme
        dividerTheme: const DividerThemeData(
          color: dividerColor,
          thickness: 1,
        ),
      );
    }
  }
  ```

### 9.2 Reusable UI Components

- [ ] **Create confirmation dialog:**
  ```dart
  // lib/presentation/widgets/confirmation_dialog.dart
  class ConfirmationDialog extends StatelessWidget {
    final String title;
    final String message;
    final String confirmText;
    final String cancelText;
    final VoidCallback onConfirm;
    final bool isDestructive;
    
    const ConfirmationDialog({
      required this.title,
      required this.message,
      this.confirmText = 'Confirm',
      this.cancelText = 'Cancel',
      required this.onConfirm,
      this.isDestructive = false,
    });
    
    @override
    Widget build(BuildContext context) {
      return AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(cancelText),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              onConfirm();
            },
            style: isDestructive
                ? ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                  )
                : null,
            child: Text(confirmText),
          ),
        ],
      );
    }
    
    static Future<void> show(
      BuildContext context, {
      required String title,
      required String message,
      required VoidCallback onConfirm,
      String confirmText = 'Confirm',
      String cancelText = 'Cancel',
      bool isDestructive = false,
    }) {
      return showDialog(
        context: context,
        builder: (context) => ConfirmationDialog(
          title: title,
          message: message,
          confirmText: confirmText,
          cancelText: cancelText,
          onConfirm: onConfirm,
          isDestructive: isDestructive,
        ),
      );
    }
  }
  ```

- [ ] **Create empty state widget:**
  ```dart
  // lib/presentation/widgets/empty_state.dart
  class EmptyState extends StatelessWidget {
    final IconData icon;
    final String title;
    final String? subtitle;
    final String? actionLabel;
    final VoidCallback? onAction;
    
    const EmptyState({
      required this.icon,
      required this.title,
      this.subtitle,
      this.actionLabel,
      this.onAction,
    });
    
    @override
    Widget build(BuildContext context) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 8),
                Text(
                  subtitle!,
                  style: TextStyle(color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
              ],
              if (actionLabel != null && onAction != null) ...[
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: onAction,
                  child: Text(actionLabel!),
                ),
              ],
            ],
          ),
        ),
      );
    }
  }
  ```

---

## 10. Rental Reputation Graph (Phase 1)

### 10.1 Backend: Signal Collection

- [ ] **Create reputation signals table:**
  ```sql
  CREATE TABLE reputation_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    rental_id UUID NOT NULL REFERENCES rentals(id),
    signal_type VARCHAR(50) NOT NULL,
    signal_value JSONB NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
  );
  CREATE INDEX idx_reputation_user ON reputation_signals(user_id);
  CREATE INDEX idx_reputation_rental ON reputation_signals(rental_id);
  ```

- [ ] **Implement signal capture:**
  ```typescript
  // src/reputation/reputation.service.ts
  @Injectable()
  export class ReputationService {
    constructor(
      @InjectRepository(ReputationSignal)
      private signalsRepo: Repository<ReputationSignal>,
    ) {}
    
    async captureSignal(
      userId: string,
      rentalId: string,
      signalType: string,
      signalValue: any,
    ): Promise<void> {
      const signal = this.signalsRepo.create({
        user: { id: userId },
        rental: { id: rentalId },
        signal_type: signalType,
        signal_value: signalValue,
      });
      
      await this.signalsRepo.save(signal);
    }
    
    async getUserSignals(userId: string): Promise<ReputationSignal[]> {
      return this.signalsRepo.find({
        where: { user: { id: userId } },
        order: { timestamp: 'DESC' },
      });
    }
    
    // Internal analytics only - NOT exposed to users
    async getInternalAnalytics(userId: string): Promise<any> {
      const signals = await this.getUserSignals(userId);
      
      const paymentSignals = signals.filter(s =>
        ['RENT_PAID_ON_TIME', 'RENT_DELAYED'].includes(s.signal_type),
      );
      
      const onTimeCount = paymentSignals.filter(
        s => s.signal_type === 'RENT_PAID_ON_TIME',
      ).length;
      
      const delayedCount = paymentSignals.filter(
        s => s.signal_type === 'RENT_DELAYED',
      ).length;
      
      return {
        total_rentals: signals.length,
        payment_consistency: paymentSignals.length > 0
          ? onTimeCount / paymentSignals.length
          : 0,
        dispute_count: signals.filter(s => s.signal_type === 'DISPUTE_RAISED').length,
        // NO PUBLIC SCORE
      };
    }
  }
  ```

- [ ] **Auto-capture signals on events:**
  ```typescript
  // In events.service.ts
  async createEvent(createDto: CreateEventDto, actorId: string): Promise<RentalEvent> {
    const event = await this.eventsRepo.save(/* ... */);
    
    // Capture reputation signal
    if (createDto.event_type === 'RENT_PAID') {
      await this.reputationService.captureSignal(
        actorId,
        createDto.rental_id,
        'RENT_PAID_ON_TIME',
        { event_id: event.id },
      );
    }
    
    return event;
  }
  ```

---

*This document provides comprehensive implementation for Sections 7-10. Remaining sections (11-15) follow the same detailed format.*

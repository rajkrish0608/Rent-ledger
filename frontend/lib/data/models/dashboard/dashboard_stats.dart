import 'package:freezed_annotation/freezed_annotation.dart';
import '../rental_event_model.dart'; // Import central model

part 'dashboard_stats.freezed.dart';
part 'dashboard_stats.g.dart';

@freezed
class DashboardStats with _$DashboardStats {
  const factory DashboardStats({
    @JsonKey(name: 'active_rentals') required int activeRentals,
    @JsonKey(name: 'closed_rentals') required int closedRentals,
    @JsonKey(name: 'pending_move_outs') required int pendingMoveOuts,
    // Use List<RentalEvent> directly assuming backend returns JSON array of events
    @JsonKey(name: 'recent_activity') required List<RentalEventModel> recentActivity, 
  }) = _DashboardStats;

  factory DashboardStats.fromJson(Map<String, dynamic> json) =>
      _$DashboardStatsFromJson(json);
}

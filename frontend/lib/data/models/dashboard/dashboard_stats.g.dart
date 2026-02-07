// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_stats.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$DashboardStatsImpl _$$DashboardStatsImplFromJson(Map<String, dynamic> json) =>
    _$DashboardStatsImpl(
      activeRentals: (json['active_rentals'] as num).toInt(),
      closedRentals: (json['closed_rentals'] as num).toInt(),
      pendingMoveOuts: (json['pending_move_outs'] as num).toInt(),
      recentActivity: (json['recent_activity'] as List<dynamic>)
          .map((e) => RentalEventModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$DashboardStatsImplToJson(
        _$DashboardStatsImpl instance) =>
    <String, dynamic>{
      'active_rentals': instance.activeRentals,
      'closed_rentals': instance.closedRentals,
      'pending_move_outs': instance.pendingMoveOuts,
      'recent_activity': instance.recentActivity,
    };

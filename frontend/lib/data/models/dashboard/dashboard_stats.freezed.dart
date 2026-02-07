// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'dashboard_stats.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

DashboardStats _$DashboardStatsFromJson(Map<String, dynamic> json) {
  return _DashboardStats.fromJson(json);
}

/// @nodoc
mixin _$DashboardStats {
  @JsonKey(name: 'active_rentals')
  int get activeRentals => throw _privateConstructorUsedError;
  @JsonKey(name: 'closed_rentals')
  int get closedRentals => throw _privateConstructorUsedError;
  @JsonKey(name: 'pending_move_outs')
  int get pendingMoveOuts =>
      throw _privateConstructorUsedError; // Use List<RentalEvent> directly assuming backend returns JSON array of events
  @JsonKey(name: 'recent_activity')
  List<RentalEventModel> get recentActivity =>
      throw _privateConstructorUsedError;

  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;
  @JsonKey(ignore: true)
  $DashboardStatsCopyWith<DashboardStats> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $DashboardStatsCopyWith<$Res> {
  factory $DashboardStatsCopyWith(
          DashboardStats value, $Res Function(DashboardStats) then) =
      _$DashboardStatsCopyWithImpl<$Res, DashboardStats>;
  @useResult
  $Res call(
      {@JsonKey(name: 'active_rentals') int activeRentals,
      @JsonKey(name: 'closed_rentals') int closedRentals,
      @JsonKey(name: 'pending_move_outs') int pendingMoveOuts,
      @JsonKey(name: 'recent_activity') List<RentalEventModel> recentActivity});
}

/// @nodoc
class _$DashboardStatsCopyWithImpl<$Res, $Val extends DashboardStats>
    implements $DashboardStatsCopyWith<$Res> {
  _$DashboardStatsCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? activeRentals = null,
    Object? closedRentals = null,
    Object? pendingMoveOuts = null,
    Object? recentActivity = null,
  }) {
    return _then(_value.copyWith(
      activeRentals: null == activeRentals
          ? _value.activeRentals
          : activeRentals // ignore: cast_nullable_to_non_nullable
              as int,
      closedRentals: null == closedRentals
          ? _value.closedRentals
          : closedRentals // ignore: cast_nullable_to_non_nullable
              as int,
      pendingMoveOuts: null == pendingMoveOuts
          ? _value.pendingMoveOuts
          : pendingMoveOuts // ignore: cast_nullable_to_non_nullable
              as int,
      recentActivity: null == recentActivity
          ? _value.recentActivity
          : recentActivity // ignore: cast_nullable_to_non_nullable
              as List<RentalEventModel>,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$DashboardStatsImplCopyWith<$Res>
    implements $DashboardStatsCopyWith<$Res> {
  factory _$$DashboardStatsImplCopyWith(_$DashboardStatsImpl value,
          $Res Function(_$DashboardStatsImpl) then) =
      __$$DashboardStatsImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {@JsonKey(name: 'active_rentals') int activeRentals,
      @JsonKey(name: 'closed_rentals') int closedRentals,
      @JsonKey(name: 'pending_move_outs') int pendingMoveOuts,
      @JsonKey(name: 'recent_activity') List<RentalEventModel> recentActivity});
}

/// @nodoc
class __$$DashboardStatsImplCopyWithImpl<$Res>
    extends _$DashboardStatsCopyWithImpl<$Res, _$DashboardStatsImpl>
    implements _$$DashboardStatsImplCopyWith<$Res> {
  __$$DashboardStatsImplCopyWithImpl(
      _$DashboardStatsImpl _value, $Res Function(_$DashboardStatsImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? activeRentals = null,
    Object? closedRentals = null,
    Object? pendingMoveOuts = null,
    Object? recentActivity = null,
  }) {
    return _then(_$DashboardStatsImpl(
      activeRentals: null == activeRentals
          ? _value.activeRentals
          : activeRentals // ignore: cast_nullable_to_non_nullable
              as int,
      closedRentals: null == closedRentals
          ? _value.closedRentals
          : closedRentals // ignore: cast_nullable_to_non_nullable
              as int,
      pendingMoveOuts: null == pendingMoveOuts
          ? _value.pendingMoveOuts
          : pendingMoveOuts // ignore: cast_nullable_to_non_nullable
              as int,
      recentActivity: null == recentActivity
          ? _value._recentActivity
          : recentActivity // ignore: cast_nullable_to_non_nullable
              as List<RentalEventModel>,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$DashboardStatsImpl implements _DashboardStats {
  const _$DashboardStatsImpl(
      {@JsonKey(name: 'active_rentals') required this.activeRentals,
      @JsonKey(name: 'closed_rentals') required this.closedRentals,
      @JsonKey(name: 'pending_move_outs') required this.pendingMoveOuts,
      @JsonKey(name: 'recent_activity')
      required final List<RentalEventModel> recentActivity})
      : _recentActivity = recentActivity;

  factory _$DashboardStatsImpl.fromJson(Map<String, dynamic> json) =>
      _$$DashboardStatsImplFromJson(json);

  @override
  @JsonKey(name: 'active_rentals')
  final int activeRentals;
  @override
  @JsonKey(name: 'closed_rentals')
  final int closedRentals;
  @override
  @JsonKey(name: 'pending_move_outs')
  final int pendingMoveOuts;
// Use List<RentalEvent> directly assuming backend returns JSON array of events
  final List<RentalEventModel> _recentActivity;
// Use List<RentalEvent> directly assuming backend returns JSON array of events
  @override
  @JsonKey(name: 'recent_activity')
  List<RentalEventModel> get recentActivity {
    if (_recentActivity is EqualUnmodifiableListView) return _recentActivity;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_recentActivity);
  }

  @override
  String toString() {
    return 'DashboardStats(activeRentals: $activeRentals, closedRentals: $closedRentals, pendingMoveOuts: $pendingMoveOuts, recentActivity: $recentActivity)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$DashboardStatsImpl &&
            (identical(other.activeRentals, activeRentals) ||
                other.activeRentals == activeRentals) &&
            (identical(other.closedRentals, closedRentals) ||
                other.closedRentals == closedRentals) &&
            (identical(other.pendingMoveOuts, pendingMoveOuts) ||
                other.pendingMoveOuts == pendingMoveOuts) &&
            const DeepCollectionEquality()
                .equals(other._recentActivity, _recentActivity));
  }

  @JsonKey(ignore: true)
  @override
  int get hashCode => Object.hash(runtimeType, activeRentals, closedRentals,
      pendingMoveOuts, const DeepCollectionEquality().hash(_recentActivity));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$DashboardStatsImplCopyWith<_$DashboardStatsImpl> get copyWith =>
      __$$DashboardStatsImplCopyWithImpl<_$DashboardStatsImpl>(
          this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$DashboardStatsImplToJson(
      this,
    );
  }
}

abstract class _DashboardStats implements DashboardStats {
  const factory _DashboardStats(
      {@JsonKey(name: 'active_rentals') required final int activeRentals,
      @JsonKey(name: 'closed_rentals') required final int closedRentals,
      @JsonKey(name: 'pending_move_outs') required final int pendingMoveOuts,
      @JsonKey(name: 'recent_activity')
      required final List<RentalEventModel>
          recentActivity}) = _$DashboardStatsImpl;

  factory _DashboardStats.fromJson(Map<String, dynamic> json) =
      _$DashboardStatsImpl.fromJson;

  @override
  @JsonKey(name: 'active_rentals')
  int get activeRentals;
  @override
  @JsonKey(name: 'closed_rentals')
  int get closedRentals;
  @override
  @JsonKey(name: 'pending_move_outs')
  int get pendingMoveOuts;
  @override // Use List<RentalEvent> directly assuming backend returns JSON array of events
  @JsonKey(name: 'recent_activity')
  List<RentalEventModel> get recentActivity;
  @override
  @JsonKey(ignore: true)
  _$$DashboardStatsImplCopyWith<_$DashboardStatsImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

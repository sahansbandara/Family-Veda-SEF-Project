// Names and roles only; never fetch adult clinical profiles for navigation.
import 'package:family_veda/providers/core_providers.dart';
import 'package:family_veda/models/health_record.dart';
import 'package:family_veda/models/lab_report.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RecordsRosterMember {
  const RecordsRosterMember({
    required this.id,
    required this.displayName,
    required this.isSelf,
    required this.isMinor,
  });
  factory RecordsRosterMember.fromJson(Map<String, dynamic> json) =>
      RecordsRosterMember(
        id: json['id'] as String,
        displayName: json['displayName'] as String,
        isSelf: json['isSelf'] == true,
        isMinor: json['isMinor'] == true,
      );
  final String id;
  final String displayName;
  final bool isSelf;
  final bool isMinor;
}

final recordsRosterProvider = FutureProvider.autoDispose
    .family<List<RecordsRosterMember>, String>((ref, familyId) async {
      final response = await ref
          .watch(apiClientProvider)
          .dio
          .get<List<dynamic>>('/families/$familyId/roster');
      return (response.data ?? [])
          .map(
            (row) => RecordsRosterMember.fromJson(row as Map<String, dynamic>),
          )
          .toList(growable: false);
    });
final recordsByMemberProvider = FutureProvider.autoDispose
    .family<List<HealthRecord>, String>(
      (ref, memberId) => ref.watch(mobileApiProvider).getRecords(memberId),
    );
final labReportsByMemberProvider = FutureProvider.autoDispose
    .family<List<LabReport>, String>(
      (ref, memberId) => ref.watch(mobileApiProvider).getLabReports(memberId),
    );

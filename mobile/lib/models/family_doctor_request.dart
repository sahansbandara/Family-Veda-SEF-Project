// Owner: S4 · Familial Risk & Clinical Approval — W.M.S.S.B. Wasala (IT24100559)
// [S4] A family's request to a doctor for a long-term family doctor relationship.
import 'package:family_veda/models/doctor_summary.dart';

class FamilyDoctorRequest {
  const FamilyDoctorRequest({required this.id, required this.doctor});

  factory FamilyDoctorRequest.fromJson(Map<String, dynamic> json) =>
      FamilyDoctorRequest(
        id: json['id'] as String,
        doctor: DoctorSummary.fromJson(json['doctor'] as Map<String, dynamic>),
      );

  final String id;
  final DoctorSummary doctor;
}

import 'package:family_veda/models/family_doctor_slots.dart';
import 'package:family_veda/providers/core_providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final familyDoctorSlotsProvider = FutureProvider.autoDispose
    .family<FamilyDoctorSlots, ({String familyId, String date})>((
      ref,
      request,
    ) async {
      final response = await ref
          .watch(apiClientProvider)
          .dio
          .get<Map<String, dynamic>>(
            '/families/${request.familyId}/doctor/slots',
            queryParameters: {'date': request.date},
          );
      if (response.data == null) {
        throw const FormatException('Empty availability response');
      }
      return FamilyDoctorSlots.fromJson(response.data!);
    });

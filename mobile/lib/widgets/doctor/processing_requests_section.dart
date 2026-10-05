// Owner: S4 · whole-project ownership waiver.
import 'dart:async';
import 'package:family_veda/providers/core_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

/// Deliberately retains no identity, complaint, priority or clinical content.
class ProcessingRequest {
  const ProcessingRequest({
    required this.id,
    required this.reference,
    required this.submittedAt,
    required this.status,
  });
  factory ProcessingRequest.fromJson(Map<String, dynamic> json) =>
      ProcessingRequest(
        id: json['id'] as String,
        reference: ((json['caseNumber'] as num?)?.toInt() ?? 0)
            .toString()
            .padLeft(4, '0'),
        submittedAt: DateTime.parse(json['submittedAt'] as String),
        status: json['status'] as String,
      );
  final String id;
  final String reference;
  final DateTime submittedAt;
  final String status;
  String get stage => switch (status) {
    'Submitted' => 'Request received',
    'Planning' => 'Preparing request',
    'ContextReady' => 'Context prepared',
    'Analysed' => 'Analysis processed',
    'RiskAssessed' => 'Screening processed',
    'Validated' => 'Validation complete',
    _ => 'Processing',
  };
}

final processingRequestsProvider =
    FutureProvider.autoDispose<List<ProcessingRequest>>((ref) async {
      final timer = Timer(const Duration(seconds: 5), ref.invalidateSelf);
      ref.onDispose(timer.cancel);
      final items = <ProcessingRequest>[];
      for (var page = 1; page <= 10; page++) {
        final response = await ref
            .watch(apiClientProvider)
            .dio
            .get<Map<String, dynamic>>(
              '/doctors/processing-cases',
              queryParameters: {'page': page, 'pageSize': 100},
            );
        final data = response.data ?? const {};
        items.addAll(
          (data['items'] as List? ?? []).cast<Map<String, dynamic>>().map(
            ProcessingRequest.fromJson,
          ),
        );
        if (page >= ((data['totalPages'] as num?)?.toInt() ?? 1)) break;
      }
      return items;
    });

class ProcessingRequestsSection extends ConsumerWidget {
  const ProcessingRequestsSection({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) => ref
      .watch(processingRequestsProvider)
      .when(
        loading: () => const ListTile(
          title: Text('Processing requests'),
          subtitle: Text('Checking incoming requests…'),
        ),
        error: (_, _) => ListTile(
          title: const Text('Processing requests unavailable'),
          trailing: IconButton(
            tooltip: 'Retry processing requests',
            onPressed: () => ref.invalidate(processingRequestsProvider),
            icon: const Icon(Icons.refresh),
          ),
        ),
        data: (items) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Processing requests (${items.length})',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Text(
              'Requests from families assigned to you. Clinical details become available after processing.',
            ),
            if (items.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Text('No requests are processing.'),
              ),
            for (final item in items)
              Card(
                child: ListTile(
                  title: Text('Case ${item.reference}'),
                  subtitle: Text(
                    '${DateFormat.yMMMd().add_jm().format(item.submittedAt.toLocal())}\n${item.stage}',
                  ),
                ),
              ),
            const SizedBox(height: 16),
          ],
        ),
      );
}

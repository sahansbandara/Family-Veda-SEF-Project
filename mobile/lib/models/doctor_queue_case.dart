// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// One case in the doctor's Triage Cases work queue, plus the presentation rules shared with the
// web queue (web/src/pages/doctor/triageQueue.ts). Statuses, counts and actions are derived only
// from what the backend returned.

enum QueueTab { available, mine, completed, emergency }

enum QueueSort { oldest, newest, priority }

enum QueueTone { muted, primary, warning, success, danger }

enum QueueActionKind { claim, acknowledge, none }

enum QueueStepState { done, current, upcoming, stopped }

const _active = {'Claimed', 'PendingDoctorReview', 'LowConfidence'};
const _awaitingReview = {'PendingDoctorReview', 'LowConfidence'};
const _completed = {'Approved', 'ApprovedRevised', 'Rejected', 'FailedSafe'};
const _priorityRank = {'Emergency': 2, 'Priority': 1, 'Routine': 0};

class DoctorQueueCase {
  const DoctorQueueCase({
    required this.id,
    required this.priority,
    required this.status,
    required this.createdAt,
    required this.mine,
    required this.claimable,
    this.caseNumber,
    this.memberDisplayName,
    this.familyName,
  });

  /// A case from /doctors/me/cases: the doctor holds an active grant.
  factory DoctorQueueCase.granted(Map<String, dynamic> json) => DoctorQueueCase(
    id: json['id'] as String,
    priority: json['priority'] as String? ?? 'Routine',
    status: json['status'] as String? ?? '',
    createdAt: DateTime.parse(json['createdAt'] as String),
    mine: true,
    claimable: false,
    caseNumber: (json['caseNumber'] as num?)?.toInt(),
    memberDisplayName: json['memberDisplayName'] as String?,
    familyName: json['familyName'] as String?,
  );

  /// A case from /doctors/case-pool: limited metadata, claimable.
  factory DoctorQueueCase.pooled(Map<String, dynamic> json) => DoctorQueueCase(
    id: json['id'] as String,
    priority: json['priority'] as String? ?? 'Routine',
    status: json['status'] as String? ?? 'Available',
    createdAt: DateTime.parse(json['createdAt'] as String),
    mine: false,
    claimable: true,
    caseNumber: (json['caseNumber'] as num?)?.toInt(),
  );

  final String id;
  final String priority;
  final String status;
  final DateTime createdAt;
  final bool mine;
  final bool claimable;

  /// Database case number; null on an older API build.
  final int? caseNumber;

  /// Released by the backend only for cases this doctor holds a grant on.
  final String? memberDisplayName;
  final String? familyName;

  /// The case number as 0001; falls back to the id prefix when the API omits it.
  String get reference {
    final number = caseNumber;
    if (number != null && number > 0) return number.toString().padLeft(4, '0');
    return id.length <= 8 ? id : id.substring(0, 8);
  }

  /// "Patient · Family" for granted cases, null when no identity was released.
  String? get identityLabel {
    final name = memberDisplayName;
    if (name == null || name.isEmpty) return null;
    final family = familyName;
    return family == null || family.isEmpty ? name : '$name · $family';
  }

  bool get isEmergencyReferral => status == 'Escalated';
  bool get isAwaitingReview => mine && _awaitingReview.contains(status);

  QueueTab? get tab {
    if (isEmergencyReferral) return QueueTab.emergency;
    if (claimable) return QueueTab.available;
    if (mine && _completed.contains(status)) return QueueTab.completed;
    if (mine && _active.contains(status)) return QueueTab.mine;
    return null;
  }

  /// Doctor-facing copy. Presentation only; the stored status is unchanged.
  String get statusLabel {
    if (claimable && status != 'Escalated') return 'Available';
    return switch (status) {
      'Claimed' => 'Assigned to me · In review',
      'PendingDoctorReview' => 'Awaiting clinical review',
      'LowConfidence' => 'AI confidence insufficient',
      'Approved' => 'Approved',
      'ApprovedRevised' => 'Approved with revisions',
      'Rejected' => 'Rejected',
      'Escalated' =>
        priority == 'Emergency'
            ? 'Emergency referral'
            : 'Escalated for urgent care',
      'FailedSafe' => 'Processing stopped safely',
      _ => 'AI processing',
    };
  }

  QueueTone get statusTone {
    if (status == 'Escalated') return QueueTone.danger;
    if (claimable) return QueueTone.primary;
    return switch (status) {
      'LowConfidence' || 'FailedSafe' => QueueTone.warning,
      'Approved' || 'ApprovedRevised' => QueueTone.success,
      'Rejected' => QueueTone.muted,
      _ => QueueTone.primary,
    };
  }

  QueueTone get priorityTone => switch (priority) {
    'Emergency' => QueueTone.danger,
    'Priority' => QueueTone.warning,
    _ => QueueTone.muted,
  };

  /// The one queue action the backend state supports. Never a UI-only transition.
  QueueActionKind get action {
    if (!claimable) return QueueActionKind.none;
    return status == 'Escalated'
        ? QueueActionKind.acknowledge
        : QueueActionKind.claim;
  }

  String get actionLabel => switch (action) {
    QueueActionKind.claim => 'Claim Case',
    QueueActionKind.acknowledge => 'Acknowledge Emergency',
    QueueActionKind.none => '',
  };

  /// What happens next for a case with no queue action.
  String get nextStepMessage {
    if (!mine) return 'This case is not available to you.';
    return switch (status) {
      'Claimed' || 'PendingDoctorReview' || 'LowConfidence' =>
        'Assigned to you. The clinical decision is made on the Approval Desk in the doctor web portal.',
      'Escalated' =>
        'You acknowledged this referral. The patient was directed to in-person care.',
      'FailedSafe' =>
        'Processing stopped safely. No AI output was produced for review.',
      'Approved' || 'ApprovedRevised' || 'Rejected' =>
        'The clinical decision is recorded. No further action is needed here.',
      _ => 'Still being processed. It will be ready for review shortly.',
    };
  }

  List<(String, QueueStepState)> get workflowSteps {
    if (status == 'Escalated') {
      return [
        ('Request received', QueueStepState.done),
        (
          priority == 'Emergency'
              ? 'Emergency referral issued'
              : 'Escalated for urgent care',
          QueueStepState.stopped,
        ),
        mine
            ? ('Acknowledged by you', QueueStepState.done)
            : ('Awaiting doctor acknowledgement', QueueStepState.current),
      ];
    }
    if (status == 'FailedSafe') {
      return [
        ('Request received', QueueStepState.done),
        ('Processing stopped safely', QueueStepState.stopped),
      ];
    }
    final decided = _completed.contains(status);
    final lowConfidence = status == 'LowConfidence';
    final inReview = status == 'Claimed';
    final ready =
        claimable || _awaitingReview.contains(status) || inReview || decided;
    return [
      ('Request received', QueueStepState.done),
      (
        lowConfidence ? 'AI confidence insufficient' : 'AI draft prepared',
        !ready
            ? QueueStepState.current
            : lowConfidence
            ? QueueStepState.stopped
            : QueueStepState.done,
      ),
      (
        inReview ? 'In clinical review' : 'Ready for clinical review',
        decided
            ? QueueStepState.done
            : ready
            ? QueueStepState.current
            : QueueStepState.upcoming,
      ),
      (
        decided ? statusLabel : 'Doctor decision',
        decided ? QueueStepState.done : QueueStepState.upcoming,
      ),
    ];
  }
}

/// A granted case wins over its pool entry, so a held case never offers a second claim.
List<DoctorQueueCase> mergeQueue(
  List<DoctorQueueCase> assigned,
  List<DoctorQueueCase> pool,
) {
  final mineIds = {for (final item in assigned) item.id};
  return [...assigned, ...pool.where((item) => !mineIds.contains(item.id))];
}

class QueueCounts {
  QueueCounts(List<DoctorQueueCase> cases)
    : available = cases.where((c) => c.tab == QueueTab.available).length,
      mine = cases.where((c) => c.tab == QueueTab.mine).length,
      awaitingReview = cases
          .where((c) => c.tab == QueueTab.mine && c.isAwaitingReview)
          .length,
      completed = cases.where((c) => c.tab == QueueTab.completed).length,
      emergency = cases.where((c) => c.tab == QueueTab.emergency).length;

  final int available;
  final int mine;
  final int awaitingReview;
  final int completed;
  final int emergency;

  int of(QueueTab tab) => switch (tab) {
    QueueTab.available => available,
    QueueTab.mine => mine,
    QueueTab.completed => completed,
    QueueTab.emergency => emergency,
  };
}

List<DoctorQueueCase> filterAndSortQueue(
  List<DoctorQueueCase> cases, {
  required QueueTab tab,
  String? priority,
  String search = '',
  QueueSort sort = QueueSort.oldest,
}) {
  final term = search.trim().toLowerCase();
  final result = cases
      .where(
        (item) =>
            item.tab == tab &&
            (priority == null || item.priority == priority) &&
            (term.isEmpty ||
                '${item.id} ${item.reference} ${item.identityLabel ?? ''}'
                    .toLowerCase()
                    .contains(term)),
      )
      .toList();
  result.sort((left, right) {
    if (sort == QueueSort.newest) {
      return right.createdAt.compareTo(left.createdAt);
    }
    if (sort == QueueSort.priority) {
      final rank =
          (_priorityRank[right.priority] ?? 0) -
          (_priorityRank[left.priority] ?? 0);
      if (rank != 0) return rank;
    }
    return left.createdAt.compareTo(right.createdAt);
  });
  return result;
}

/// The complaint a patient submitted, as returned by the grant-checked review endpoint.
class SubmittedComplaint {
  const SubmittedComplaint({
    required this.symptoms,
    required this.durationDays,
    required this.severity,
    this.notes,
  });

  factory SubmittedComplaint.fromJson(Map<String, dynamic> json) =>
      SubmittedComplaint(
        symptoms: [
          for (final item in (json['symptoms'] as List? ?? const [])) '$item',
        ],
        durationDays: (json['durationDays'] as num?)?.toInt() ?? 0,
        severity: (json['severity'] as num?)?.toInt() ?? 0,
        notes: json['notes'] as String?,
      );

  final List<String> symptoms;
  final int durationDays;
  final int severity;
  final String? notes;
}

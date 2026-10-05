// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Doctor member workspace: Overview · Records · Labs · Vitals · Visits · Notes. Same endpoint and
// rules as web/src/pages/doctor/DoctorMemberPage.tsx. The backend decides what is visible
// (assignment + visit/case grant + consent + audit); this screen only presents the answer.
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/providers/doctor_families_provider.dart';
import 'package:family_veda/services/api/doctor_families_api.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:family_veda/widgets/doctor/family_workspace_parts.dart';
import 'package:family_veda/widgets/doctor/member_workspace_tabs.dart';
import 'package:family_veda/widgets/records/original_report_preview.dart';
import 'package:family_veda/widgets/shared/async_state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const _tabs = ['Overview', 'Records', 'Labs', 'Vitals', 'Visits', 'Notes'];

class DoctorMemberWorkspaceScreen extends ConsumerStatefulWidget {
  const DoctorMemberWorkspaceScreen({super.key, required this.memberId});

  final String memberId;

  @override
  ConsumerState<DoctorMemberWorkspaceScreen> createState() =>
      _DoctorMemberWorkspaceScreenState();
}

class _DoctorMemberWorkspaceScreenState
    extends ConsumerState<DoctorMemberWorkspaceScreen>
    with SingleTickerProviderStateMixin {
  late final _tabController = TabController(length: _tabs.length, vsync: this);
  final _note = TextEditingController();
  String? _amendingId;
  bool _saving = false;
  bool _previewOpen = false;

  @override
  void didUpdateWidget(covariant DoctorMemberWorkspaceScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.memberId != widget.memberId && _previewOpen) {
      _previewOpen = false;
      Navigator.of(context, rootNavigator: true).maybePop();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _note.dispose();
    super.dispose();
  }

  /// Re-reads from the server. A failed read replaces the workspace with the error view, so an
  /// expired or revoked grant never leaves stale clinical data on screen.
  Future<void> _refresh() async {
    ref.invalidate(doctorMemberWorkspaceProvider(widget.memberId));
    try {
      await ref.read(doctorMemberWorkspaceProvider(widget.memberId).future);
    } catch (_) {
      // The error view is rendered by the provider state.
    }
  }

  Future<void> _saveNote() async {
    final content = _note.text.trim();
    if (content.isEmpty || _saving) return;
    setState(() => _saving = true);
    final amending = _amendingId;
    final api = ref.read(doctorFamiliesApiProvider);
    String message;
    try {
      if (amending != null) {
        await api.amendNote(amending, content);
      } else {
        await api.addNote(widget.memberId, content);
      }
      _note.clear();
      _amendingId = null;
      message = amending != null
          ? 'Amendment saved. The original note is kept.'
          : 'Note saved.';
    } catch (error) {
      message = noteErrorMessage(error);
    }
    await _refresh();
    if (!mounted) return;
    setState(() => _saving = false);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _viewOriginal(String reportId, String fileName) async {
    if (_previewOpen) return;
    _previewOpen = true;
    final memberId = widget.memberId;
    try {
      await showOriginalReportPreview(
        context,
        fileName: fileName,
        load: () => ref
            .read(doctorFamiliesApiProvider)
            .getMemberLabReportFile(memberId, reportId),
      );
    } finally {
      _previewOpen = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(doctorMemberWorkspaceProvider(widget.memberId));
    final workspace = state.valueOrNull;
    final showTabs = workspace != null && !state.hasError;

    return Scaffold(
      appBar: AppBar(
        title: Text(showTabs ? workspace.displayName : 'Member'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _refresh,
          ),
        ],
        bottom: showTabs
            ? TabBar(
                controller: _tabController,
                isScrollable: true,
                tabAlignment: TabAlignment.start,
                tabs: [for (final tab in _tabs) Tab(text: tab)],
              )
            : null,
      ),
      body: SafeArea(
        child: state.when(
          skipLoadingOnRefresh: true,
          loading: () => const LoadingStateView(label: 'Loading member'),
          error: (_, _) => ErrorRetryView(
            message:
                'This member could not be loaded. You may no longer be the family doctor.',
            onRetry: () =>
                ref.invalidate(doctorMemberWorkspaceProvider(widget.memberId)),
          ),
          data: (w) => TabBarView(
            controller: _tabController,
            children: [
              _frame(
                w,
                OverviewTab(workspace: w, onOpen: _tabController.animateTo),
              ),
              _frame(w, RecordsTab(records: w.records)),
              _frame(
                w,
                LabsTab(
                  reports: w.labReports,
                  onViewOriginal: _viewOriginal,
                ),
              ),
              _frame(w, VitalsTab(vitals: w.vitals)),
              _frame(w, VisitsTab(workspace: w)),
              _frame(
                w,
                NotesTab(
                  workspace: w,
                  controller: _note,
                  amending: _amendingId != null,
                  saving: _saving,
                  onSave: _saveNote,
                  onAmend: (note) => setState(() => _amendingId = note.rootId),
                  onCancelAmend: () => setState(() => _amendingId = null),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Every tab carries the member line and the access banner, and scrolls as one list so the
  /// keyboard never hides the note field or its Save button.
  Widget _frame(MemberWorkspace w, Widget child) {
    final palette = CalendarPalette.of(context);
    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        children: [
          Text(
            '${w.familyName} · ${roleLabel(w.role)} · Doctor-only workspace',
            style: TextStyle(color: palette.muted, fontSize: 13),
          ),
          const SizedBox(height: 10),
          AccessBanner(workspace: w),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }
}

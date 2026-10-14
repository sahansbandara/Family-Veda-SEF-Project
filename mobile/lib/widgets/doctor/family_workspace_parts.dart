// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Presentational pieces shared by the doctor My Families screens. Clinical content sits on
// opaque surfaces (no blur behind values).
import 'package:family_veda/models/doctor_family_workspace.dart';
import 'package:family_veda/widgets/doctor/calendar_parts.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;

String formatDay(DateTime value) =>
    DateFormat('dd MMM yyyy').format(value.toLocal());

String formatMoment(DateTime value) =>
    DateFormat('dd MMM yyyy · h:mm a').format(value.toLocal());

/// Opaque bordered card used for every list item in the flow.
class WorkspaceCard extends StatelessWidget {
  const WorkspaceCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    // Material (not a coloured Container) so list tiles and expansion tiles inside keep their ink.
    return Material(
      color: palette.surface,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: palette.border),
      ),
      child: Container(
        width: double.infinity,
        padding: padding ?? const EdgeInsets.all(14),
        child: child,
      ),
    );
  }
}

class InitialsAvatar extends StatelessWidget {
  const InitialsAvatar({super.key, required this.name, this.size = 40});

  final String name;
  final double size;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: palette.primary.withValues(alpha: 0.14),
          border: Border.all(color: palette.primary.withValues(alpha: 0.45)),
        ),
        child: Text(
          initialsOf(name),
          style: TextStyle(
            color: palette.primary,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.32,
          ),
        ),
      ),
    );
  }
}

/// Small status pill: colour plus text, never colour alone.
class AccessPill extends StatelessWidget {
  const AccessPill({super.key, required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.14),
      borderRadius: BorderRadius.circular(999),
      border: Border.all(color: color.withValues(alpha: 0.36)),
    ),
    child: Text(
      label,
      style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700),
    ),
  );
}

/// Privacy / explanation strip.
class InfoStrip extends StatelessWidget {
  const InfoStrip({
    super.key,
    required this.text,
    this.icon = Icons.verified_user_outlined,
  });

  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: palette.surfaceSubtle,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: palette.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: palette.primary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: TextStyle(color: palette.muted, fontSize: 13, height: 1.4),
            ),
          ),
        ],
      ),
    );
  }
}

/// Why the doctor can (or cannot) read this member now, and until when.
class AccessBanner extends StatelessWidget {
  const AccessBanner({super.key, required this.workspace});

  final MemberWorkspace workspace;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final allowed = workspace.clinicalAccess;
    final color = allowed ? palette.success : palette.muted;
    final expires = workspace.accessExpiresAt;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: allowed
            ? Color.alphaBlend(
                palette.success.withValues(alpha: 0.10),
                palette.surface,
              )
            : palette.surfaceSubtle,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            allowed ? Icons.verified_user_outlined : Icons.lock_outline_rounded,
            size: 20,
            color: color,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  allowed
                      ? 'Clinical access permitted'
                      : 'Clinical categories restricted',
                  style: TextStyle(
                    color: palette.heading,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [
                    RegExp(r'[.!?]$').hasMatch(workspace.accessBasis.trim())
                        ? workspace.accessBasis.trim()
                        : '${workspace.accessBasis.trim()}.',
                    if (allowed && expires != null)
                      'Access for ${workspace.displayName} expires ${formatMoment(expires)}.',
                    allowed
                        ? 'Consent is checked separately for each category.'
                        : 'Restricted categories are not counted or previewed.',
                  ].join(' '),
                  style: TextStyle(
                    color: palette.text,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CenteredState extends StatelessWidget {
  const _CenteredState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return WorkspaceCard(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
      child: Column(
        children: [
          Icon(icon, size: 30, color: palette.muted),
          const SizedBox(height: 8),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: palette.heading,
              fontWeight: FontWeight.w700,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: palette.muted, fontSize: 13, height: 1.4),
          ),
        ],
      ),
    );
  }
}

/// Not authorised. Never worded as "none" and never carries a count.
class RestrictedState extends StatelessWidget {
  const RestrictedState({super.key, required this.what});

  final String what;

  @override
  Widget build(BuildContext context) => _CenteredState(
    icon: Icons.lock_outline_rounded,
    title: '$what restricted',
    message:
        'Not available: there is no active visit or shared case for this member, or the member has not consented to this category. This does not mean there are no ${what.toLowerCase()}.',
  );
}

/// A real empty result: the doctor is authorised and there is nothing to show.
class EmptyCategory extends StatelessWidget {
  const EmptyCategory({super.key, required this.title, required this.message});

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) => _CenteredState(
    icon: Icons.inbox_outlined,
    title: title,
    message: message,
  );
}

class SectionHeading extends StatelessWidget {
  const SectionHeading({super.key, required this.title, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          header: true,
          child: Text(
            title,
            style: TextStyle(
              color: palette.heading,
              fontSize: 17,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        if (subtitle != null)
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              subtitle!,
              style: TextStyle(color: palette.muted, fontSize: 13),
            ),
          ),
      ],
    );
  }
}

/// Line chart for one series (same type, same unit). The readings are also listed as text
/// below the chart, so the chart itself is one labelled image for screen readers.
class VitalTrendChart extends StatelessWidget {
  const VitalTrendChart({super.key, required this.series});

  final VitalSeries series;

  @override
  Widget build(BuildContext context) {
    final palette = CalendarPalette.of(context);
    final points = series.readings.reversed.toList();
    return Semantics(
      image: true,
      label:
          '${series.label}: ${points.length} readings from ${formatDay(points.first.measuredAt)} to ${formatDay(points.last.measuredAt)}. Latest ${series.latest.valueLabel}.',
      child: ExcludeSemantics(
        child: SizedBox(
          height: 170,
          width: double.infinity,
          child: CustomPaint(
            painter: _TrendPainter(
              points: points,
              line: palette.primary,
              grid: palette.border,
              label: palette.muted,
              dot: palette.surface,
              textScaler: MediaQuery.textScalerOf(context),
            ),
          ),
        ),
      ),
    );
  }
}

class _TrendPainter extends CustomPainter {
  _TrendPainter({
    required this.points,
    required this.line,
    required this.grid,
    required this.label,
    required this.dot,
    required this.textScaler,
  });

  final List<VitalReading> points;
  final Color line;
  final Color grid;
  final Color label;
  final Color dot;
  final TextScaler textScaler;

  TextPainter _text(String value) => TextPainter(
    text: TextSpan(
      text: value,
      style: TextStyle(color: label, fontSize: 10),
    ),
    textDirection: TextDirection.ltr,
    textScaler: textScaler.clamp(maxScaleFactor: 1.3),
  )..layout();

  @override
  void paint(Canvas canvas, Size size) {
    final values = points.map((p) => p.value.toDouble()).toList();
    final low = values.reduce((a, b) => a < b ? a : b);
    final high = values.reduce((a, b) => a > b ? a : b);
    final pad = high == low
        ? (high.abs() * 0.05).clamp(1.0, double.infinity)
        : (high - low) * 0.15;
    final min = low - pad, max = high + pad;
    const left = 40.0, right = 10.0, top = 8.0, bottom = 22.0;
    final width = size.width - left - right;
    final height = size.height - top - bottom;
    double x(int i) => left + width * i / (points.length - 1);
    double y(double v) => top + height * (1 - (v - min) / (max - min));

    final gridPaint = Paint()
      ..color = grid
      ..strokeWidth = 1;
    for (var step = 0; step <= 3; step++) {
      final value = max - step * (max - min) / 3;
      canvas.drawLine(
        Offset(left, y(value)),
        Offset(size.width - right, y(value)),
        gridPaint,
      );
      final text = _text(value.toStringAsFixed(max - min < 10 ? 1 : 0));
      text.paint(canvas, Offset(0, y(value) - text.height / 2));
    }

    final path = Path()..moveTo(x(0), y(values[0]));
    for (var i = 1; i < values.length; i++) {
      path.lineTo(x(i), y(values[i]));
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = line
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
    for (var i = 0; i < values.length; i++) {
      canvas.drawCircle(Offset(x(i), y(values[i])), 5, Paint()..color = dot);
      canvas.drawCircle(Offset(x(i), y(values[i])), 3.5, Paint()..color = line);
    }

    // First and last date only: always readable, never crowded on a narrow phone.
    final first = _text(
      DateFormat('dd MMM').format(points.first.measuredAt.toLocal()),
    );
    final last = _text(
      DateFormat('dd MMM').format(points.last.measuredAt.toLocal()),
    );
    first.paint(canvas, Offset(left, size.height - first.height));
    last.paint(
      canvas,
      Offset(size.width - right - last.width, size.height - last.height),
    );
  }

  @override
  bool shouldRepaint(_TrendPainter old) =>
      old.points != points || old.line != line || old.textScaler != textScaler;
}

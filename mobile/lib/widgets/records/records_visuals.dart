// Owner: S2 · Health Records & Extraction — Fernando K.R.N (IT24101875)
// [S2] Shared visual pieces of the Health records screen: metric tiles, tinted icons, badges
// and the trend line. Purely presentational.
import 'package:family_veda/models/vital.dart';
import 'package:flutter/material.dart';

/// Accent colours shared with the web page so both surfaces read the same.
class RecordTones {
  static const rose = Color(0xFFE5484D);
  static const violet = Color(0xFF8B5CF6);
  static const teal = Color(0xFF0D9488);
  static const amber = Color(0xFFD97706);
  static const pink = Color(0xFFDB2777);
  static const green = Color(0xFF167946);
  static const sky = Color(0xFF21A8F6);

  static Color forVital(BuildContext context, VitalKind kind) => switch (kind) {
    VitalKind.heart => rose,
    VitalKind.pressure => Theme.of(context).colorScheme.primary,
    VitalKind.temperature => violet,
    VitalKind.oxygen => teal,
    VitalKind.weight => amber,
    VitalKind.glucose => pink,
    VitalKind.other => sky,
  };

  static Color forRecordType(BuildContext context, String type) =>
      switch (type) {
        'Condition' => violet,
        'Allergy' => amber,
        'Medication' => teal,
        'Surgery' => rose,
        _ => Theme.of(context).colorScheme.primary,
      };
}

IconData vitalIcon(VitalKind kind) => switch (kind) {
  VitalKind.heart => Icons.favorite_outline,
  VitalKind.pressure => Icons.monitor_heart_outlined,
  VitalKind.temperature => Icons.thermostat_outlined,
  VitalKind.oxygen => Icons.air,
  VitalKind.weight => Icons.monitor_weight_outlined,
  VitalKind.glucose => Icons.water_drop_outlined,
  VitalKind.other => Icons.show_chart,
};

IconData recordTypeIcon(String type) => switch (type) {
  'Condition' => Icons.medical_information_outlined,
  'Allergy' => Icons.wb_sunny_outlined,
  'Medication' => Icons.medication_outlined,
  'Surgery' => Icons.healing_outlined,
  _ => Icons.description_outlined,
};

class TonedIcon extends StatelessWidget {
  const TonedIcon({
    super.key,
    required this.icon,
    required this.color,
    this.size = 40,
  });

  final IconData icon;
  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.14),
      borderRadius: BorderRadius.circular(size * 0.28),
    ),
    child: Icon(icon, color: color, size: size * 0.5),
  );
}

class RecordBadge extends StatelessWidget {
  const RecordBadge({
    super.key,
    required this.label,
    required this.color,
    this.icon,
  });

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: color.withValues(alpha: 0.34)),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 13, color: color),
          const SizedBox(width: 4),
        ],
        Flexible(
          child: Text(
            label,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    ),
  );
}

class RecordsMetric {
  const RecordsMetric({
    required this.label,
    required this.value,
    required this.caption,
    required this.icon,
    required this.color,
  });

  final String label;
  final String value;
  final String caption;
  final IconData icon;
  final Color color;
}

/// One swipeable row of summary tiles; a row keeps the lists below tall enough on a phone.
class RecordsMetricsRow extends StatelessWidget {
  const RecordsMetricsRow({super.key, required this.metrics});

  final List<RecordsMetric> metrics;

  @override
  Widget build(BuildContext context) => SizedBox(
    height: 96,
    child: ListView.separated(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: metrics.length,
      separatorBuilder: (_, _) => const SizedBox(width: 10),
      itemBuilder: (context, index) => _MetricTile(metric: metrics[index]),
    ),
  );
}

class _MetricTile extends StatelessWidget {
  const _MetricTile({required this.metric});

  final RecordsMetric metric;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Semantics(
      label: '${metric.label}: ${metric.value}. ${metric.caption}',
      child: ExcludeSemantics(
        child: Container(
          width: 176,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: theme.colorScheme.outlineVariant),
          ),
          child: Row(
            children: [
              Container(width: 4, color: metric.color),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      metric.label.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        letterSpacing: 0.8,
                        fontWeight: FontWeight.w700,
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Text(
                      metric.value,
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      metric.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              TonedIcon(icon: metric.icon, color: metric.color, size: 36),
              const SizedBox(width: 10),
            ],
          ),
        ),
      ),
    );
  }
}

/// Trend line of recorded values. Decorative: the numbers are always shown as text nearby.
class VitalSparkline extends StatelessWidget {
  const VitalSparkline({
    super.key,
    required this.values,
    required this.color,
    this.width = 84,
    this.height = 32,
    this.filled = true,
  });

  final List<double> values;
  final Color color;
  final double width;
  final double height;
  final bool filled;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox(
      width: width,
      height: height,
      child: values.length < 2
          ? null
          : CustomPaint(painter: _SparklinePainter(values, color, filled)),
    ),
  );
}

class _SparklinePainter extends CustomPainter {
  _SparklinePainter(this.values, this.color, this.filled);

  final List<double> values;
  final Color color;
  final bool filled;

  @override
  void paint(Canvas canvas, Size size) {
    const pad = 3.0;
    final low = values.reduce((a, b) => a < b ? a : b);
    final high = values.reduce((a, b) => a > b ? a : b);
    final span = high - low == 0 ? 1.0 : high - low;
    final line = Path();
    for (var index = 0; index < values.length; index++) {
      final x = pad + index * (size.width - pad * 2) / (values.length - 1);
      final y =
          size.height -
          pad -
          (values[index] - low) / span * (size.height - pad * 2);
      index == 0 ? line.moveTo(x, y) : line.lineTo(x, y);
    }
    if (filled) {
      final area = Path.from(line)
        ..lineTo(size.width - pad, size.height)
        ..lineTo(pad, size.height)
        ..close();
      canvas.drawPath(area, Paint()..color = color.withValues(alpha: 0.12));
    }
    canvas.drawPath(
      line,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.8
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(_SparklinePainter oldDelegate) =>
      oldDelegate.values != values ||
      oldDelegate.color != color ||
      oldDelegate.filled != filled;
}

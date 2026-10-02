// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// App shell providing persistent Bottom Navigation Bar for Flutter mobile,
// mapping directly to the web portal's 5 core destinations.
import 'package:family_veda/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.child,
    required this.currentLocation,
  });

  final Widget child;
  final String currentLocation;

  static const _tabs = <(String, IconData, IconData, String)>[
    ('/home', Icons.home_outlined, Icons.home_rounded, 'Dashboard'),
    ('/members', Icons.people_outline_rounded, Icons.people_rounded, 'My Family'),
    ('/records', Icons.folder_outlined, Icons.folder_rounded, 'Records'),
    ('/cases', Icons.monitor_heart_outlined, Icons.monitor_heart_rounded, 'Triage'),
    ('/appointments', Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Appointments'),
  ];

  int _calculateSelectedIndex(String location) {
    if (location.startsWith('/members') || location.startsWith('/join')) {
      return 1;
    }
    if (location.startsWith('/records')) {
      return 2;
    }
    if (location.startsWith('/cases')) {
      return 3;
    }
    if (location.startsWith('/appointments')) {
      return 4;
    }
    return 0; // default to /home (Dashboard)
  }

  void _onDestinationSelected(BuildContext context, int index) {
    final targetRoute = _tabs[index].$1;
    if (currentLocation != targetRoute) {
      context.go(targetRoute);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final selectedIndex = _calculateSelectedIndex(currentLocation);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.surfaceDark : AppColors.surface,
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.borderDark : AppColors.border,
              width: 1,
            ),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
              blurRadius: 12,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              height: 64,
              backgroundColor: Colors.transparent,
              indicatorColor: (isDark ? AppColors.primaryDark : AppColors.primary)
                  .withValues(alpha: 0.16),
              labelTextStyle: WidgetStateProperty.resolveWith((states) {
                final isSelected = states.contains(WidgetState.selected);
                return TextStyle(
                  fontSize: 11.5,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                  color: isSelected
                      ? (isDark ? AppColors.primaryLumDark : AppColors.primary)
                      : (isDark ? AppColors.mutedDark : AppColors.muted),
                );
              }),
              iconTheme: WidgetStateProperty.resolveWith((states) {
                final isSelected = states.contains(WidgetState.selected);
                return IconThemeData(
                  size: 23,
                  color: isSelected
                      ? (isDark ? AppColors.primaryLumDark : AppColors.primary)
                      : (isDark ? AppColors.mutedDark : AppColors.muted),
                );
              }),
            ),
            child: NavigationBar(
              selectedIndex: selectedIndex,
              onDestinationSelected: (index) => _onDestinationSelected(context, index),
              elevation: 0,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              destinations: _tabs.map((tab) {
                final (_, unselectedIcon, selectedIcon, label) = tab;
                return NavigationDestination(
                  icon: Icon(unselectedIcon),
                  selectedIcon: Icon(selectedIcon),
                  label: label,
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}

// Owner: S4 · whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// App shell providing web-aligned horizontal Subnav Tabs & persistent navigation
// mapping directly to the Web Portal's 7 destinations (Dashboard, My Family,
// Health Records, Symptoms & Triage, My Doctor, Appointments, Privacy & Access).
import 'package:family_veda/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.child,
    required this.currentLocation,
    this.isDoctor = false,
  });

  final Widget child;
  final String currentLocation;

  /// Doctors get the clinician menu; the family menu would send them to family-only screens.
  final bool isDoctor;

  // The doctor destinations matching the web doctor portal (Approvals is web-only).
  static const _doctorTabs = <(String, IconData, IconData, String)>[
    ('/home', Icons.home_outlined, Icons.home_rounded, 'Dashboard'),
    ('/calendar', Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Calendar'),
    ('/families', Icons.people_outline_rounded, Icons.people_rounded, 'My Families'),
    ('/triage-cases', Icons.monitor_heart_outlined, Icons.monitor_heart_rounded, 'Triage Cases'),
    ('/doctor-profile', Icons.badge_outlined, Icons.badge_rounded, 'Profile'),
  ];

  // The 7 web portal subnav destinations matching web/src/components/layout/AppLayout.tsx
  static const _webTabs = <(String, IconData, IconData, String)>[
    ('/home', Icons.dashboard_outlined, Icons.dashboard_rounded, 'Dashboard'),
    ('/members', Icons.people_outline_rounded, Icons.people_rounded, 'My Family'),
    ('/records', Icons.description_outlined, Icons.description_rounded, 'Health Records'),
    ('/cases', Icons.show_chart_rounded, Icons.show_chart_rounded, 'Symptoms & Triage'),
    ('/my-doctor', Icons.person_outline_rounded, Icons.person_rounded, 'My Doctor'),
    ('/appointments', Icons.calendar_today_outlined, Icons.calendar_month_rounded, 'Appointments'),
    ('/privacy', Icons.lock_outline_rounded, Icons.lock_rounded, 'Privacy & Access'),
  ];

  // Core 5 bottom navigation bar tabs for quick one-handed access
  static const _bottomTabs = <(String, IconData, IconData, String)>[
    ('/home', Icons.home_outlined, Icons.home_rounded, 'Dashboard'),
    ('/members', Icons.people_outline_rounded, Icons.people_rounded, 'My Family'),
    ('/records', Icons.folder_outlined, Icons.folder_rounded, 'Records'),
    ('/cases', Icons.monitor_heart_outlined, Icons.monitor_heart_rounded, 'Triage'),
    ('/appointments', Icons.calendar_month_outlined, Icons.calendar_month_rounded, 'Appointments'),
  ];

  int _calculateBottomSelectedIndex(String location) {
    if (isDoctor) {
      final index = _doctorTabs.indexWhere(
        (tab) => tab.$1 != '/home' && location.startsWith(tab.$1),
      );
      return index < 0 ? 0 : index;
    }
    if (location.startsWith('/members') || location.startsWith('/join')) {
      return 1;
    }
    if (location.startsWith('/records') || location.startsWith('/lab-upload') || location.startsWith('/vitals')) {
      return 2;
    }
    if (location.startsWith('/cases') || location.startsWith('/complaints') || location.startsWith('/guidance')) {
      return 3;
    }
    if (location.startsWith('/appointments')) {
      return 4;
    }
    return 0; // default to /home (Dashboard)
  }

  void _onDestinationSelected(BuildContext context, String targetRoute) {
    if (currentLocation == targetRoute) return;
    // The doctor profile lives outside the shell, so it is pushed to keep a way back.
    if (targetRoute == '/doctor-profile') {
      context.push(targetRoute);
    } else {
      context.go(targetRoute);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bottomIndex = _calculateBottomSelectedIndex(currentLocation);
    final bottomTabs = isDoctor ? _doctorTabs : _bottomTabs;

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Top Web-Aligned Subnav Horizontal Tabs
            _WebSubnavBar(
              currentLocation: currentLocation,
              tabs: isDoctor ? _doctorTabs : _webTabs,
              onTabSelected: (route) => _onDestinationSelected(context, route),
            ),
            Expanded(child: child),
          ],
        ),
      ),
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
                  fontSize: 10,
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
              selectedIndex: bottomIndex,
              onDestinationSelected: (index) =>
                  _onDestinationSelected(context, bottomTabs[index].$1),
              elevation: 0,
              labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
              labelPadding: EdgeInsets.zero,
              destinations: bottomTabs.map((tab) {
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

class _WebSubnavBar extends StatelessWidget {
  const _WebSubnavBar({
    required this.currentLocation,
    required this.tabs,
    required this.onTabSelected,
  });

  final String currentLocation;
  final List<(String, IconData, IconData, String)> tabs;
  final ValueChanged<String> onTabSelected;

  int _getActiveIndex() {
    for (int i = 0; i < tabs.length; i++) {
      final path = tabs[i].$1;
      if (currentLocation == path ||
          (path != '/home' && currentLocation.startsWith(path))) {
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeIndex = _getActiveIndex();

    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surface,
        border: Border(
          bottom: BorderSide(
            color: isDark ? AppColors.borderDark : AppColors.border,
            width: 1,
          ),
        ),
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Row(
          children: [
            for (int index = 0; index < tabs.length; index++) ...[
              Builder(
                builder: (context) {
                  final (path, icon, activeIcon, label) = tabs[index];
                  final isActive = index == activeIndex;
                  final primaryColor = isDark ? AppColors.primaryLumDark : AppColors.primary;
                  final mutedColor = isDark ? AppColors.mutedDark : AppColors.muted;

                  return Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => onTabSelected(path),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(
                              color: isActive ? primaryColor : Colors.transparent,
                              width: 2.5,
                            ),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isActive ? activeIcon : icon,
                              size: 16,
                              color: isActive ? primaryColor : mutedColor,
                            ),
                            const SizedBox(width: 7),
                            Text(
                              label,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                                color: isActive ? primaryColor : mutedColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

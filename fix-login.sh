#!/bin/bash
# Remove demo credentials array
sed -i '' '/class DemoCredential {/,/];/d' mobile/lib/screens/auth/login_screen.dart

# Remove demo credentials references in the state
sed -i '' '/String _activeRole/d' mobile/lib/screens/auth/login_screen.dart
sed -i '' '/bool _showDemoDetails/d' mobile/lib/screens/auth/login_screen.dart

# Remove the whole Demo credentials UI section
# We'll use perl for multiline replacement
perl -0777 -pi -e 's/\/\/ Section: DEMO CREDENTIALS.*?\/\/ End Section: DEMO CREDENTIALS//gs' mobile/lib/screens/auth/login_screen.dart

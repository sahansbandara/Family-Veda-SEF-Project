import 'package:family_veda/screens/auth/register_screen.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('registration response carries the SLMC claim-under-review flag', () {
    final disputed = AuthTokens.fromRegistration({
      'userId': 'u',
      'accessToken': 'a',
      'refreshToken': 'r',
      'doctorClaimUnderReview': true,
    });
    final normal = AuthTokens.fromRegistration({
      'userId': 'u',
      'accessToken': 'a',
      'refreshToken': 'r',
    });

    expect(disputed.claimUnderReview, isTrue);
    expect(normal.claimUnderReview, isFalse);
  });

  testWidgets('claim dialog explains review instead of an error', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(home: Scaffold(body: ClaimUnderReviewDialog())),
    );

    expect(find.text('Claim under review'), findsOneWidget);
    expect(find.textContaining(claimUnderReviewMessage), findsOneWidget);
    expect(find.textContaining('error'), findsNothing);
  });
}

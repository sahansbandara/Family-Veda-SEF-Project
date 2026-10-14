import 'package:dio/dio.dart';
import 'package:family_veda/services/api/auth_api.dart';
import 'package:flutter_test/flutter_test.dart';

DioException _error(String path, int status) {
  final options = RequestOptions(path: path);
  return DioException(
    requestOptions: options,
    response: Response(requestOptions: options, statusCode: status),
  );
}

void main() {
  test('failed sign-in (403 from /auth/login) reads as bad credentials', () {
    expect(
      userFacingApiError(_error('/auth/login', 403)),
      'Email or password is incorrect.',
    );
  });

  test('403 elsewhere still means no access', () {
    expect(
      userFacingApiError(_error('/doctors/case-pool', 403)),
      'Your account cannot access this feature.',
    );
  });
}

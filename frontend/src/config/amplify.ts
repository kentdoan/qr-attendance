// ============================================================================
// AWS Amplify v6 configuration
// Đọc toàn bộ giá trị từ biến môi trường Vite (import.meta.env.VITE_*)
// ============================================================================
import { Amplify } from 'aws-amplify';

const region = import.meta.env.VITE_AWS_REGION;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

/**
 * Cấu hình Amplify Auth (Cognito User Pool).
 * Gọi 1 lần ở entrypoint (main.tsx) trước khi render App.
 *
 * Ở chế độ mock (VITE_USE_MOCK_API=true) vẫn gọi được an toàn:
 * nếu thiếu biến Cognito thì bỏ qua để không crash khi dev bằng mock.
 */
export function configureAmplify(): void {
  if (!userPoolId || !userPoolClientId) {
    if (import.meta.env.VITE_USE_MOCK_API === 'true') {
      // Mock mode — không cần Cognito thật.
      console.info('[amplify] Bỏ qua cấu hình Cognito (đang chạy mock API).');
      return;
    }
    console.warn(
      '[amplify] Thiếu VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_USER_POOL_CLIENT_ID.'
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId ?? '',
        userPoolClientId: userPoolClientId ?? '',
        // region được suy ra từ userPoolId, khai báo thêm cho rõ ràng.
        ...(region ? { region } : {}),
        loginWith: {
          email: true,
        },
      },
    },
  });
}

export const amplifyEnv = {
  region,
  userPoolId,
  userPoolClientId,
} as const;

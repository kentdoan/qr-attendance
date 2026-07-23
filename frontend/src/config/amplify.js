import { Amplify } from "aws-amplify";

const userPoolId = import.meta.env.VITE_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_USER_POOL_CLIENT_ID;
const region = userPoolId ? userPoolId.split('_')[0] : import.meta.env.VITE_AWS_REGION;


export function configureAmplify() {
  if (!userPoolId || !userPoolClientId) {
    if (import.meta.env.VITE_USE_MOCK_API === "true") {
      console.info("[amplify] Bỏ qua cấu hình Cognito (đang chạy mock API).");
      return;
    }
    console.warn(
      "[amplify] Thiếu VITE_USER_POOL_ID / VITE_USER_POOL_CLIENT_ID.",
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId ?? "",
        userPoolClientId: userPoolClientId ?? "",
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
};

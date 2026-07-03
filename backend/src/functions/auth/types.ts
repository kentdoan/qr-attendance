// AWS Cognito Post Confirmation Event shape
export interface PostConfirmationEvent {
  version: string;
  region: string;
  userPoolId: string;
  userName: string;
  callerContext: {
    awsSdkVersion: string;
    clientId: string;
  };
  request: {
    userAttributes: {
      [key: string]: string;
    };
  };
  response: {};
}

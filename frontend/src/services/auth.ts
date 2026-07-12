const CLIENT_ID = import.meta.env.VITE_USER_POOL_CLIENT_ID || '3hcrf40a2fsg4ahi19pobrusia';
const COGNITO_URL = 'https://cognito-idp.ap-southeast-1.amazonaws.com/';

export const authService = {
  login: async (email: string, password: string) => {
    const res = await fetch(COGNITO_URL, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        AuthParameters: { USERNAME: email, PASSWORD: password },
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data.AuthenticationResult.IdToken;
  },

  register: async (email: string, password: string) => {
    const res = await fetch(COGNITO_URL, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: 'email', Value: email }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  confirm: async (email: string, code: string) => {
    const res = await fetch(COGNITO_URL, {
      method: 'POST',
      headers: {
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
        'Content-Type': 'application/x-amz-json-1.1',
      },
      body: JSON.stringify({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Confirmation failed');
    return data;
  }
};

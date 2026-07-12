import { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

interface MockEventOptions {
  method?: string;
  path?: string;
  body?: string;
  pathParameters?: Record<string, string>;
  teacherId?: string;
  groups?: string[];
}

export const createMockEvent = (options: MockEventOptions = {}): APIGatewayProxyEventV2WithJWTAuthorizer => {
  return {
    version: '2.0',
    routeKey: '$default',
    rawPath: options.path || '/sessions',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'api-id',
      domainName: 'id.execute-api.us-east-1.amazonaws.com',
      domainPrefix: 'id',
      http: {
        method: options.method || 'GET',
        path: options.path || '/sessions',
        protocol: 'HTTP/1.1',
        sourceIp: '192.168.0.1',
        userAgent: 'agent',
      },
      requestId: 'id',
      routeKey: '$default',
      stage: '$default',
      time: '12/Mar/2020:19:03:58 +0000',
      timeEpoch: 1583348638390,
      authorizer: {
        principalId: 'test-principal-id',
        integrationLatency: 0,
        jwt: {
          claims: {
            sub: options.teacherId || 'test-teacher-id',
            'cognito:groups': options.groups || ['TEACHER'],
          },
          scopes: [],
        },
      },
    },
    body: options.body,
    pathParameters: options.pathParameters,
    isBase64Encoded: false,
  };
};

const { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand, InitiateAuthCommand, AdminAddUserToGroupCommand, DeleteUserCommand } = require("@aws-sdk/client-cognito-identity-provider");
const assert = require("assert");

// Environment configurations
const region = "ap-southeast-1";
const userPoolId = "ap-southeast-1_wWx3IU0Jy";
const clientId = "2r6f82r87jpg89gk3iunqneuu5";
const apiUrl = "https://wfvqpgmb91.execute-api.ap-southeast-1.amazonaws.com";

const cognitoClient = new CognitoIdentityProviderClient({ region });

// Test users
const users = {
  admin: { email: "admin_test@example.com", password: "Password123!", group: "ADMIN" },
  teacher: { email: "teacher_test@example.com", password: "Password123!", group: "TEACHER" },
  student: { email: "student_test@example.com", password: "Password123!", group: "STUDENT" }
};

// Helper: Setup users and get tokens
async function setupUsers() {
  console.log("--- Setting up test users ---");
  for (const [role, user] of Object.entries(users)) {
    try {
      // 1. Sign Up
      console.log(`Signing up ${role}...`);
      await cognitoClient.send(new SignUpCommand({
        ClientId: clientId,
        Username: user.email,
        Password: user.password,
        UserAttributes: [{ Name: "email", Value: user.email }, { Name: "name", Value: `Test ${role}` }]
      }));
      // 2. Admin Confirm (bypass email verification)
      await cognitoClient.send(new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: user.email
      }));
      // 3. Add to Group if Admin/Teacher
      if (user.group === "ADMIN" || user.group === "TEACHER") {
        await cognitoClient.send(new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: user.email,
          GroupName: user.group
        }));
      }
    } catch (e) {
      if (e.name !== 'UsernameExistsException') {
        console.error(`Failed to setup ${role}:`, e);
      } else {
        console.log(`${role} already exists, proceeding...`);
      }
    }

    // 4. Authenticate
    const authResponse = await cognitoClient.send(new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: {
        USERNAME: user.email,
        PASSWORD: user.password
      }
    }));
    user.token = authResponse.AuthenticationResult.IdToken;
    console.log(`✅ ${role} token acquired.`);
  }
}

// Helper: Cleanup users
async function cleanupUsers() {
  console.log("\n--- Cleaning up test users ---");
  for (const [role, user] of Object.entries(users)) {
    try {
      await cognitoClient.send(new DeleteUserCommand({
        AccessToken: user.token // Note: DeleteUserCommand uses AccessToken. Wait, IdToken? No, AccessToken.
      }));
      console.log(`Cleaned up ${role}`);
    } catch (e) {
        // Fallback to AdminDeleteUser if needed, or skip
        console.log(`Could not delete user via token, skipping ${role}`);
    }
  }
}

// Run test suites
async function runTests() {
  try {
    await setupUsers();

    // ==========================================
    // Test 1: listUsers pagination
    // ==========================================
    console.log("\n--- Test 1: listUsers Pagination ---");
    let listUsersResponse = await fetch(`${apiUrl}/admin/users?limit=2`, {
      headers: { Authorization: `Bearer ${users.admin.token}` }
    });
    let data = await listUsersResponse.json();
    assert.strictEqual(listUsersResponse.status, 200, "listUsers API should return 200");
    assert.ok(Array.isArray(data.users), "Response should have users array");
    console.log(`Fetched ${data.users.length} users. NextToken present: ${!!data.paginationToken}`);
    
    if (data.paginationToken) {
      let nextResponse = await fetch(`${apiUrl}/admin/users?limit=2&paginationToken=${encodeURIComponent(data.paginationToken)}`, {
        headers: { Authorization: `Bearer ${users.admin.token}` }
      });
      let nextData = await nextResponse.json();
      assert.strictEqual(nextResponse.status, 200, "Paginated listUsers should return 200");
      console.log(`Fetched next ${nextData.users.length} users successfully.`);
    }
    console.log("✅ Test 1 Passed!");

    // ==========================================
    // Test 2: Student Attendance History (UC-S04)
    // ==========================================
    console.log("\n--- Test 2: Student Attendance History (UC-S04) ---");
    // 1. Teacher creates session (duration 5 minutes minimum)
    let createSessionResponse = await fetch(`${apiUrl}/sessions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${users.teacher.token}` 
      },
      body: JSON.stringify({
        className: "CS101 - Intro to CS",
        duration: 5
      })
    });
    let sessionData = await createSessionResponse.json();
    if (createSessionResponse.status !== 201) {
      console.error("Create session failed:", sessionData);
    }
    assert.strictEqual(createSessionResponse.status, 201, "Create Session API should return 201");
    const sessionId = sessionData.session.sessionId;
    console.log(`Created Session: ${sessionId}`);

    // 2. Teacher gets QR token
    let qrResponse = await fetch(`${apiUrl}/sessions/${sessionId}/qr`, {
      headers: { Authorization: `Bearer ${users.teacher.token}` }
    });
    let qrData = await qrResponse.json();
    assert.strictEqual(qrResponse.status, 200, "Get QR Token should return 200");
    const token = qrData.token;
    console.log(`Generated QR Token: ${token.substring(0, 8)}...`);

    // 3. Student check-in
    let checkinResponse = await fetch(`${apiUrl}/checkin`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${users.student.token}` 
      },
      body: JSON.stringify({
        token: token,
        sessionId: sessionId,
        deviceFingerprint: "device-xyz-123"
      })
    });
    let checkinData = await checkinResponse.json();
    if (checkinResponse.status !== 200) {
      console.error("Checkin failed:", checkinData);
    }
    assert.strictEqual(checkinResponse.status, 200, "Checkin API should return 200");
    console.log(`Student checked in successfully.`);

    // 4. Student gets history
    let historyResponse = await fetch(`${apiUrl}/my-attendance`, {
      headers: { Authorization: `Bearer ${users.student.token}` }
    });
    let historyData = await historyResponse.json();
    assert.strictEqual(historyResponse.status, 200, "Get history API should return 200");
    assert.ok(historyData.attendance.some(h => h.sessionId === sessionId), "History must contain the session we just checked into");
    console.log(`✅ Test 2 Passed! History verified. (Found ${historyData.attendance.length} records)`);

    // ==========================================
    // Test 3: Auto-close session (FR-12)
    // ==========================================
    console.log("\n--- Test 3: Auto-close session (FR-12) ---");
    console.log("Waiting 305 seconds for the 5-minute session to expire...");
    await new Promise(resolve => setTimeout(resolve, 305000));

    // Try to get another QR token or use an old one? Let's just check session status
    let checkSessionResponse = await fetch(`${apiUrl}/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${users.teacher.token}` }
    });
    let checkSessionData = await checkSessionResponse.json();
    
    // Status should be CLOSED
    console.log(`Session status after 305s: ${checkSessionData.session.status}`);
    assert.strictEqual(checkSessionData.session.status, 'CLOSED', "Session should be automatically CLOSED after expiration");

    // Try to check in with a newly generated QR token (if we can even get one)
    let lateQrResponse = await fetch(`${apiUrl}/sessions/${sessionId}/qr`, {
      headers: { Authorization: `Bearer ${users.teacher.token}` }
    });
    assert.strictEqual(lateQrResponse.status, 400, "Should not be able to get QR token for a CLOSED session");
    
    console.log("✅ Test 3 Passed! Auto-close working as expected.");

  } catch (err) {
    console.error("❌ Test Failed:", err);
  } finally {
    await cleanupUsers();
  }
}

runTests();

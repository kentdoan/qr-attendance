#!/bin/bash
source "$(dirname "$0")/.env"

STUDENT_EMAIL="student1@demo.com"
STUDENT_PASSWORD="Password123!"
STUDENT_NAME="Student frontend"


aws cognito-idp sign-up \
  --client-id $CLIENT_ID \
  --username "$STUDENT_EMAIL" \
  --password "$STUDENT_PASSWORD" \
  --user-attributes Name=name,Value="$STUDENT_NAME"

aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $POOL_ID \
  --username "$STUDENT_EMAIL"

aws cognito-idp admin-update-user-attributes \
  --user-pool-id $POOL_ID \
  --username "$STUDENT_EMAIL" \
  --user-attributes Name=custom:role,Value="STUDENT"

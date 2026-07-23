#!/bin/bash
source "$(dirname "$0")/.env"

TEACHER_EMAIL="teacher1@demo.com"
TEACHER_PASSWORD="Password123!"
TEACHER_NAME="Teacher frontend"

aws cognito-idp sign-up \
  --client-id $CLIENT_ID \
  --username "$TEACHER_EMAIL" \
  --password "$TEACHER_PASSWORD" \
  --user-attributes Name=name,Value="$TEACHER_NAME"

aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $POOL_ID \
  --username "$TEACHER_EMAIL"

aws cognito-idp admin-update-user-attributes \
  --user-pool-id $POOL_ID \
  --username "$TEACHER_EMAIL" \
  --user-attributes Name=custom:role,Value="TEACHER"

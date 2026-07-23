#!/bin/bash
source "$(dirname "$0")/.env"

ADMIN_EMAIL="admin1@demo.com"
ADMIN_PASSWORD="Password123!"
ADMIN_NAME="super admin"

aws cognito-idp sign-up \
  --client-id $CLIENT_ID \
  --username "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --user-attributes Name=name,Value="$ADMIN_NAME"

aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $POOL_ID \
  --username "$ADMIN_EMAIL"

aws cognito-idp admin-update-user-attributes \
  --user-pool-id $POOL_ID \
  --username "$ADMIN_EMAIL" \
  --user-attributes Name=custom:role,Value="ADMIN"

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username "$ADMIN_EMAIL" \
  --group-name ADMIN

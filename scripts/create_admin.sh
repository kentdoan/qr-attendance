#!/bin/bash
set -e

echo "=========================================="
echo "    Create QR Attendance Admin Account    "
echo "=========================================="

STACK_NAME="qr-attendance-backend-dev"

echo "Fetching configuration from AWS (Stack: $STACK_NAME)..."
POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text 2>/dev/null)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text 2>/dev/null)

if [ -z "$POOL_ID" ] || [ -z "$CLIENT_ID" ] || [ "$POOL_ID" == "None" ]; then
    echo "Error: Could not find Cognito configuration from AWS."
    echo "Please ensure you have successfully run 'sam deploy'."
    exit 1
fi

echo "Connected to User Pool: $POOL_ID"
echo ""
echo "Please enter information for the Admin account:"
read -p "Enter Email: " ADMIN_EMAIL
read -s -p "Enter Password (Min 8 chars, uppercase, lowercase, number): " ADMIN_PASSWORD
echo ""
read -p "Enter Full Name: " ADMIN_NAME
echo ""

echo "Creating account on AWS Cognito..."

aws cognito-idp sign-up \
  --client-id $CLIENT_ID \
  --username "$ADMIN_EMAIL" \
  --password "$ADMIN_PASSWORD" \
  --user-attributes Name=name,Value="$ADMIN_NAME" > /dev/null

aws cognito-idp admin-confirm-sign-up \
  --user-pool-id $POOL_ID \
  --username "$ADMIN_EMAIL" > /dev/null

aws cognito-idp admin-update-user-attributes \
  --user-pool-id $POOL_ID \
  --username "$ADMIN_EMAIL" \
  --user-attributes Name=custom:role,Value="ADMIN" > /dev/null

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username "$ADMIN_EMAIL" \
  --group-name ADMIN > /dev/null

echo "Success! Admin account has been created and activated."
echo "You can use the email $ADMIN_EMAIL to log in to the website."

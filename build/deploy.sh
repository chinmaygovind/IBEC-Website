#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

STACK_NAME="ibec-api"

if ! command -v sam &> /dev/null; then
  echo "AWS SAM CLI not found. Install it:"
  echo "  brew install aws-sam-cli"
  exit 1
fi

if ! aws sts get-caller-identity &> /dev/null 2>&1; then
  echo "AWS credentials not configured. Run: aws configure"
  exit 1
fi

echo "Building..."
sam build

echo "Deploying..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

echo ""
echo "Done! Your API URL:"
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text

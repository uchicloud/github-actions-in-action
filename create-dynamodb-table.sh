#!/bin/bash
set -e

echo "📊 DynamoDBテーブルを作成中..."

aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1

echo "✅ DynamoDBテーブル作成完了！"
echo "テーブル名: terraform-state-lock"

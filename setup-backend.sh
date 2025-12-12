#!/bin/bash
set -e

echo "🚀 Terraform Backend セットアップ"
echo "================================"
echo ""

# 1. DynamoDBテーブル作成
echo "📊 ステップ1: DynamoDBテーブルを作成"
echo "実行コマンド:"
echo ""
cat <<'CMD'
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
CMD
echo ""
read -p "DynamoDBテーブルを作成しますか? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  aws dynamodb create-table \
    --table-name terraform-state-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region ap-northeast-1
  echo "✅ DynamoDBテーブル作成完了"
else
  echo "⏭️  スキップ"
fi

echo ""
echo "🔐 ステップ2: IAMポリシーを作成・アタッチ"
echo ""

# 2. IAMポリシー作成
cat > terraform-backend-policy.json <<'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformStateS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::651783364218-github-actions-tf-state",
        "arn:aws:s3:::651783364218-github-actions-tf-state/*"
      ]
    },
    {
      "Sid": "TerraformStateLockDynamoDB",
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:ap-northeast-1:651783364218:table/terraform-state-lock"
    }
  ]
}
POLICY

echo "terraform-backend-policy.json を作成しました"
echo ""
echo "実行コマンド:"
cat <<'CMD'
aws iam create-policy \
  --policy-name TerraformBackendAccess \
  --policy-document file://terraform-backend-policy.json

aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::651783364218:policy/TerraformBackendAccess
CMD

echo ""
read -p "IAMポリシーを作成・アタッチしますか? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  aws iam create-policy \
    --policy-name TerraformBackendAccess \
    --policy-document file://terraform-backend-policy.json || echo "ポリシーは既に存在します"
  
  aws iam attach-role-policy \
    --role-name GitHubActionsDeployRole \
    --policy-arn arn:aws:iam::651783364218:policy/TerraformBackendAccess
  
  echo "✅ IAMポリシーアタッチ完了"
else
  echo "⏭️  スキップ"
fi

echo ""
echo "📦 ステップ3: S3バケットのバージョニング有効化（推奨）"
echo ""
read -p "S3バケットのバージョニングを有効化しますか? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  aws s3api put-bucket-versioning \
    --bucket 651783364218-github-actions-tf-state \
    --versioning-configuration Status=Enabled
  echo "✅ バージョニング有効化完了"
else
  echo "⏭️  スキップ"
fi

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "次のステップ:"
echo "1. 既存AWSリソースを削除: gh workflow run destroy.yml -f confirm=destroy"
echo "2. 変更をコミット: git add . && git commit -m 'feat: enable S3 backend'"
echo "3. デプロイ: git push origin main"

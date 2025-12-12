# Terraform Backend セットアップガイド

TerraformのstateファイルをS3に保存し、複数人での開発やCI/CDでの継続的な管理を可能にします。

## 前提条件

- ✅ S3バケット作成済み: `651783364218-github-actions-tf-state`
- ⚠️ DynamoDBテーブル作成が必要

## セットアップ手順

### 1. DynamoDBテーブルの作成（state locking用）

Terraform state lockingのためのDynamoDBテーブルを作成します。

```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

確認：
```bash
aws dynamodb describe-table \
  --table-name terraform-state-lock \
  --region ap-northeast-1 \
  --query 'Table.TableStatus'
```

### 2. IAMロールに必要な権限を追加

GitHub ActionsのIAMロールに、S3とDynamoDBへのアクセス権限を追加します。

#### S3アクセス権限（state管理用）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::651783364218-github-actions-tf-state/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::651783364218-github-actions-tf-state"
    }
  ]
}
```

#### DynamoDBアクセス権限（state locking用）

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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
```

#### AWS CLIでポリシーを追加

```bash
# ポリシーJSONファイルを作成
cat > terraform-backend-policy.json <<'EOF'
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
EOF

# ポリシーを作成
aws iam create-policy \
  --policy-name TerraformBackendAccess \
  --policy-document file://terraform-backend-policy.json

# GitHubActionsロールにアタッチ
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::651783364218:policy/TerraformBackendAccess
```

### 3. 既存リソースのクリーンアップ

既存のAWSリソースを削除してから、新しいbackend設定でデプロイします。

```bash
# GitHub UIから Destroy ワークフローを実行
# または
gh workflow run destroy.yml -f confirm=destroy

# 完了を確認
gh run list --workflow=destroy.yml --limit 1
```

### 4. 再デプロイ

backend設定を有効化した状態で再デプロイします。

```bash
git add terraform/main.tf docs/terraform-backend-setup.md
git commit -m "feat: enable S3 backend for Terraform state management"
git push origin main
```

## Backend設定の詳細

`terraform/main.tf`のbackend設定：

```hcl
terraform {
  backend "s3" {
    bucket         = "651783364218-github-actions-tf-state"
    key            = "leap-year-app/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### パラメータの説明

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `bucket` | `651783364218-github-actions-tf-state` | stateファイルを保存するS3バケット |
| `key` | `leap-year-app/terraform.tfstate` | バケット内のstateファイルパス |
| `region` | `ap-northeast-1` | S3バケットのリージョン |
| `dynamodb_table` | `terraform-state-lock` | state lockingに使用するテーブル |
| `encrypt` | `true` | stateファイルの暗号化 |

## State Lockingの仕組み

DynamoDBテーブルを使用してstate lockingを実装します：

1. **terraform plan/apply実行前**
   - DynamoDBにロックを取得
   - 他の実行をブロック

2. **実行中**
   - stateファイルが保護される
   - 同時実行による競合を防止

3. **実行完了後**
   - ロックを解放
   - 他の実行が可能に

## トラブルシューティング

### エラー: "Error acquiring the state lock"

**原因**: 前回の実行が異常終了し、ロックが残っている

**解決方法**:
```bash
# ロックを強制解除（慎重に！）
terraform force-unlock <LOCK_ID>

# またはDynamoDBテーブルから直接削除
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"651783364218-github-actions-tf-state/leap-year-app/terraform.tfstate"}}'
```

### エラー: "AccessDenied" for S3 or DynamoDB

**原因**: IAMロールに権限が不足

**解決方法**: 上記の手順2でポリシーを追加

### Backend初期化エラー

**原因**: 既存のローカルstateとの競合

**解決方法**:
```bash
cd terraform
rm -rf .terraform
terraform init -reconfigure
```

## ベストプラクティス

### 1. バケットのバージョニング有効化

```bash
aws s3api put-bucket-versioning \
  --bucket 651783364218-github-actions-tf-state \
  --versioning-configuration Status=Enabled
```

誤削除時に過去バージョンから復元可能になります。

### 2. バケットの暗号化確認

```bash
aws s3api get-bucket-encryption \
  --bucket 651783364218-github-actions-tf-state
```

### 3. ライフサイクルポリシー設定（オプション）

古いstateファイルのバージョンを自動削除：

```json
{
  "Rules": [
    {
      "Id": "DeleteOldVersions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

## まとめ

S3 backendを使用することで：

- ✅ **チーム開発**: 複数人で同じstateを共有
- ✅ **継続的デプロイ**: CI/CDでの安定した運用
- ✅ **State locking**: 同時実行による競合を防止
- ✅ **バージョン管理**: stateの履歴を追跡
- ✅ **暗号化**: セキュアなstate管理

が可能になります。

# AWS OIDC セットアップガイド

このガイドでは、GitHub ActionsからAWSにOIDC認証を使ってアクセスするための設定手順を説明します。

## なぜOIDCを使うのか？

### 従来の方法（アクセスキー）

```yaml
# ❌ 非推奨：アクセスキーをSecretに保存
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

**問題点：**

- アクセスキーが漏洩すると永続的に悪用される
- 定期的なローテーションが必要
- 長期的な認証情報を保存する必要がある

### OIDC認証

```yaml
# ✅ 推奨：OIDC認証
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
    aws-region: ap-northeast-1
```

**メリット：**

- アクセスキー不要
- 一時的な認証情報のみ（セッショントークン）
- より細かい権限制御が可能
- ローテーション不要

## セットアップ手順

### ステップ1: AWS OIDC IDプロバイダーの作成

#### AWSマネジメントコンソールから作成

1. AWSマネジメントコンソールにログイン
2. **IAM** サービスを開く
3. 左メニューから **IDプロバイダー** を選択
4. **プロバイダーを追加** をクリック

#### プロバイダーの設定

| 項目                 | 値                                            |
| -------------------- | --------------------------------------------- |
| プロバイダーのタイプ | OpenID Connect                                |
| プロバイダーのURL    | `https://token.actions.githubusercontent.com` |
| 対象者               | `sts.amazonaws.com`                           |

5. **サムプリントを取得** をクリック
6. **プロバイダーを追加** をクリック

#### AWS CLIから作成

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### ステップ2: IAMロールの作成

#### 信頼ポリシーの作成

`trust-policy.json` を作成：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/github-actions-in-action:*"
        }
      }
    }
  ]
}
```

**重要：** 以下を自分の環境に合わせて変更してください：

- `YOUR_ACCOUNT_ID`: AWSアカウントID（12桁の数字）
- `YOUR_GITHUB_USERNAME`: GitHubユーザー名またはOrganization名

#### より厳密な条件（オプション）

mainブランチのみに制限する場合：

```json
"StringLike": {
  "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/github-actions-in-action:ref:refs/heads/main"
}
```

特定のタグのみに制限する場合：

```json
"StringLike": {
  "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/github-actions-in-action:ref:refs/tags/v*"
}
```

#### IAMロールの作成

```bash
# ロールの作成
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://trust-policy.json

# ロールのARNを確認
aws iam get-role \
  --role-name GitHubActionsDeployRole \
  --query 'Role.Arn' \
  --output text
```

出力されるARNをメモしておきます（例: `arn:aws:iam::123456789012:role/GitHubActionsDeployRole`）

### ステップ3: IAMポリシーの作成と付与

#### 必要な権限の整理

このプロジェクトでは以下の権限が必要です：

1. **S3**: 静的サイトのホスティング
2. **Lambda**: 関数のデプロイ
3. **API Gateway**: APIの作成
4. **IAM**: Lambda用のロール作成
5. **CloudWatch Logs**: ログの書き込み

#### ポリシーの作成

`deployment-policy.json` を作成：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutBucketWebsite",
        "s3:PutBucketPolicy",
        "s3:PutBucketPublicAccessBlock"
      ],
      "Resource": ["arn:aws:s3:::*leap-year*", "arn:aws:s3:::*leap-year*/*"]
    },
    {
      "Sid": "LambdaAccess",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:AddPermission",
        "lambda:RemovePermission"
      ],
      "Resource": "arn:aws:lambda:ap-northeast-1:*:function:leap-year*"
    },
    {
      "Sid": "APIGatewayAccess",
      "Effect": "Allow",
      "Action": ["apigateway:*"],
      "Resource": "arn:aws:apigateway:ap-northeast-1::/*"
    },
    {
      "Sid": "IAMAccess",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:ListAttachedRolePolicies"
      ],
      "Resource": "arn:aws:iam::*:role/leap-year*"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:ap-northeast-1:*:log-group:/aws/lambda/leap-year*"
    }
  ]
}
```

#### ポリシーの作成と付与

```bash
# ポリシーの作成
aws iam create-policy \
  --policy-name GitHubActionsDeployPolicy \
  --policy-document file://deployment-policy.json

# ポリシーのARNを確認（次のコマンドで使用）
# arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsDeployPolicy

# ポリシーをロールに付与
aws iam attach-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/GitHubActionsDeployPolicy
```

### ステップ4: GitHub Secretsの設定

1. GitHubリポジトリを開く
2. **Settings** → **Secrets and variables** → **Actions** を選択
3. **New repository secret** をクリック

#### 設定するシークレット

| Name                  | Value                                                    | 説明                             |
| --------------------- | -------------------------------------------------------- | -------------------------------- |
| `AWS_ROLE_ARN`        | `arn:aws:iam::123456789012:role/GitHubActionsDeployRole` | ステップ2で作成したロールのARN   |
| `WEBSITE_BUCKET_NAME` | `your-unique-bucket-name`                                | S3バケット名（グローバルに一意） |

### ステップ5: 動作確認

#### テストワークフローの作成

`.github/workflows/test-oidc.yml`:

```yaml
name: Test OIDC

on:
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: AWS認証テスト
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ap-northeast-1

      - name: AWS CLI実行テスト
        run: |
          aws sts get-caller-identity
          echo "✅ OIDC認証成功！"
```

#### 実行方法

1. GitHubリポジトリの **Actions** タブを開く
2. **Test OIDC** ワークフローを選択
3. **Run workflow** をクリック

成功すれば、OIDC認証が正しく設定されています。

## トラブルシューティング

### エラー: "Error: Not authorized to perform sts:AssumeRoleWithWebIdentity"

**原因：**

- 信頼ポリシーのリポジトリ名が間違っている
- アカウントIDが間違っている

**確認：**

```bash
aws iam get-role \
  --role-name GitHubActionsDeployRole \
  --query 'Role.AssumeRolePolicyDocument'
```

### エラー: "Error: OIDC provider not found"

**原因：**

- IDプロバイダーが作成されていない

**確認：**

```bash
aws iam list-open-id-connect-providers
```

### エラー: "Error: User is not authorized to perform: iam:PassRole"

**原因：**

- デプロイポリシーに`iam:PassRole`権限が不足している

**解決：**
ステップ3のポリシーに`iam:PassRole`が含まれているか確認してください。

### ワークフローが成功するがリソースが作成されない

**原因：**

- Terraform実行時のエラーがログに出力されている可能性

**確認：**

1. GitHub Actionsのログを詳しく確認
2. AWS CloudWatch Logsを確認

## セキュリティのベストプラクティス

### 1. 最小権限の原則

必要最小限の権限のみを付与します。このプロジェクトでは、リソース名に `leap-year` を含むものに限定しています。

### 2. 条件の厳格化

可能であれば、特定のブランチやタグに限定します：

```json
"StringLike": {
  "token.actions.githubusercontent.com:sub": "repo:owner/repo:ref:refs/heads/main"
}
```

### 3. 定期的な監査

```bash
# ロールが使用された履歴を確認
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=GitHubActionsDeployRole
```

### 4. セッション時間の制限

信頼ポリシーにセッション時間を追加：

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
  },
  "StringLike": {
    "token.actions.githubusercontent.com:sub": "repo:owner/repo:*"
  },
  "NumericLessThan": {
    "aws:SessionDuration": 3600
  }
}
```

## 参考リンク

- [GitHub Actions - OIDC設定ドキュメント](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [AWS IAM - OIDCプロバイダー](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)
- [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)

## まとめ

OIDC認証を使うことで：

- ✅ アクセスキー不要
- ✅ より安全な認証
- ✅ 細かい権限制御
- ✅ 自動ローテーション

が実現できます。初回のセットアップは少し手間がかかりますが、長期的にはより安全で管理しやすいCI/CD環境を構築できます。

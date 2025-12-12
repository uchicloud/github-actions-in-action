# Terraform Backend セットアップガイド

TerraformのstateファイルをS3に保存し、GitHub Actionsでの継続的なインフラ管理を可能にします。

## 前提条件

- ✅ S3バケット作成済み: `651783364218-github-actions-tf-state`
- ✅ GitHub ActionsのOIDC認証設定済み

## セットアップ手順（すべてGitHub Actionsで実行）

### ステップ1: Backend セットアップワークフローを実行

一度だけ実行して、必要なAWSリソースを作成します。

#### GitHub UIから実行

1. GitHubリポジトリの **Actions** タブを開く
2. 左サイドバーから **Setup Terraform Backend** を選択
3. **Run workflow** をクリック
4. **Run workflow** で実行

#### CLIから実行

```bash
gh workflow run setup-backend.yml

# 実行状況を確認
gh run watch
```

このワークフローは以下を自動的に作成します：

- ✅ **DynamoDBテーブル**: `terraform-state-lock` (state locking用)
- ✅ **IAMポリシー**: `TerraformBackendAccess` (S3/DynamoDB権限)
- ✅ **ポリシーアタッチ**: GitHubActionsロールに追加
- ✅ **S3バージョニング**: 有効化

### ステップ2: 既存リソースのクリーンアップ

既存のAWSリソースを削除して、クリーンな状態から開始します。

#### GitHub UIから実行

1. **Actions** → **Destroy AWS Resources**
2. **Run workflow**
3. 確認フィールドに `destroy` と入力
4. **Run workflow** で実行

#### CLIから実行

```bash
gh workflow run destroy.yml -f confirm=destroy

# 完了を確認
gh run list --workflow=destroy.yml --limit 1
```

### ステップ3: 再デプロイ

mainブランチへのpushで、S3 backendを使用した新しいデプロイが自動実行されます。

```bash
git push origin main
```

デプロイワークフローが正常に完了すれば、Terraform stateがS3に保存されます。

## Backend設定の詳細

### terraform/main.tf

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
   - 次の実行が可能に

## 作成されるAWSリソース

### Setup Backend ワークフローで作成

| リソース | 名前 | 用途 |
|---------|------|------|
| DynamoDBテーブル | `terraform-state-lock` | State locking |
| IAMポリシー | `TerraformBackendAccess` | S3/DynamoDB権限 |

### Deploy ワークフローで作成

| リソース | 名前 | 用途 |
|---------|------|------|
| S3バケット | `$WEBSITE_BUCKET_NAME` | 静的サイトホスティング |
| Lambda関数 | `leap-year-checker-api` | うるう年判定API |
| API Gateway | `leap-year-checker-api` | HTTPエンドポイント |
| IAMロール | `leap-year-checker-lambda-role` | Lambda実行ロール |

## トラブルシューティング

### エラー: "Error acquiring the state lock"

**原因**: 前回の実行が異常終了し、ロックが残っている

**解決方法**:

```bash
# DynamoDBのロックを手動削除
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"651783364218-github-actions-tf-state/leap-year-app/terraform.tfstate"}}'
```

### エラー: "AccessDenied" for S3 or DynamoDB

**原因**: IAMロールに権限が不足

**解決方法**: Setup Backend ワークフローを再実行

### Backend初期化エラー

**原因**: 既存リソースとの競合

**解決方法**: Destroyワークフローで既存リソースを削除してから再デプロイ

## S3 Backend の利点

### Before（ローカルstate）❌

- ❌ stateファイルがGitHub Actions実行ごとに消失
- ❌ 既存リソースを認識できない
- ❌ `terraform destroy`が使えない
- ❌ チーム開発不可能

### After（S3 backend）✅

- ✅ **stateファイルが永続化**
- ✅ **既存リソースを正しく認識**
- ✅ **terraform destroy が正常動作**
- ✅ **State locking**で同時実行を防止
- ✅ **バージョン管理**で履歴追跡
- ✅ **暗号化**でセキュア
- ✅ **すべてGitHub Actionsで完結**

## まとめ

1. **Setup Backend** ワークフローを一度実行
2. **Destroy** ワークフローで既存リソースをクリーンアップ
3. **Deploy** ワークフローが自動実行され、stateがS3に保存される

以降のデプロイでは、stateファイルが永続化されているため、インフラの変更管理が正しく動作します。

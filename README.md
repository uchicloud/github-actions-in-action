# うるう年判定アプリ - GitHub Actions 実践プロジェクト

GitHub Actionsを実践的に学ぶためのサンプルプロジェクトです。
うるう年を判定するシンプルなウェブアプリケーションを題材に、CI/CDパイプラインの構築を体験できます。

## プロジェクト概要

### 使用技術

- **フロントエンド**: Hono SSG（静的サイト生成）
- **バックエンド**: AWS Lambda（Node.js）
- **インフラ**: AWS（S3 + Lambda + API Gateway）
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **認証**: OIDC（OpenID Connect）

### 主な機能

1. **うるう年判定API**: 任意の年がうるう年かどうかを判定
2. **静的ウェブサイト**: S3でホスティングされたフロントエンド
3. **自動テスト**: PR作成時にフォーマッター、リンター、テストを自動実行
4. **自動デプロイ**: mainブランチへのマージ時に自動デプロイ

## GitHub Actionsワークフロー

### 1. PR Check（`.github/workflows/pr-check.yml`）

プルリクエスト作成時に自動実行されるワークフロー

#### 実行内容

- **コードフォーマット確認**: Prettierによるコードスタイルチェック
- **リンター実行**: ESLintによるコード品質チェック
- **ユニットテスト**: Vitestによるテスト実行
- **ビルド確認**: 静的サイトが正常に生成できるか確認

#### パーミッション

```yaml
permissions:
  contents: read # リポジトリの内容を読む
  pull-requests: write # PRにコメントを書く
```

### 2. Deploy（`.github/workflows/deploy.yml`）

mainブランチへのマージ時に自動実行されるデプロイワークフロー

#### 実行内容

1. **デプロイ前テスト**: 再度テストを実行して安全性を確認
2. **インフラデプロイ**: Terraformでインフラをプロビジョニング
3. **ウェブサイトデプロイ**: 静的サイトをS3にアップロード

#### パーミッション

```yaml
permissions:
  id-token: write # OIDC認証用
  contents: read # リポジトリの内容を読む
```

#### OIDC認証

GitHub ActionsからAWSへの認証には、OIDC（OpenID Connect）を使用します。
これにより、長期的なアクセスキーを保存する必要がなく、より安全に認証できます。

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-username/github-actions-in-action.git
cd github-actions-in-action
```

### 2. 依存関係のインストール

このプロジェクトは **pnpm** を使用します。

```bash
# pnpmのインストール（未インストールの場合）
npm install -g pnpm

# 依存関係のインストール
pnpm install
```

### 3. ローカル開発

```bash
# 開発サーバーの起動
pnpm run dev

# テストの実行
pnpm test

# リンターの実行
pnpm run lint

# フォーマッターの実行
pnpm run format
```

### 4. AWS環境のセットアップ

#### 4.1 OIDC IDプロバイダーの作成

AWSマネジメントコンソールで以下を実施：

1. IAM → IDプロバイダー → プロバイダーを追加
2. プロバイダーのタイプ: OpenID Connect
3. プロバイダーのURL: `https://token.actions.githubusercontent.com`
4. 対象者: `sts.amazonaws.com`

#### 4.2 IAMロールの作成

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

必要な権限:

- S3: フルアクセス（ウェブサイトホスティング用）
- Lambda: フルアクセス（関数のデプロイ）
- API Gateway: フルアクセス（APIの作成）
- IAM: ロール作成権限
- CloudWatch Logs: ログ書き込み

#### 4.3 GitHub Secretsの設定

リポジトリの Settings → Secrets and variables → Actions で以下を設定：

- `AWS_ROLE_ARN`: 作成したIAMロールのARN（例: `arn:aws:iam::123456789012:role/GitHubActionsRole`）
- `WEBSITE_BUCKET_NAME`: S3バケット名（グローバルに一意な名前）

### 5. Terraformの設定

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars`を編集して、S3バケット名を設定します。

### 6. デプロイ

mainブランチにプッシュすると、自動的にデプロイが実行されます。

```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

## ディレクトリ構造

```
.
├── .github/
│   └── workflows/
│       ├── pr-check.yml      # PR時の自動テスト
│       └── deploy.yml        # デプロイワークフロー
├── frontend/
│   ├── app.js                # Honoアプリケーション
│   └── ssg.ts                # 静的サイト生成スクリプト
├── lambda/
│   └── handler.js            # Lambda関数ハンドラー
├── src/
│   └── leap-year.js          # うるう年判定ロジック
├── tests/
│   ├── unit/                 # ユニットテスト
│   └── integration/          # 統合テスト
├── terraform/
│   ├── main.tf               # Terraformメイン設定
│   ├── variables.tf          # 変数定義
│   └── outputs.tf            # 出力値定義
├── package.json
├── vite.config.ts
├── eslint.config.js
└── .prettierrc.json
```

## 学習ポイント

### 1. ワークフロー定義の各ブロック

詳細は [`docs/github-actions-concept.md`](docs/github-actions-concept.md) を参照してください。

- `name`: ワークフローの名前
- `on`: トリガーイベント（push, pull_request, workflow_dispatchなど）
- `permissions`: ワークフローが必要とする権限
- `jobs`: 実行するジョブの定義
- `steps`: ジョブ内の個別タスク

### 2. パーミッション

テストとデプロイで必要な権限が異なります：

#### テスト（PR Check）

- `contents: read` - コードの読み取り
- `pull-requests: write` - テスト結果のコメント

#### デプロイ

- `id-token: write` - OIDC認証
- `contents: read` - コードの読み取り

### 3. トリガーイベント

イベントを使い分けることで、開発フェーズとワークフローの動作をマッチさせます：

- `pull_request`: PR作成時 → テスト実行
- `push`: mainブランチへのマージ → デプロイ実行
- `workflow_dispatch`: 手動実行 → 任意のタイミングで実行

### 4. ジョブの依存関係

`needs`キーワードでジョブの実行順序を制御：

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    # ...

  deploy:
    needs: test # testジョブが成功したら実行
    runs-on: ubuntu-latest
    # ...
```

## コスト最適化

このプロジェクトでは以下の方針でコストを最適化しています：

1. **ランナー**: `ubuntu-latest`を使用（最もコストパフォーマンスが高い）
2. **パッケージマネージャー**: `pnpm`を使用してキャッシュとインストール時間を最適化
3. **キャッシュ**: `pnpm install`の前にNode.jsのキャッシュを利用
4. **並列実行**: 独立したジョブを並列実行して実行時間を短縮

## テスト

```bash
# すべてのテストを実行
pnpm test

# テストをウォッチモードで実行
pnpm run test:watch

# 特定のテストファイルのみ実行
pnpm test tests/unit/leap-year.test.js
```

## デバッグ

GitHub Actionsのログは、リポジトリの "Actions" タブで確認できます。

ローカルで問題を再現する場合：

```bash
# リンターを実行
pnpm run lint

# フォーマットチェック
pnpm run format:check

# テスト
pnpm test

# ビルド
pnpm run ssg
```

## トラブルシューティング

### Terraform apply が失敗する

- IAMロールの権限が不足している可能性があります
- S3バケット名が既に使用されている可能性があります

### デプロイは成功するがサイトにアクセスできない

- S3バケットのパブリックアクセス設定を確認してください
- バケットポリシーが正しく設定されているか確認してください

### OIDC認証エラー

- GitHub Secretsに正しいIAMロールARNが設定されているか確認してください
- IAMロールの信頼ポリシーでリポジトリ名が正しく指定されているか確認してください

## 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/en/actions)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Hono ドキュメント](https://hono.dev/)
- [AWS Lambda](https://aws.amazon.com/lambda/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

## ライセンス

MIT

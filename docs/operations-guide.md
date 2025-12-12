# うるう年判定アプリ 運用手引書

GitHub Actions を活用した CI/CD パイプラインの運用ガイド

## プロジェクト概要

うるう年を判定する Web アプリケーションです。以下の技術スタックで構築されています：

- **フロントエンド**: Hono SSG（静的サイト生成）
- **バックエンド**: AWS Lambda + API Gateway
- **インフラ**: Terraform
- **CI/CD**: GitHub Actions
- **認証**: AWS OIDC（長期クレデンシャル不要）
- **パッケージマネージャー**: pnpm

## URL 情報

### 本番環境

- **ウェブサイト**: http://651783364218-github-actions-experiment.s3-website-ap-northeast-1.amazonaws.com
  - トップページ: `/`
  - チェッカー: `/checker`
  - About: `/about`

### AWS リソース

- **S3 バケット（Website）**: `651783364218-github-actions-experiment`
- **S3 バケット（Terraform State）**: `651783364218-github-actions-tf-state`
- **DynamoDB（State Lock）**: `terraform-state-lock`
- **Lambda 関数**: `leap-year-checker-api`
- **IAM ロール**: `GitHubActionsDeployRole`

## 開発フロー

### 通常の機能追加・修正

```bash
# 1. 新しいブランチを作成
git checkout -b feature/your-feature-name

# 2. コードを修正
# ... 編集 ...

# 3. ローカルでテスト
pnpm install
pnpm test           # テスト実行
pnpm run lint       # Linter 実行
pnpm run format     # フォーマット修正

# 4. コミット
git add .
git commit -m "feat: 機能の説明"

# 5. プッシュ
git push -u origin feature/your-feature-name

# 6. GitHub でプルリクエストを作成
# PR Check ワークフローが自動実行されます

# 7. PR をマージ
# Deploy ワークフローが自動実行され、本番環境にデプロイされます
```

## ワークフロー詳細

### 1. PR Check ワークフロー

**トリガー**: main ブランチへのプルリクエスト

**実行内容**:

- コードフォーマットチェック（Prettier）
- Linter 実行（ESLint）
- ユニットテスト実行（34 テスト）
- 静的サイトビルド確認

**スキップ条件**:

- `docs/` ディレクトリのみの変更
- Markdown ファイル（`*.md`）のみの変更

**所要時間**: 約 30 秒

### 2. Deploy ワークフロー

**トリガー**: main ブランチへのプッシュ（マージ）

**実行内容**:

1. **pre-deploy-test**: テスト実行
2. **deploy-infrastructure**: Terraform で AWS インフラをデプロイ
   - S3 バケット（静的サイトホスティング）
   - Lambda 関数
   - API Gateway
   - IAM ロール
3. **deploy-website**: 静的サイトを S3 にアップロード

**スキップ条件**:

- `docs/` ディレクトリのみの変更
- Markdown ファイル（`*.md`）のみの変更
- Setup Backend、Destroy ワークフローファイルのみの変更

**所要時間**: 約 1 分 30 秒

**重要な機能**:

- ✅ Terraform state が S3 に保存される（永続化）
- ✅ DynamoDB で state locking（同時実行防止）
- ✅ OIDC 認証でセキュアな AWS アクセス

### 3. Setup Backend ワークフロー

**トリガー**: 手動実行のみ

**実行内容**:

- DynamoDB テーブル `terraform-state-lock` の作成
- IAM ポリシー `TerraformBackendAccess` の作成
- S3 バケットのバージョニング有効化

**実行タイミング**: 初回セットアップ時のみ（一度だけ実行）

**実行方法**:

```bash
# GitHub CLI から
gh workflow run setup-backend.yml

# または GitHub UI から
# Actions → Setup Terraform Backend → Run workflow
```

### 4. Destroy ワークフロー

**トリガー**: 手動実行のみ（確認プロンプト付き）

**実行内容**: すべての AWS リソースを削除

- S3 バケット（Website）
- Lambda 関数
- API Gateway
- IAM ロール

**実行方法**:

```bash
# GitHub CLI から
gh workflow run destroy.yml -f confirm=destroy

# または GitHub UI から
# Actions → Destroy AWS Resources → Run workflow
# 確認フィールドに "destroy" と入力
```

**注意**: Terraform state と DynamoDB テーブルは削除されません

## よくある操作

### ローカル開発

```bash
# 依存関係インストール
pnpm install

# テスト実行
pnpm test

# Linter 実行
pnpm run lint

# フォーマット修正
pnpm run format

# 静的サイト生成
pnpm run ssg

# 生成されたサイトの確認
# dist/ ディレクトリにファイルが生成されます
ls -la dist/
```

### すべてのチェックを実行

```bash
pnpm run format:check && pnpm run lint && pnpm test && pnpm run ssg
```

### デプロイログの確認

```bash
# 最新のデプロイワークフローを確認
gh run list --workflow=deploy.yml --limit 5

# 特定の実行の詳細を表示
gh run view <run-id>

# 失敗したログのみ表示
gh run view <run-id> --log-failed
```

### Terraform State の確認

```bash
# S3 の state ファイルを確認
aws s3 ls s3://651783364218-github-actions-tf-state/leap-year-app/

# DynamoDB の state lock テーブルを確認
aws dynamodb describe-table --table-name terraform-state-lock
```

## トラブルシューティング

### デプロイが失敗した場合

#### 1. エラーログを確認

```bash
gh run list --workflow=deploy.yml --limit 3
gh run view <run-id> --log-failed
```

#### 2. よくあるエラーと対処法

**エラー**: `Error acquiring the state lock`

**原因**: 前回の実行が異常終了し、DynamoDB ロックが残っている

**対処法**:

```bash
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"651783364218-github-actions-tf-state/leap-year-app/terraform.tfstate"}}'
```

**エラー**: `AccessDenied` for S3 or DynamoDB

**原因**: IAM ロールに権限が不足

**対処法**: Setup Backend ワークフローを再実行

**エラー**: `ResourceAlreadyExists`（Lambda, IAM など）

**原因**: 手動で削除したリソースが Terraform state に残っている

**対処法**:

1. Destroy ワークフローで完全削除
2. または、Terraform import でリソースを取り込む

### PR Check が失敗した場合

#### フォーマットエラー

```bash
# ローカルで修正
pnpm run format

# 確認
pnpm run format:check

# コミット
git add .
git commit -m "style: Fix formatting"
git push
```

#### Linter エラー

```bash
# ローカルで確認
pnpm run lint

# 自動修正可能なものを修正
npx eslint . --fix

# コミット
git add .
git commit -m "fix: Fix linting issues"
git push
```

#### テスト失敗

```bash
# ローカルでテスト実行
pnpm test

# 詳細モードで実行
pnpm test --reporter=verbose

# テストを修正後、コミット
git add .
git commit -m "fix: Fix failing tests"
git push
```

### ブランチの削除

```bash
# ローカルブランチを削除
git branch -d branch-name

# 強制削除（マージされていない場合）
git branch -D branch-name

# リモートブランチを削除
git push origin --delete branch-name
```

### AWS リソースの手動確認

```bash
# S3 バケットの内容確認
aws s3 ls s3://651783364218-github-actions-experiment/ --recursive

# Lambda 関数の確認
aws lambda get-function --function-name leap-year-checker-api

# API Gateway の確認
aws apigatewayv2 get-apis
```

## セキュリティ

### GitHub Secrets

以下の Secrets が設定されています：

- `AWS_ROLE_ARN`: GitHub Actions が assume する IAM ロールの ARN
- `WEBSITE_BUCKET_NAME`: 静的サイトホスティング用 S3 バケット名

### OIDC 認証

長期クレデンシャル（Access Key / Secret Key）は使用せず、OIDC を使用した一時的な認証情報を使用しています。

## ベストプラクティス

### コミットメッセージ

Conventional Commits 形式を推奨：

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメントのみの変更
- `style:` フォーマット修正
- `refactor:` リファクタリング
- `test:` テストの追加・修正
- `chore:` ビルドプロセスやツールの変更

### ブランチ戦略

- `main`: 本番環境にデプロイされるブランチ
- `feature/*`: 機能追加用ブランチ
- `fix/*`: バグ修正用ブランチ
- `docs/*`: ドキュメント修正用ブランチ

### PR のマージ

- すべての PR Check が成功してからマージ
- Squash merge を推奨（コミット履歴を整理）

## メンテナンス

### 定期的に確認すべき項目

- [ ] GitHub Actions のワークフロー実行履歴
- [ ] AWS コストエクスプローラー（予期しない課金の確認）
- [ ] DynamoDB テーブルのアイテム数（通常は 0）
- [ ] S3 バケットのバージョン数（定期的にクリーンアップ）

### 依存関係の更新

```bash
# 更新可能なパッケージを確認
pnpm outdated

# 依存関係を更新
pnpm update

# テストして問題なければコミット
pnpm test
git add pnpm-lock.yaml package.json
git commit -m "chore: Update dependencies"
```

## 参考リンク

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Hono ドキュメント](https://hono.dev/)
- [AWS OIDC 設定ガイド](./aws-oidc-setup.md)
- [Terraform Backend セットアップ](./terraform-backend-setup.md)

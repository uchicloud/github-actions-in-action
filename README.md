# うるう年判定アプリ - GitHub Actions 実践プロジェクト

GitHub Actions を実践的に学ぶためのサンプルプロジェクトです。
うるう年を判定するシンプルなウェブアプリケーションを題材に、本番運用レベルの CI/CD パイプラインの構築を体験できます。

## 🌐 デモサイト

**本番環境**: http://651783364218-github-actions-experiment.s3-website-ap-northeast-1.amazonaws.com

## ✨ プロジェクトの特徴

このプロジェクトは、GitHub Actions を使った**実践的な CI/CD パイプライン**を学べるように設計されています：

✅ **完全自動化された CI/CD** - PR から本番デプロイまで全自動
✅ **Terraform State 管理** - S3 バックエンドで永続化、DynamoDB でロック
✅ **セキュアな認証** - OIDC による一時的な認証（長期クレデンシャル不要）
✅ **品質保証** - フォーマッター、リンター、テスト（34 テスト）
✅ **最適化されたワークフロー** - ドキュメント変更時はスキップ

## 📚 ドキュメント

- **[運用手引書](docs/operations-guide.md)** - 日常の開発・運用ガイド（推奨）
- [AWS OIDC セットアップ](docs/aws-oidc-setup.md) - AWS 認証の設定手順
- [Terraform Backend セットアップ](docs/terraform-backend-setup.md) - State 管理の設定
- [GitHub Actions コンセプト](docs/github-actions-concept.md) - ワークフローの基礎

## 🛠 使用技術

- **フロントエンド**: Hono SSG（静的サイト生成）
- **バックエンド**: AWS Lambda（Node.js 20）
- **インフラ**: AWS（S3 + Lambda + API Gateway）
- **IaC**: Terraform
- **CI/CD**: GitHub Actions
- **認証**: OIDC（OpenID Connect）
- **パッケージマネージャー**: pnpm
- **テスト**: Vitest
- **リンター**: ESLint
- **フォーマッター**: Prettier

## 🚀 主な機能

### アプリケーション機能

1. **うるう年判定**: 任意の年がうるう年かどうかを判定
2. **静的ウェブサイト**: S3 でホスティングされた高速なフロントエンド
3. **レスポンシブデザイン**: モバイル対応の美しい UI

### CI/CD 機能

1. **PR Check ワークフロー**: PR 作成時に自動的に品質チェックを実行
2. **Deploy ワークフロー**: main ブランチへのマージ時に自動デプロイ
3. **Setup Backend ワークフロー**: Terraform State 管理の初期セットアップ
4. **Destroy ワークフロー**: AWS リソースの安全な削除

## 🔄 GitHub Actions ワークフロー

### 1. PR Check

**トリガー**: main ブランチへのプルリクエスト
**所要時間**: 約 30 秒
**スキップ条件**: ドキュメント（`docs/**`、`**.md`）のみの変更

**実行内容**:

- ✅ コードフォーマット確認（Prettier）
- ✅ リンター実行（ESLint）
- ✅ ユニットテスト実行（34 テスト）
- ✅ 静的サイトビルド確認

### 2. Deploy to AWS

**トリガー**: main ブランチへのマージ
**所要時間**: 約 1 分 30 秒
**スキップ条件**: ドキュメントやメンテナンスワークフローのみの変更

**実行内容**:

1. **pre-deploy-test**: デプロイ前の最終テスト
2. **deploy-infrastructure**: Terraform でインフラをプロビジョニング
   - S3 バケット（静的サイトホスティング）
   - Lambda 関数
   - API Gateway
   - IAM ロール
3. **deploy-website**: 静的サイトを S3 にデプロイ

**重要**: Terraform State は S3 に保存され、DynamoDB でロックされます。

### 3. Setup Terraform Backend

**トリガー**: 手動実行のみ
**実行タイミング**: 初回セットアップ時のみ

**実行内容**:

- DynamoDB テーブル作成（state locking 用）
- IAM ポリシー作成（S3/DynamoDB アクセス権限）
- S3 バケットのバージョニング有効化

### 4. Destroy AWS Resources

**トリガー**: 手動実行のみ（確認プロンプト付き）
**実行内容**: すべての AWS リソースを安全に削除

## 🚀 クイックスタート

### 前提条件

- Node.js 20 以上
- pnpm（推奨）
- AWS アカウント
- GitHub アカウント

### ローカル開発

```bash
# 1. リポジトリをクローン
git clone https://github.com/your-username/github-actions-in-action.git
cd github-actions-in-action

# 2. pnpm をインストール（未インストールの場合）
npm install -g pnpm

# 3. 依存関係をインストール
pnpm install

# 4. テストを実行
pnpm test

# 5. リンターとフォーマッターを実行
pnpm run lint
pnpm run format:check

# 6. 静的サイトを生成
pnpm run ssg

# 7. すべてのチェックを一度に実行
pnpm run format:check && pnpm run lint && pnpm test && pnpm run ssg
```

### AWS 環境のセットアップ

詳細は [AWS OIDC セットアップガイド](docs/aws-oidc-setup.md) を参照してください。

**概要**:

1. AWS で OIDC ID プロバイダーを作成
2. IAM ロールを作成（Terraform、Lambda、S3 などの権限を付与）
3. GitHub Secrets を設定
   - `AWS_ROLE_ARN`: IAM ロールの ARN
   - `WEBSITE_BUCKET_NAME`: S3 バケット名
4. Setup Backend ワークフローを実行（一度だけ）
5. main ブランチにプッシュしてデプロイ

### 初回デプロイ

```bash
# 1. Setup Backend ワークフローを実行（GitHub UI または CLI）
gh workflow run setup-backend.yml

# 2. コードをコミット
git add .
git commit -m "feat: Initial deployment"
git push origin main

# 3. Deploy ワークフローが自動実行されます
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

## 📖 学習ポイント

このプロジェクトから学べる主要な概念：

### GitHub Actions の基礎

- ✅ **ワークフロー定義**: `on`, `jobs`, `steps` の構造
- ✅ **トリガー条件**: `pull_request`, `push`, `workflow_dispatch`
- ✅ **パーミッション管理**: 最小権限の原則
- ✅ **ジョブの依存関係**: `needs` による実行順序制御
- ✅ **パス条件**: `paths-ignore` で無駄な実行を削減

### AWS との統合

- ✅ **OIDC 認証**: 長期クレデンシャル不要のセキュアな認証
- ✅ **Terraform**: インフラのコード化
- ✅ **State 管理**: S3 バックエンドと DynamoDB ロック

### CI/CD ベストプラクティス

- ✅ **品質保証**: 自動テスト、リンター、フォーマッターの統合
- ✅ **並列実行**: 独立したジョブの並列化で時間短縮
- ✅ **キャッシュ活用**: pnpm キャッシュで依存関係インストールを高速化
- ✅ **失敗時の対応**: リトライ、ロールバック、通知

詳細は [GitHub Actions コンセプト](docs/github-actions-concept.md) を参照してください。

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

## 🔧 トラブルシューティング

詳細なトラブルシューティングは [運用手引書](docs/operations-guide.md#トラブルシューティング) を参照してください。

### よくある問題

**Q: デプロイが失敗する**
A: ワークフローのログを確認してください:

```bash
gh run list --workflow=deploy.yml --limit 3
gh run view <run-id> --log-failed
```

**Q: Terraform state lock エラー**
A: DynamoDB のロックを削除してください:

```bash
aws dynamodb delete-item \
  --table-name terraform-state-lock \
  --key '{"LockID":{"S":"651783364218-github-actions-tf-state/leap-year-app/terraform.tfstate"}}'
```

**Q: PR Check が失敗する**
A: ローカルで修正してから再プッシュ:

```bash
pnpm run format        # フォーマット修正
pnpm run lint          # リンター確認
pnpm test              # テスト実行
```

## 🔗 参考リンク

### プロジェクトドキュメント

- [運用手引書](docs/operations-guide.md) - 推奨
- [AWS OIDC セットアップ](docs/aws-oidc-setup.md)
- [Terraform Backend セットアップ](docs/terraform-backend-setup.md)
- [GitHub Actions コンセプト](docs/github-actions-concept.md)

### 外部リソース

- [GitHub Actions ドキュメント](https://docs.github.com/ja/actions)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Hono ドキュメント](https://hono.dev/)
- [AWS Lambda](https://aws.amazon.com/jp/lambda/)
- [Vitest](https://vitest.dev/)

## 📊 プロジェクト統計

- **ワークフロー**: 4 個（PR Check、Deploy、Setup Backend、Destroy）
- **テスト**: 34 個（すべて成功）
- **デプロイ時間**: 約 1 分 30 秒
- **AWS リソース**: S3、Lambda、API Gateway、DynamoDB、IAM

## 📝 ライセンス

MIT

---

**開発者向けガイド**: このプロジェクトを実際に運用する場合は、必ず [運用手引書](docs/operations-guide.md) を確認してください。

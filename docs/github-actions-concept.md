# GitHub Actions 概念整理ノート

---

## 目的

- GitHub Actions に登場する **処理の粒度（Workflow / Job / Step）** を整理する
- **出力（outputs）と可視性のスコープ**を一発で理解する
- `${{ ... }}` や `${VAR}` などの **パース順序・評価レイヤー**を明確にする

---

## 全体構造（最重要）

```
Repository
└─ Workflow（workflow file / name）
   ├─ Job A（job id）
   │  ├─ Step 1
   │  ├─ Step 2
   │  └─ Job Outputs
   └─ Job B（job id）
      ├─ Step 1
      └─ Step 2
```

- **Workflow**：イベント単位の実行
- **Job**：隔離された実行環境（VM / コンテナ）
- **Step**：同一環境内での直列処理

---

## 粒度ごとの責務と可視性

### Workflow レベル

- 定義：YAMLファイル全体
- 主な要素
  - `name`, `on`, `env`, `jobs`

- 可視性
  - workflow 内の **すべての job / step** から参照可能

```yaml
env:
  GLOBAL_ENV: workflow
```

---

### Job レベル

- 定義：`jobs.<job_id>`
- job id は **workflow 内で一意**
- 特徴
  - job ごとに **runner が完全に分離**
  - FS / プロセス / env は他 job と共有されない

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    env:
      JOB_ENV: build
```

---

### Step レベル

- 定義：`jobs.<job>.steps[]`
- 特徴
  - 同一 job 内で **直列実行**
  - FS / 環境変数は後続 step に引き継がれる

```yaml
- name: example step
  run: echo "hello"
```

---

## Outputs（明示的なデータ受け渡し）

### Step Outputs

```yaml
- name: generate
  id: gen
  run: echo "value=hello" >> $GITHUB_OUTPUT
```

- 参照方法

```yaml
${{ steps.gen.outputs.value }}
```

- 可視性
  - **同一 job 内のみ**

---

### Job Outputs

```yaml
jobs:
  build:
    outputs:
      artifact: ${{ steps.gen.outputs.value }}
```

- 参照方法

```yaml
${{ needs.build.outputs.artifact }}
```

- 可視性
  - **後続 job のみ**（`needs` 経由）

---

## 共有されないもの（重要）

以下は job 間で **自動共有されない**

- ファイル
- 環境変数
- 実行中プロセス

共有したい場合は：

- `outputs`
- `artifacts`
- 外部ストレージ（S3 など）

---

## パースと評価の責任分界（最重要）

### 結論：**誰が解決しているか**で考える

GitHub Actions の評価は構文ではなく **責任主体** で分けると一発で理解できる。

- **GitHub（コントロールプレーン）**：workflow を解釈・確定する側
- **Runner（データプレーン）**：確定した内容を実行する側

---

## 全体の流れ（時系列）

```
[GitHub]
  1. workflow YAML を読む
  2. ${{ ... }} をすべて解決
  3. job / step の実行計画を確定
        ↓
[Runner 起動]
        ↓
[Runner]
  4. shell を起動
  5. コマンド実行
  6. $VAR を展開
  7. $GITHUB_ENV / OUTPUT に書き込む
        ↓
[GitHub]
  8. step 結果を回収
  9. 次 step の実行計画を更新
```

---

## GitHub が解決するもの（runner 起動前）

### 対象

- `${{ ... }}`（GitHub Expressions）
- job の依存関係（`needs`）
- 条件分岐（`if:`）

```yaml
run: echo "${{ github.ref }}"
```

GitHub が runner に渡す時点では：

```bash
echo "refs/heads/main"
```

👉 **runner には `${{ }}` は届かない**

---

## Runner が解決するもの（実行時）

### 対象

- `$VAR` / `${VAR}`（shell の環境変数）
- ファイル・プロセス・カレントディレクトリ

```yaml
run: echo "$HOME"
```

👉 `$HOME` を知っているのは **runner だけ**

---

## なぜ混乱が起きるのか（典型例）

### ❌ これは動かない

```yaml
run: echo "${{ FOO }}"
```

理由：

- GitHub が解決するフェーズで `FOO` が存在しない

---

### ✅ GitHub に解決させる

```yaml
env:
  FOO: bar

run: echo "${{ env.FOO }}"
```

---

### ✅ Runner に解決させる

```yaml
env:
  FOO: bar

run: echo "$FOO"
```

---

## $GITHUB_ENV / $GITHUB_OUTPUT の正体

### 役割：**Runner → GitHub への報告チャネル**

```bash
echo "FOO=bar" >> $GITHUB_ENV
echo "value=hello" >> $GITHUB_OUTPUT
```

- runner が step 実行中に書き込む
- step 終了時に GitHub が回収
- 次 step の実行計画に反映

👉 **暗黙共有ではなく、明示的な通信**

---

## 即確認用：責任分界まとめ

| 記法 / 概念      | 解決する主体    | タイミング    | 備考             |
| ---------------- | --------------- | ------------- | ---------------- |
| `${{ ... }}`     | GitHub          | runner 起動前 | 制御・分岐・参照 |
| `$VAR`           | Runner(shell)   | step 実行時   | 環境変数         |
| `$GITHUB_ENV`    | Runner → GitHub | step 終了時   | 次 step へ       |
| `$GITHUB_OUTPUT` | Runner → GitHub | step 終了時   | outputs 生成     |

---

## インフラエンジニア向け要点

- GitHub Actions は **分散システム**
- GitHub = control plane
- Runner = data plane
- `${{ }}` = 制御時に確定
- `$VAR` = 実行時に評価

---

この責任分界モデルで考えると：

- なぜ job 間で env が共有されないか
- なぜ outputs が必要か
- なぜ OIDC は job レベルで効くか

が一貫して説明できる。

- job = 隔離された実行環境
- データ受け渡しは **明示的に**
- `${{ }}` と `${}` は **別レイヤー**
- 暗黙共有がない → 再現性が高い

---

このモデルを頭に入れると：

- なぜ job を分けるのか
- なぜ outputs が必要なのか
- なぜ OIDC は job レベルで効くのか

が一気に腹落ちする。

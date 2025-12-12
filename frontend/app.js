import { Hono } from 'hono';

const app = new Hono();

// ホームページ
app.get('/', (c) => {
  return c.html(renderPage('うるう年判定', homeContent()));
});

// うるう年チェッカーページ
app.get('/checker', (c) => {
  return c.html(renderPage('うるう年チェッカー', checkerContent()));
});

// About ページ
app.get('/about', (c) => {
  return c.html(renderPage('うるう年について', aboutContent()));
});

/**
 * 共通のHTMLレイアウト
 */
function renderPage(title, content) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | うるう年判定アプリ</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #333;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }

    header h1 {
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    header p {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    nav {
      background: #f8f9fa;
      padding: 15px 30px;
      border-bottom: 1px solid #e9ecef;
    }

    nav a {
      color: #667eea;
      text-decoration: none;
      margin-right: 20px;
      font-weight: 500;
      transition: color 0.3s;
    }

    nav a:hover {
      color: #764ba2;
    }

    main {
      padding: 40px 30px;
    }

    .checker-form {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #495057;
    }

    input[type="number"] {
      width: 100%;
      padding: 12px;
      border: 2px solid #dee2e6;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    input[type="number"]:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    button:active {
      transform: translateY(0);
    }

    #result {
      margin-top: 20px;
      padding: 20px;
      border-radius: 6px;
      display: none;
    }

    #result.success {
      display: block;
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }

    #result.info {
      display: block;
      background: #d1ecf1;
      border: 1px solid #bee5eb;
      color: #0c5460;
    }

    #result.error {
      display: block;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }

    .info-box {
      background: #e7f3ff;
      border-left: 4px solid #2196F3;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }

    .rule-list {
      list-style: none;
      margin-top: 15px;
    }

    .rule-list li {
      padding: 10px;
      margin: 8px 0;
      background: white;
      border-radius: 6px;
      border-left: 3px solid #667eea;
    }

    footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      border-top: 1px solid #e9ecef;
      color: #6c757d;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }

    .feature-card {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      text-align: center;
    }

    .feature-card h3 {
      color: #667eea;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🗓️ うるう年判定</h1>
      <p>GitHub Actionsで学ぶCI/CD実践プロジェクト</p>
    </header>

    <nav>
      <a href="/">ホーム</a>
      <a href="/checker">チェッカー</a>
      <a href="/about">うるう年について</a>
    </nav>

    <main>
      ${content}
    </main>

    <footer>
      <p>Powered by Hono SSG + AWS Lambda + GitHub Actions</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * ホームページのコンテンツ
 */
function homeContent() {
  return `
    <h2>ようこそ！</h2>
    <p>このアプリケーションは、うるう年を判定するシンプルなウェブサービスです。</p>

    <div class="feature-grid">
      <div class="feature-card">
        <h3>🚀 モダンな技術</h3>
        <p>Hono SSG、AWS Lambda、S3を活用</p>
      </div>
      <div class="feature-card">
        <h3>⚙️ CI/CD</h3>
        <p>GitHub Actionsで自動テスト・デプロイ</p>
      </div>
      <div class="feature-card">
        <h3>🔒 セキュア</h3>
        <p>OIDC認証でAWSにデプロイ</p>
      </div>
    </div>

    <div class="info-box">
      <h3>このプロジェクトについて</h3>
      <p>GitHub Actionsを学ぶための実践的なプロジェクトです。以下の機能を実装しています：</p>
      <ul class="rule-list">
        <li>✅ プルリクエスト時の自動テスト（Linter、Formatter、Unit Tests）</li>
        <li>✅ mainブランチへのマージ時に自動デプロイ</li>
        <li>✅ Terraformによるインフラ管理</li>
        <li>✅ OIDC認証によるセキュアなAWS認証</li>
      </ul>
    </div>
  `;
}

/**
 * チェッカーページのコンテンツ
 */
function checkerContent() {
  return `
    <h2>うるう年チェッカー</h2>

    <div class="checker-form">
      <div class="form-group">
        <label for="year">年を入力してください：</label>
        <input type="number" id="year" name="year" placeholder="例: 2024" min="1" value="2024">
      </div>
      <button onclick="checkLeapYear()">判定する</button>
      <div id="result"></div>
    </div>

    <div class="info-box">
      <h3>💡 うるう年とは？</h3>
      <p>4年に1度訪れる、1年が366日ある年のことです。2月が29日まであります。</p>
    </div>

    <script>
      async function checkLeapYear() {
        const year = document.getElementById('year').value;
        const resultDiv = document.getElementById('result');

        if (!year || year < 1) {
          resultDiv.className = 'error';
          resultDiv.innerHTML = '有効な年を入力してください';
          return;
        }

        try {
          // ローカル判定（本番環境ではAPI URLを設定）
          const apiUrl = window.location.hostname === 'localhost'
            ? '/api/leap-year'  // 開発環境
            : 'YOUR_API_GATEWAY_URL';  // 本番環境

          const isLeap = checkLeapYearLocal(parseInt(year));
          const reason = getReasonLocal(parseInt(year));

          resultDiv.className = isLeap ? 'success' : 'info';
          resultDiv.innerHTML = \`
            <h3>\${year}年は\${isLeap ? 'うるう年です！ 🎉' : 'うるう年ではありません'}</h3>
            <p>\${reason}</p>
          \`;
        } catch (error) {
          resultDiv.className = 'error';
          resultDiv.innerHTML = 'エラーが発生しました: ' + error.message;
        }
      }

      function checkLeapYearLocal(year) {
        if (year % 400 === 0) return true;
        if (year % 100 === 0) return false;
        if (year % 4 === 0) return true;
        return false;
      }

      function getReasonLocal(year) {
        if (year % 400 === 0) {
          return year + '年は400で割り切れるため、うるう年です。';
        }
        if (year % 100 === 0) {
          return year + '年は100で割り切れますが400では割り切れないため、うるう年ではありません。';
        }
        if (year % 4 === 0) {
          return year + '年は4で割り切れるため、うるう年です。';
        }
        return year + '年は4で割り切れないため、うるう年ではありません。';
      }

      // Enterキーでも判定できるようにする
      document.getElementById('year').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          checkLeapYear();
        }
      });
    </script>
  `;
}

/**
 * About ページのコンテンツ
 */
function aboutContent() {
  return `
    <h2>うるう年について</h2>

    <div class="info-box">
      <h3>うるう年の判定ルール</h3>
      <ul class="rule-list">
        <li>🔢 <strong>4で割り切れる年</strong>はうるう年</li>
        <li>❌ ただし、<strong>100で割り切れる年</strong>はうるう年ではない</li>
        <li>✅ ただし、<strong>400で割り切れる年</strong>はうるう年</li>
      </ul>
    </div>

    <h3>具体例</h3>
    <ul class="rule-list">
      <li><strong>2024年:</strong> 4で割り切れる → うるう年 ✅</li>
      <li><strong>2023年:</strong> 4で割り切れない → 平年 ❌</li>
      <li><strong>2000年:</strong> 400で割り切れる → うるう年 ✅</li>
      <li><strong>1900年:</strong> 100で割り切れるが400では割り切れない → 平年 ❌</li>
    </ul>

    <div class="info-box">
      <h3>なぜうるう年があるの？</h3>
      <p>地球が太陽の周りを1周するのにかかる時間は、正確には約365.2422日です。
      この0.2422日分のズレを調整するために、4年に1度、1日を追加します。</p>
      <p>ただし、4年に1度だと調整しすぎてしまうため、100年に1度は追加せず、
      さらに400年に1度は追加する、という複雑なルールになっています。</p>
    </div>
  `;
}

export default app;

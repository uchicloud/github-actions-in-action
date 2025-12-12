import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import app from './app.js';

/**
 * Hono SSG - 静的サイト生成
 */
async function generateStaticSite() {
  const distDir = join(process.cwd(), 'dist');

  // distディレクトリを作成
  await mkdir(distDir, { recursive: true });

  // 生成するページのリスト
  const pages = [
    { path: '/', filename: 'index.html' },
    { path: '/checker', filename: 'checker/index.html' },
    { path: '/about', filename: 'about/index.html' },
  ];

  console.log('🚀 静的サイトを生成中...\n');

  // API URLを環境変数から取得
  const apiUrl = process.env.VITE_API_URL || '';
  console.log(`🔗 API URL: ${apiUrl || '(ローカル開発モード)'}\n`);

  // 各ページを生成
  for (const page of pages) {
    try {
      const req = new Request(`http://localhost${page.path}`);
      const res = await app.fetch(req);
      let html = await res.text();

      // API URLを注入（本番環境の場合）
      if (apiUrl) {
        const configScript = `
  <script>
    // API Gateway URL（ビルド時に注入）
    window.API_URL = '${apiUrl}';
  </script>`;
        // </head>の直前に挿入
        html = html.replace('</head>', `${configScript}\n</head>`);
      }

      const outputPath = join(distDir, page.filename);
      // サブディレクトリを作成
      await mkdir(join(distDir, page.filename.split('/').slice(0, -1).join('/')), {
        recursive: true,
      });
      await writeFile(outputPath, html, 'utf-8');

      console.log(`✅ ${page.path} → ${page.filename}`);
    } catch (error) {
      console.error(`❌ ${page.path} の生成に失敗:`, error);
      process.exit(1);
    }
  }

  console.log('\n✨ 静的サイトの生成が完了しました！');
  console.log(`📂 出力先: ${distDir}`);
}

generateStaticSite().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});

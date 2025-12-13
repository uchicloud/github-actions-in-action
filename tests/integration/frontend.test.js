import { describe, test } from 'node:test';
import assert from 'node:assert';
import app from '../../frontend/app.js';

describe('Frontend Hono App - HTMLエンドポイント', () => {
  describe('ホームページ (/)', () => {
    test('200レスポンスを返す', async () => {
      const res = await app.request('/');
      assert.strictEqual(res.status, 200);
    });

    test('HTMLコンテンツを返す', async () => {
      const res = await app.request('/');
      const html = await res.text();

      assert.ok(html.includes('<!DOCTYPE html>'));
      assert.ok(html.includes('うるう年判定'));
      assert.ok(html.includes('GitHub Actionsで学ぶCI/CD実践プロジェクト'));
    });

    test('正しいタイトルが含まれる', async () => {
      const res = await app.request('/');
      const html = await res.text();

      assert.ok(html.includes('<title>うるう年判定 | うるう年判定アプリ</title>'));
    });
  });

  describe('チェッカーページ (/checker)', () => {
    test('200レスポンスを返す', async () => {
      const res = await app.request('/checker');
      assert.strictEqual(res.status, 200);
    });

    test('うるう年チェッカーのコンテンツを含む', async () => {
      const res = await app.request('/checker');
      const html = await res.text();

      assert.ok(html.includes('うるう年チェッカー'));
      assert.ok(html.includes('年を入力してください'));
      assert.ok(html.includes('checkLeapYear'));
    });

    test('入力フォームが含まれる', async () => {
      const res = await app.request('/checker');
      const html = await res.text();

      assert.ok(html.includes('<input type="number"'));
      assert.ok(html.includes('id="year"'));
    });
  });

  describe('Aboutページ (/about)', () => {
    test('200レスポンスを返す', async () => {
      const res = await app.request('/about');
      assert.strictEqual(res.status, 200);
    });

    test('うるう年のルールが説明されている', async () => {
      const res = await app.request('/about');
      const html = await res.text();

      assert.ok(html.includes('うるう年について'));
      assert.ok(html.includes('4で割り切れる年'));
      assert.ok(html.includes('100で割り切れる年'));
      assert.ok(html.includes('400で割り切れる年'));
    });

    test('具体例が含まれる', async () => {
      const res = await app.request('/about');
      const html = await res.text();

      assert.ok(html.includes('2024年'));
      assert.ok(html.includes('2000年'));
      assert.ok(html.includes('1900年'));
    });
  });

  describe('レスポンスヘッダー', () => {
    test('Content-Typeがtext/html', async () => {
      const res = await app.request('/');
      assert.ok(res.headers.get('Content-Type').includes('text/html'));
    });
  });
});

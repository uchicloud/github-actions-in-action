import { describe, test, expect } from 'vitest';
import app from '../../frontend/app.js';

describe('Frontend Hono App', () => {
  describe('ホームページ (/)', () => {
    test('200レスポンスを返す', async () => {
      const res = await app.request('/');
      expect(res.status).toBe(200);
    });

    test('HTMLコンテンツを返す', async () => {
      const res = await app.request('/');
      const html = await res.text();

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('うるう年判定');
      expect(html).toContain('GitHub Actionsで学ぶCI/CD実践プロジェクト');
    });

    test('正しいタイトルが含まれる', async () => {
      const res = await app.request('/');
      const html = await res.text();

      expect(html).toContain('<title>うるう年判定 | うるう年判定アプリ</title>');
    });
  });

  describe('チェッカーページ (/checker)', () => {
    test('200レスポンスを返す', async () => {
      const res = await app.request('/checker');
      expect(res.status).toBe(200);
    });

    test('うるう年チェッカーのコンテンツを含む', async () => {
      const res = await app.request('/checker');
      const html = await res.text();

      expect(html).toContain('うるう年チェッカー');
      expect(html).toContain('年を入力してください');
      expect(html).toContain('checkLeapYear');
    });

    test('入力フォームが含まれる', async () => {
      const res = await app.request('/checker');
      const html = await res.text();

      expect(html).toContain('<input type="number"');
      expect(html).toContain('id="year"');
    });
  });

  describe('Aboutページ (/about)', () => {
    test('200レスポンスを返す', async () => {
      const res = await app.request('/about');
      expect(res.status).toBe(200);
    });

    test('うるう年のルールが説明されている', async () => {
      const res = await app.request('/about');
      const html = await res.text();

      expect(html).toContain('うるう年について');
      expect(html).toContain('4で割り切れる年');
      expect(html).toContain('100で割り切れる年');
      expect(html).toContain('400で割り切れる年');
    });

    test('具体例が含まれる', async () => {
      const res = await app.request('/about');
      const html = await res.text();

      expect(html).toContain('2024年');
      expect(html).toContain('2000年');
      expect(html).toContain('1900年');
    });
  });

  describe('ナビゲーション', () => {
    test('すべてのページに共通ナビゲーションがある', async () => {
      const pages = ['/', '/checker', '/about'];

      for (const path of pages) {
        const res = await app.request(path);
        const html = await res.text();

        expect(html).toContain('<nav>');
        expect(html).toContain('href="/"');
        expect(html).toContain('href="/checker"');
        expect(html).toContain('href="/about"');
      }
    });
  });

  describe('レスポンスヘッダー', () => {
    test('Content-Typeがtext/html', async () => {
      const res = await app.request('/');
      expect(res.headers.get('Content-Type')).toContain('text/html');
    });
  });
});

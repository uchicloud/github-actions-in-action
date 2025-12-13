import { describe, test } from 'node:test';
import assert from 'node:assert';
import { handler } from '../../lambda/handler.js';

describe('Lambda Handler', () => {
  describe('GET リクエスト', () => {
    test('正しいクエリパラメータでうるう年を判定', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/leap-year',
        queryStringParameters: {
          year: '2024',
        },
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(body.year, 2024);
      assert.strictEqual(body.isLeapYear, true);
      assert.ok(body.reason.includes('うるう年です'));
    });

    test('うるう年ではない年を判定', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/leap-year',
        queryStringParameters: {
          year: '2023',
        },
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(body.year, 2023);
      assert.strictEqual(body.isLeapYear, false);
      assert.ok(body.reason.includes('うるう年ではありません'));
    });

    test('yearパラメータがない場合はエラー', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/leap-year',
        queryStringParameters: {},
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      assert.strictEqual(response.statusCode, 400);
      assert.ok(body.error !== undefined);
    });

    test('yearが数値でない場合はエラー', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/leap-year',
        queryStringParameters: {
          year: 'abc',
        },
      };

      const response = await handler(event);

      assert.strictEqual(response.statusCode, 400);
    });
  });

  describe('POST リクエスト', () => {
    test('単一年の判定', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/leap-year',
        body: JSON.stringify({
          year: 2000,
        }),
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(body.year, 2000);
      assert.strictEqual(body.isLeapYear, true);
    });

    test('範囲指定でうるう年リストを取得', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/leap-year',
        body: JSON.stringify({
          startYear: 2020,
          endYear: 2024,
        }),
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(body.startYear, 2020);
      assert.strictEqual(body.endYear, 2024);
      assert.deepStrictEqual(body.leapYears, [2020, 2024]);
      assert.strictEqual(body.count, 2);
    });

    test('パラメータが不足している場合はエラー', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/leap-year',
        body: JSON.stringify({}),
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      assert.strictEqual(response.statusCode, 400);
      assert.ok(body.error !== undefined);
    });
  });

  describe('OPTIONS リクエスト（CORS）', () => {
    test('プリフライトリクエストに対応', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/api/leap-year',
      };

      const response = await handler(event);

      assert.strictEqual(response.statusCode, 200);
      assert.strictEqual(response.headers['Access-Control-Allow-Origin'], '*');
      assert.ok(response.headers['Access-Control-Allow-Methods'].includes('GET'));
      assert.ok(response.headers['Access-Control-Allow-Methods'].includes('POST'));
    });
  });

  describe('その他のメソッド', () => {
    test('サポートされていないメソッドはエラー', async () => {
      const event = {
        httpMethod: 'DELETE',
        path: '/api/leap-year',
      };

      const response = await handler(event);

      assert.strictEqual(response.statusCode, 405);
    });
  });

  describe('CORSヘッダー', () => {
    test('すべてのレスポンスにCORSヘッダーが含まれる', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/leap-year',
        queryStringParameters: {
          year: '2024',
        },
      };

      const response = await handler(event);

      assert.strictEqual(response.headers['Access-Control-Allow-Origin'], '*');
      assert.strictEqual(response.headers['Content-Type'], 'application/json');
    });
  });
});

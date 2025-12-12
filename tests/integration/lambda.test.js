import { describe, test, expect } from 'vitest';
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

      expect(response.statusCode).toBe(200);
      expect(body.year).toBe(2024);
      expect(body.isLeapYear).toBe(true);
      expect(body.reason).toContain('うるう年です');
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

      expect(response.statusCode).toBe(200);
      expect(body.year).toBe(2023);
      expect(body.isLeapYear).toBe(false);
      expect(body.reason).toContain('うるう年ではありません');
    });

    test('yearパラメータがない場合はエラー', async () => {
      const event = {
        httpMethod: 'GET',
        path: '/api/leap-year',
        queryStringParameters: {},
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(body.error).toBeDefined();
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

      expect(response.statusCode).toBe(400);
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

      expect(response.statusCode).toBe(200);
      expect(body.year).toBe(2000);
      expect(body.isLeapYear).toBe(true);
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

      expect(response.statusCode).toBe(200);
      expect(body.startYear).toBe(2020);
      expect(body.endYear).toBe(2024);
      expect(body.leapYears).toEqual([2020, 2024]);
      expect(body.count).toBe(2);
    });

    test('パラメータが不足している場合はエラー', async () => {
      const event = {
        httpMethod: 'POST',
        path: '/api/leap-year',
        body: JSON.stringify({}),
      };

      const response = await handler(event);
      const body = JSON.parse(response.body);

      expect(response.statusCode).toBe(400);
      expect(body.error).toBeDefined();
    });
  });

  describe('OPTIONS リクエスト（CORS）', () => {
    test('プリフライトリクエストに対応', async () => {
      const event = {
        httpMethod: 'OPTIONS',
        path: '/api/leap-year',
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
    });
  });

  describe('その他のメソッド', () => {
    test('サポートされていないメソッドはエラー', async () => {
      const event = {
        httpMethod: 'DELETE',
        path: '/api/leap-year',
      };

      const response = await handler(event);

      expect(response.statusCode).toBe(405);
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

      expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
      expect(response.headers['Content-Type']).toBe('application/json');
    });
  });
});

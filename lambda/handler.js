import { isLeapYear, getLeapYearReason, getLeapYearsInRange } from './src/leap-year.js';

/**
 * Lambda関数のメインハンドラー
 * APIエンドポイント: /api/leap-year
 */
export async function handler(event) {
  // CORSヘッダー
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // OPTIONSリクエスト（プリフライト）への対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // メソッドを取得
    const method = event.httpMethod || event.requestContext?.http?.method;

    // GETリクエスト: クエリパラメータから年を取得
    if (method === 'GET') {
      const params = event.queryStringParameters || {};
      const year = parseInt(params.year, 10);

      if (!year || isNaN(year)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: '年をクエリパラメータで指定してください（例: ?year=2024）',
          }),
        };
      }

      const result = {
        year,
        isLeapYear: isLeapYear(year),
        reason: getLeapYearReason(year),
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // POSTリクエスト: ボディから年または範囲を取得
    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');

      // 範囲指定の場合
      if (body.startYear && body.endYear) {
        const startYear = parseInt(body.startYear, 10);
        const endYear = parseInt(body.endYear, 10);

        const leapYears = getLeapYearsInRange(startYear, endYear);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            startYear,
            endYear,
            leapYears,
            count: leapYears.length,
          }),
        };
      }

      // 単一年の場合
      if (body.year) {
        const year = parseInt(body.year, 10);

        const result = {
          year,
          isLeapYear: isLeapYear(year),
          reason: getLeapYearReason(year),
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result),
        };
      }

      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'yearまたはstartYear/endYearを指定してください',
        }),
      };
    }

    // サポートされていないメソッド
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method Not Allowed',
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Internal Server Error',
      }),
    };
  }
}

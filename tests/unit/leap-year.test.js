import { describe, test } from 'node:test';
import assert from 'node:assert';
import { isLeapYear, getLeapYearReason, getLeapYearsInRange } from '../../src/leap-year.js';

describe('isLeapYear', () => {
  describe('うるう年の判定', () => {
    test('4で割り切れる年はうるう年', () => {
      assert.strictEqual(isLeapYear(2024), true);
      assert.strictEqual(isLeapYear(2020), true);
      assert.strictEqual(isLeapYear(2016), true);
    });

    test('100で割り切れる年はうるう年ではない', () => {
      assert.strictEqual(isLeapYear(1900), false);
      assert.strictEqual(isLeapYear(2100), false);
      assert.strictEqual(isLeapYear(2200), false);
    });

    test('400で割り切れる年はうるう年', () => {
      assert.strictEqual(isLeapYear(2000), true);
      assert.strictEqual(isLeapYear(2400), true);
      assert.strictEqual(isLeapYear(1600), true);
    });

    test('4で割り切れない年はうるう年ではない', () => {
      assert.strictEqual(isLeapYear(2023), false);
      assert.strictEqual(isLeapYear(2021), false);
      assert.strictEqual(isLeapYear(2019), false);
    });
  });

  describe('歴史的に重要な年', () => {
    test('2000年はうるう年（ミレニアム）', () => {
      assert.strictEqual(isLeapYear(2000), true);
    });

    test('1900年はうるう年ではない', () => {
      assert.strictEqual(isLeapYear(1900), false);
    });

    test('2024年はうるう年（現在に近い年）', () => {
      assert.strictEqual(isLeapYear(2024), true);
    });
  });

  describe('エッジケース', () => {
    test('1年はうるう年ではない', () => {
      assert.strictEqual(isLeapYear(1), false);
    });

    test('4年はうるう年', () => {
      assert.strictEqual(isLeapYear(4), true);
    });

    test('無効な入力: 文字列', () => {
      assert.throws(() => isLeapYear('2024'), { message: '年は整数で指定してください' });
    });

    test('無効な入力: 小数', () => {
      assert.throws(() => isLeapYear(2024.5), { message: '年は整数で指定してください' });
    });

    test('無効な入力: 負の数', () => {
      assert.throws(() => isLeapYear(-4), { message: '年は1以上の値を指定してください' });
    });

    test('無効な入力: 0', () => {
      assert.throws(() => isLeapYear(0), { message: '年は1以上の値を指定してください' });
    });
  });
});

describe('getLeapYearReason', () => {
  test('400で割り切れる年の説明', () => {
    const reason = getLeapYearReason(2000);
    assert.ok(reason.includes('400で割り切れる'));
    assert.ok(reason.includes('うるう年です'));
  });

  test('100で割り切れる年の説明', () => {
    const reason = getLeapYearReason(1900);
    assert.ok(reason.includes('100で割り切れ'));
    assert.ok(reason.includes('うるう年ではありません'));
  });

  test('4で割り切れる年の説明', () => {
    const reason = getLeapYearReason(2024);
    assert.ok(reason.includes('4で割り切れる'));
    assert.ok(reason.includes('うるう年です'));
  });

  test('4で割り切れない年の説明', () => {
    const reason = getLeapYearReason(2023);
    assert.ok(reason.includes('4で割り切れない'));
    assert.ok(reason.includes('うるう年ではありません'));
  });
});

describe('getLeapYearsInRange', () => {
  test('範囲内のうるう年を取得', () => {
    const leapYears = getLeapYearsInRange(2020, 2024);
    assert.deepStrictEqual(leapYears, [2020, 2024]);
  });

  test('100年で割り切れる年を含む範囲', () => {
    const leapYears = getLeapYearsInRange(1896, 1904);
    assert.deepStrictEqual(leapYears, [1896, 1904]);
    assert.ok(!leapYears.includes(1900));
  });

  test('400年で割り切れる年を含む範囲', () => {
    const leapYears = getLeapYearsInRange(1998, 2002);
    assert.deepStrictEqual(leapYears, [2000]);
  });

  test('うるう年が存在しない範囲', () => {
    const leapYears = getLeapYearsInRange(2021, 2023);
    assert.deepStrictEqual(leapYears, []);
  });

  test('1年だけの範囲', () => {
    const leapYears = getLeapYearsInRange(2024, 2024);
    assert.deepStrictEqual(leapYears, [2024]);
  });

  test('無効な範囲: 開始年 > 終了年', () => {
    assert.throws(() => getLeapYearsInRange(2024, 2020), { message: '開始年は終了年以下である必要があります' });
  });

  test('21世紀前半のうるう年', () => {
    const leapYears = getLeapYearsInRange(2000, 2025);
    assert.strictEqual(leapYears.length, 7);
    assert.ok(leapYears.includes(2000));
    assert.ok(leapYears.includes(2024));
  });
});

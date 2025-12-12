import { describe, test, expect } from 'vitest';
import { isLeapYear, getLeapYearReason, getLeapYearsInRange } from '../../src/leap-year.js';

describe('isLeapYear', () => {
  describe('うるう年の判定', () => {
    test('4で割り切れる年はうるう年', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2020)).toBe(true);
      expect(isLeapYear(2016)).toBe(true);
    });

    test('100で割り切れる年はうるう年ではない', () => {
      expect(isLeapYear(1900)).toBe(false);
      expect(isLeapYear(2100)).toBe(false);
      expect(isLeapYear(2200)).toBe(false);
    });

    test('400で割り切れる年はうるう年', () => {
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2400)).toBe(true);
      expect(isLeapYear(1600)).toBe(true);
    });

    test('4で割り切れない年はうるう年ではない', () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2021)).toBe(false);
      expect(isLeapYear(2019)).toBe(false);
    });
  });

  describe('歴史的に重要な年', () => {
    test('2000年はうるう年（ミレニアム）', () => {
      expect(isLeapYear(2000)).toBe(true);
    });

    test('1900年はうるう年ではない', () => {
      expect(isLeapYear(1900)).toBe(false);
    });

    test('2024年はうるう年（現在に近い年）', () => {
      expect(isLeapYear(2024)).toBe(true);
    });
  });

  describe('エッジケース', () => {
    test('1年はうるう年ではない', () => {
      expect(isLeapYear(1)).toBe(false);
    });

    test('4年はうるう年', () => {
      expect(isLeapYear(4)).toBe(true);
    });

    test('無効な入力: 文字列', () => {
      expect(() => isLeapYear('2024')).toThrow('年は整数で指定してください');
    });

    test('無効な入力: 小数', () => {
      expect(() => isLeapYear(2024.5)).toThrow('年は整数で指定してください');
    });

    test('無効な入力: 負の数', () => {
      expect(() => isLeapYear(-4)).toThrow('年は1以上の値を指定してください');
    });

    test('無効な入力: 0', () => {
      expect(() => isLeapYear(0)).toThrow('年は1以上の値を指定してください');
    });
  });
});

describe('getLeapYearReason', () => {
  test('400で割り切れる年の説明', () => {
    const reason = getLeapYearReason(2000);
    expect(reason).toContain('400で割り切れる');
    expect(reason).toContain('うるう年です');
  });

  test('100で割り切れる年の説明', () => {
    const reason = getLeapYearReason(1900);
    expect(reason).toContain('100で割り切れ');
    expect(reason).toContain('うるう年ではありません');
  });

  test('4で割り切れる年の説明', () => {
    const reason = getLeapYearReason(2024);
    expect(reason).toContain('4で割り切れる');
    expect(reason).toContain('うるう年です');
  });

  test('4で割り切れない年の説明', () => {
    const reason = getLeapYearReason(2023);
    expect(reason).toContain('4で割り切れない');
    expect(reason).toContain('うるう年ではありません');
  });
});

describe('getLeapYearsInRange', () => {
  test('範囲内のうるう年を取得', () => {
    const leapYears = getLeapYearsInRange(2020, 2024);
    expect(leapYears).toEqual([2020, 2024]);
  });

  test('100年で割り切れる年を含む範囲', () => {
    const leapYears = getLeapYearsInRange(1896, 1904);
    expect(leapYears).toEqual([1896, 1904]);
    expect(leapYears).not.toContain(1900);
  });

  test('400年で割り切れる年を含む範囲', () => {
    const leapYears = getLeapYearsInRange(1998, 2002);
    expect(leapYears).toEqual([2000]);
  });

  test('うるう年が存在しない範囲', () => {
    const leapYears = getLeapYearsInRange(2021, 2023);
    expect(leapYears).toEqual([]);
  });

  test('1年だけの範囲', () => {
    const leapYears = getLeapYearsInRange(2024, 2024);
    expect(leapYears).toEqual([2024]);
  });

  test('無効な範囲: 開始年 > 終了年', () => {
    expect(() => getLeapYearsInRange(2024, 2020)).toThrow('開始年は終了年以下である必要があります');
  });

  test('21世紀前半のうるう年', () => {
    const leapYears = getLeapYearsInRange(2000, 2025);
    expect(leapYears).toHaveLength(7);
    expect(leapYears).toContain(2000);
    expect(leapYears).toContain(2024);
  });
});

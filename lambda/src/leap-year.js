/**
 * うるう年判定ロジック
 *
 * うるう年の条件:
 * 1. 4で割り切れる年はうるう年
 * 2. ただし、100で割り切れる年はうるう年ではない
 * 3. ただし、400で割り切れる年はうるう年
 */

/**
 * 指定された年がうるう年かどうかを判定
 * @param {number} year - 判定する年
 * @returns {boolean} うるう年の場合true
 */
export function isLeapYear(year) {
  if (typeof year !== 'number' || !Number.isInteger(year)) {
    throw new Error('年は整数で指定してください');
  }

  if (year < 1) {
    throw new Error('年は1以上の値を指定してください');
  }

  // 400で割り切れる年はうるう年
  if (year % 400 === 0) {
    return true;
  }

  // 100で割り切れる年はうるう年ではない
  if (year % 100 === 0) {
    return false;
  }

  // 4で割り切れる年はうるう年
  if (year % 4 === 0) {
    return true;
  }

  // それ以外はうるう年ではない
  return false;
}

/**
 * うるう年判定の説明を取得
 * @param {number} year - 判定する年
 * @returns {string} 判定理由の説明
 */
export function getLeapYearReason(year) {
  if (year % 400 === 0) {
    return `${year}年は400で割り切れるため、うるう年です。`;
  }

  if (year % 100 === 0) {
    return `${year}年は100で割り切れますが400では割り切れないため、うるう年ではありません。`;
  }

  if (year % 4 === 0) {
    return `${year}年は4で割り切れるため、うるう年です。`;
  }

  return `${year}年は4で割り切れないため、うるう年ではありません。`;
}

/**
 * 指定された範囲のうるう年を取得
 * @param {number} startYear - 開始年
 * @param {number} endYear - 終了年
 * @returns {number[]} うるう年の配列
 */
export function getLeapYearsInRange(startYear, endYear) {
  if (startYear > endYear) {
    throw new Error('開始年は終了年以下である必要があります');
  }

  const leapYears = [];
  for (let year = startYear; year <= endYear; year++) {
    if (isLeapYear(year)) {
      leapYears.push(year);
    }
  }

  return leapYears;
}

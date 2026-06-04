export function money(value: number) {
  return Math.round(value).toLocaleString('ru-RU');
}

export function scoreDelta(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export function signedPercent(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${Math.round(value * 100)}%`;
}

export function signedScore(value = 0) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

export const APP_CURRENCY = 'CLP';
export const APP_LOCALE = 'es-CL';
export const APP_CURRENCY_SYMBOL = '$';

export function formatCurrency(
  value: number | string | null | undefined,
  options: Intl.NumberFormatOptions = {},
) {
  const amount = Number(value || 0);

  return amount.toLocaleString(APP_LOCALE, {
    style: 'currency',
    currency: APP_CURRENCY,
    maximumFractionDigits: 0,
    ...options,
  });
}

/**
 * Helpers de formato compartidos para toda la feature de transferencias.
 *
 * Estos utilitarios deberían ser usados por cualquier composition que muestre
 * montos, monedas o números de cuenta (from-account-card, account-card,
 * confirm-transfer-page, successful-transfer-page, etc.) para mantener
 * consistencia visual en todo el flujo.
 */

/**
 * Mapeo oficial de códigos ISO de moneda a su símbolo visible.
 * Si una moneda no está aquí, se muestra el código tal cual.
 */
export const CURRENCY_SYMBOLS = {
  USD: "$",
  PEN: "S/",
};

/**
 * Devuelve el símbolo de la moneda dado un código ISO.
 * Si la moneda no está mapeada, devuelve el código original (ej. "EUR")
 * para que el usuario lo identifique en pantalla.
 *
 * @param {String} currency Código ISO (USD, PEN, EUR, ...)
 * @returns {String}
 */
export function getCurrencySymbol(currency) {
  if (!currency) return "";
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

/**
 * Formatea un monto con su símbolo de moneda y separadores de miles.
 * Siempre muestra 2 decimales.
 *
 * Ejemplos:
 *   formatAmount(12800.5, "USD")     -> "$12,800.50"
 *   formatAmount(3420.75, "PEN")     -> "S/3,420.75"
 *   formatAmount(1234567.89, "USD")  -> "$1,234,567.89"
 *   formatAmount(5000, "EUR")        -> "EUR5,000.00"
 *
 * @param {Number|String} amount
 * @param {String} currency
 * @returns {String}
 */
export function formatAmount(amount, currency) {
  if (amount === null || amount === undefined || amount === "") return "";
  const number = Number(amount);
  if (Number.isNaN(number)) return "";

  const symbol = getCurrencySymbol(currency);
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);

  return `${symbol}${formatted}`;
}

/**
 * Enmascara un número de cuenta dejando visibles solo los últimos 4 dígitos.
 * Patrón típico de banca: "****5678".
 *
 * Si la cuenta tiene 4 dígitos o menos, se devuelve sin enmascarar
 * (no tiene sentido enmascarar todo).
 *
 * @param {String|Number} accountNumber
 * @returns {String}
 */
export function maskAccountNumber(accountNumber) {
  if (!accountNumber) return "";
  const value = String(accountNumber);
  if (value.length <= 4) return value;
  return `****${value.slice(-4)}`;
}

/**
 * Mocks de datos de transferencia.
 *
 * TRANSFER_DATA_MOCK define el contrato unificado que consume confirm-transfer-page
 * y que (a futuro) debería también consumir successful-transfer-page para eliminar
 * las dos estructuras paralelas que existen hoy (ver propuesta en transfer-summary.js).
 *
 * Estructura del contrato:
 * {
 *   amount: Number,          - monto en número (no string), sin símbolo de moneda
 *   currency: String,        - "USD" | "PEN"
 *   sourceAccount: {
 *     accountName: String,   - "Cuenta de Ahorros"
 *     accountNumber: String, - 8 dígitos, sin máscara (la máscara la aplica el componente)
 *     accountType: String,   - "Ahorros" | "Corriente" | ...
 *     availableBalance: Number,
 *   },
 *   beneficiary: {
 *     fullName: String,      - nombre completo del beneficiario (viene del API destino)
 *     accountNumber: String, - número de cuenta destino, 8 dígitos sin máscara
 *   },
 * }
 */

export const TRANSFER_DATA_MOCK = {
  amount: 1234.00,
  currency: "USD",
  sourceAccount: {
    accountName: "Cuenta de Ahorros",
    accountNumber: "56785678",
    accountType: "Ahorros",
    availableBalance: 12800.50,
  },
  beneficiary: {
    fullName: "Juan Carlos Pérez Gómez",
    accountNumber: "98765432",
  },
};

/** Útil para testear el estado vacío / loading antes de que lleguen los datos. */
export const TRANSFER_DATA_EMPTY = null;

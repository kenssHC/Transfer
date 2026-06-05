/**
 * Mock de datos de transferencia usado DURANTE EL DESARROLLO.
 *
 * Cuando el store global y el service POST /transfers estén implementados,
 * estos datos vendrán dinámicamente del flujo real:
 *   - amount + currency  → del formulario en new-transfer-page
 *   - sourceAccount      → cuenta seleccionada en transfer-page
 *   - beneficiary        → respuesta de GET /customers/account-number/{n}/
 *
 * Mientras tanto, este mock es la fuente única de datos para:
 *   - confirm-transfer-page
 *   - successful-transfer-page (a futuro, EYM lo extenderá con fecha,
 *     hora, número de transacción, estado, etc.)
 *
 * Se exporta también como TRANSFER_DATA_EMPTY para probar el estado vacío.
 */

export const TRANSFER_DATA_MOCK = {
  amount: 1234.00,
  currency: "USD",
  sourceAccount: {
    accountName: "Cuenta de Ahorros",
    accountNumber: "12345678",
    accountType: "Ahorros",
  },
  beneficiary: {
    fullName: "Juan Carlos Pérez Gómez",
    accountNumber: "98765432",
  },
};

export const TRANSFER_DATA_EMPTY = null;

import { html, LitElement } from "lit";
import { styles } from "./transfer-summary.css.js";
import "@components/type-text/type-text.js";
import "@compositions/info-field/info-field.js";
import { formatAmount, maskAccountNumber } from "@utils/format.js";

/**
 * <transfer-summary>
 *
 * TODO (propuesta de unificación para EYM — successful-transfer-page):
 * Actualmente existen DOS estructuras paralelas para mostrar un resumen de transferencia:
 *   1. Este componente (transfer-summary): contrato { amount, currency, sourceAccount, beneficiary }.
 *      Lo usa confirm-transfer-page. Acepta un slot por defecto para campos extra.
 *   2. transfer-summary-card + transfer-summary-list (src/organisms/): props planas
 *      (originAccount, originAccountNumber, beneficiaryName, beneficiaryLastName,
 *      transactionNumber, date, time, concept, status, current, amount).
 *      Lo usa successful-transfer-page.
 *
 * Propuesta: que successful-transfer-page adopte este componente (transfer-summary)
 * y pase los campos extra (fecha, hora, transactionNumber, status, concept) como
 * <info-field> dentro del slot por defecto. Esto eliminaría transfer-summary-card y
 * transfer-summary-list, reduciendo duplicidad y usando el mismo contrato de datos.
 * Ver src/mocks/transfer-data.js para la estructura de referencia.
 *
 * Impacto estimado del cambio:
 *   - successful-transfer-page.js: adaptar el render para usar <transfer-summary> + slots.
 *   - src/mocks/transfer.mock.js (SUCCESSFUL_TRANSFER_RESPONSE_MOCK): extender con
 *     sourceAccount y beneficiary en vez de props planas.
 *   - Se pueden eliminar: organisms/transfer-summary-card/, compositions/transfer-summary-list/.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Composition REUTILIZABLE que muestra el resumen visual de una transferencia.
 * La consumen confirm-transfer-page y (a futuro) successful-transfer-page.
 *
 * Estructura visual (apilada verticalmente):
 *   1. Card destacada con gradiente morado.
 *      Texto label (configurable) + monto formateado.
 *   2. Lista de info-fields:
 *        - "Cuenta origen" → nombre + número enmascarado
 *        - "Beneficiario"  → nombre + cuenta destino enmascarada
 *   3. Slot por defecto al final → para que el padre añada info-fields
 *      adicionales (ej. fecha, hora, número de transacción, estado en
 *      successful-transfer-page).
 *
 * Componente puramente DISPLAY: no emite eventos.
 */
export class TransferSummary extends LitElement {
  static properties = {
    /**
     * Datos de la transferencia.
     * Estructura esperada (ver TRANSFER_DATA_MOCK):
     *   {
     *     amount: Number,
     *     currency: String,
     *     sourceAccount: {
     *       accountName: String,
     *       accountNumber: String,
     *     },
     *     beneficiary: {
     *       fullName: String,
     *       accountNumber: String,
     *     }
     *   }
     * @type {Object|null}
     */
    transferData: { type: Object },

    /**
     * Texto que aparece arriba del monto dentro de la card morada.
     * Por default "Monto a transferir" (caso confirm-transfer-page).
     * Para successful-transfer-page sería "Monto transferido".
     * @type {String}
     */
    amountLabel: { type: String, attribute: "amount-label" },
  };

  constructor() {
    super();
    this.transferData = null;
    this.amountLabel = "Monto a transferir";
  }

  static styles = styles;

  get _data() {
    return this.transferData ?? {};
  }

  get _formattedAmount() {
    return formatAmount(this._data.amount, this._data.currency);
  }

  get _sourceAccountName() {
    return this._data.sourceAccount?.accountName ?? "Sin cuenta";
  }

  get _sourceAccountNumber() {
    return maskAccountNumber(this._data.sourceAccount?.accountNumber);
  }

  get _beneficiaryName() {
    return this._data.beneficiary?.fullName ?? "Sin beneficiario";
  }

  get _beneficiaryAccount() {
    return maskAccountNumber(this._data.beneficiary?.accountNumber);
  }

  _renderAmountCard() {
    return html`
      <div class="transfer-summary__amount-card">
        <type-text
          tag="span"
          size="s"
          weight="medium"
          text=${this.amountLabel}
          class="transfer-summary__amount-label"
        ></type-text>
        <type-text
          tag="p"
          size="xl"
          weight="bold"
          text=${this._formattedAmount}
          class="transfer-summary__amount-value"
        ></type-text>
      </div>
    `;
  }

  _renderSourceAccountField() {
    return html`
      <info-field>
        <type-text
          slot="label"
          tag="span"
          size="s"
          text="Cuenta origen"
        ></type-text>
        <div slot="value" class="transfer-summary__value-block">
          <type-text
            tag="span"
            size="s"
            weight="semibold"
            align="right"
            text=${this._sourceAccountName}
          ></type-text>
          <type-text
            tag="span"
            size="xs"
            align="right"
            text=${this._sourceAccountNumber}
            class="transfer-summary__muted"
          ></type-text>
        </div>
      </info-field>
    `;
  }

  _renderBeneficiaryField() {
    return html`
      <info-field>
        <type-text
          slot="label"
          tag="span"
          size="s"
          text="Beneficiario"
        ></type-text>
        <div slot="value" class="transfer-summary__value-block">
          <type-text
            tag="span"
            size="s"
            weight="semibold"
            align="right"
            text=${this._beneficiaryName}
          ></type-text>
          <type-text
            tag="span"
            size="xs"
            align="right"
            text=${this._beneficiaryAccount}
            class="transfer-summary__muted"
          ></type-text>
        </div>
      </info-field>
    `;
  }

  render() {
    return html`
      <section class="transfer-summary">
        ${this._renderAmountCard()}
        <div class="transfer-summary__fields">
          ${this._renderSourceAccountField()}
          ${this._renderBeneficiaryField()}
          <slot></slot>
        </div>
      </section>
    `;
  }
}

customElements.define("transfer-summary", TransferSummary);

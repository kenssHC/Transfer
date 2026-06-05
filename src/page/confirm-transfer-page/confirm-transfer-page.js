import { html, LitElement } from "lit";
import { styles } from "./confirm-transfer-page.css.js";
import "@compositions/type-modal/type-modal.js";
import "@compositions/type-button/type-button.js";
import "@compositions/transfer-summary/transfer-summary.js";

/**
 * <confirm-transfer-page>
 *
 * Page (modal tipo "dialog") que se muestra DESPUÉS del formulario de
 * new-transfer-page y ANTES de successful-transfer-page.
 * Muestra al usuario un resumen de la transferencia (monto + cuenta origen
 * + beneficiario) para que la confirme antes de enviarla.
 *
 * Es un controlled component:
 *   - El padre controla la apertura con la prop `open`.
 *   - El padre debe pasar `transferData` (objeto con la transferencia).
 *   - El padre puede setear `loading=true` mientras se procesa el POST
 *     a /transfers; mientras `loading=true` ambos botones quedan disabled.
 *   - La page emite `confirm-accept` y `confirm-cancel`. El padre decide
 *     qué hacer (navegar a successful, volver al form, etc.).
 *
 * Eventos:
 *   - confirm-accept   → detail: { transferData }
 *   - confirm-cancel   → sin detail
 */
export class ConfirmTransferPage extends LitElement {
  static properties = {
    /**
     * Datos de la transferencia a confirmar.
     * Ver TRANSFER_DATA_MOCK (services/mocks/transfer-data.js).
     * @type {Object|null}
     */
    transferData: { type: Object },

    /**
     * Controla la visibilidad del modal. Reactivo.
     * @type {Boolean}
     */
    open: { type: Boolean, reflect: true },

    /**
     * Estado de carga. Cuando es true, los botones quedan disabled
     * para evitar dobles envíos durante el POST /transfers.
     * @type {Boolean}
     */
    loading: { type: Boolean, reflect: true },
  };

  constructor() {
    super();
    this.transferData = null;
    this.open = false;
    this.loading = false;
  }

  static styles = styles;

  _handleAccept() {
    if (this.loading) return;
    this.dispatchEvent(new CustomEvent("confirm-accept", {
      detail: { transferData: this.transferData },
      bubbles: true,
      composed: true,
    }));
  }

  _handleCancel() {
    if (this.loading) return;
    this.dispatchEvent(new CustomEvent("confirm-cancel", {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <type-modal
        variant="dialog"
        ?open=${this.open}
        has-footer
      >
        <div slot="body">
          <transfer-summary
            .transferData=${this.transferData}
            amount-label="Monto a transferir"
          ></transfer-summary>
        </div>

        <div slot="footer" class="confirm-transfer-page__footer">
          <type-button
            text="Aceptar"
            variant="default"
            ?disabled=${this.loading}
            @click=${this._handleAccept}
          ></type-button>
          <type-button
            text="Volver"
            variant="secondary"
            ?disabled=${this.loading}
            @click=${this._handleCancel}
          ></type-button>
        </div>
      </type-modal>
    `;
  }
}

customElements.define("confirm-transfer-page", ConfirmTransferPage);

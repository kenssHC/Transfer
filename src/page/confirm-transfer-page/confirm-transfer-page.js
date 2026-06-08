/**
 * <confirm-transfer-page>
 * =============================================================================
 * Cambios respecto a la versión anterior:
 *   - Cambia de variant="dialog" a variant="page": ocupa pantalla completa
 *     con animación slide-up/slide-down, igual que new-transfer-page.
 *   - Se añadió slot "header" con botón "← Volver" y título de la page.
 *     El botón Volver despacha confirm-cancel (mismo evento que antes).
 *   - El footer ahora solo tiene el botón "Transferir" (antes "Aceptar").
 *     El botón "Volver" subió al header.
 *   - Se importa type-header para el título de la page.
 *
 * Contrato (controlled component, sin cambios):
 *   Props:
 *     - open (Boolean)         → el padre controla la visibilidad.
 *     - transferData (Object)  → datos del resumen a mostrar.
 *                                Ver TRANSFER_DATA_MOCK en src/mocks/transfer-data.js.
 *     - loading (Boolean)      → desactiva todos los botones durante el POST /transfers.
 *
 *   Eventos emitidos:
 *     - confirm-accept  → detail: { transferData }  (el usuario confirma)
 *     - confirm-cancel  → sin detail                (el usuario vuelve al formulario)
 * =============================================================================
 */

import { html, LitElement } from "lit";
import { styles } from "./confirm-transfer-page.css.js";
import "@compositions/type-modal/type-modal.js";
import "@compositions/type-header/type-header.js";
import "@compositions/type-button/type-button.js";
import "@compositions/transfer-summary/transfer-summary.js";

export class ConfirmTransferPage extends LitElement {
  static properties = {
    /**
     * Datos de la transferencia a confirmar.
     * Estructura: { amount, currency, sourceAccount, beneficiary }
     * Ver TRANSFER_DATA_MOCK en src/mocks/transfer-data.js.
     * @type {Object|null}
     */
    transferData: { type: Object },

    /**
     * Controla la visibilidad del modal. Reactivo. El padre lo maneja.
     * @type {Boolean}
     */
    open: { type: Boolean, reflect: true },

    /**
     * Cuando es true, todos los botones quedan disabled para evitar
     * dobles envíos mientras se procesa el POST /transfers.
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
        variant="page"
        ?open=${this.open}
        ?scrollable=${true}
        ?full-height=${true}
        ?has-footer=${true}
      >
        <div slot="header" class="confirm-transfer-page__header">
          <type-button
            class="confirm-transfer-page__back-btn"
            type="button"
            text="Volver"
            variant="secondary"
            icon-name="arrow-left"
            icon-position="left"
            ?disabled=${this.loading}
            @click=${this._handleCancel}
          ></type-button>
          <type-header
            .title=${"Confirmar transferencia"}
          ></type-header>
        </div>

        <div slot="body">
          <transfer-summary
            .transferData=${this.transferData}
            amount-label="Monto a transferir"
          ></transfer-summary>
        </div>

        <div slot="footer" class="confirm-transfer-page__footer">
          <type-button
            type="button"
            text="Transferir"
            icon-position="right"
            variant="default"
            ?disabled=${this.loading}
            @click=${this._handleAccept}
          ></type-button>
        </div>
      </type-modal>
    `;
  }
}

customElements.define("confirm-transfer-page", ConfirmTransferPage);

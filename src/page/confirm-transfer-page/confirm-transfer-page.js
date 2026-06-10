import { html, LitElement, nothing } from "lit";
import { styles } from "./confirm-transfer-page.css.js";
import "@compositions/type-modal/type-modal.js";
import "@compositions/type-header/type-header.js";
import "@compositions/type-button/type-button.js";
import "@compositions/transfer-summary/transfer-summary.js";
import "@pages/action-modal/action-modal.js";

/**
 * <confirm-transfer-page>
 *
 * Page-modal de confirmación de transferencia (Step 2 del flujo).
 * Muestra el resumen de la transferencia y permite confirmar o volver.
 *
 * Contrato (controlled component):
 *   Props:
 *     - open (Boolean)              → el padre controla la visibilidad.
 *     - transferData (Object)       → datos del resumen. Ver src/mocks/transfer-data.js.
 *     - transferStatus (String)     → estado que viene del padre: "" | "error" | "idle".
 *                                     Cuando llega "error", se muestra el action-modal.
 *
 *   Eventos emitidos:
 *     - confirm-accept  → detail: { transferData }  (usuario confirma)
 *     - confirm-cancel  → sin detail                (usuario vuelve o se superan 3 reintentos)
 *     - transfer-retry  → sin detail                (usuario pide reintentar la llamada al DM)
 */
export class ConfirmTransferPage extends LitElement {
  static properties = {
    transferData: { type: Object },
    open: { type: Boolean, reflect: true },
    /**
     * Estado de la transferencia pasado por el padre.
     * Cuando cambia a "error", esta page muestra el action-modal de reintento.
     * @type {String}
     */
    transferStatus: { type: String },
    _retryCount: { state: true },
    _actionModalOpen: { state: true },
    _actionType: { state: true },
  };

  constructor() {
    super();
    this.transferData = null;
    this.open = false;
    this.transferStatus = "";
    this._retryCount = 0;
    this._actionModalOpen = false;
    this._actionType = "";
  }

  static styles = styles;

  willUpdate(changedProperties) {
    if (!changedProperties.has("transferStatus")) return;
    if (this.transferStatus === "error") {
      this._handleTransferError();
    }
  }

  // =========================================================================
  // MANEJO DE ERRORES (patrón idéntico a accounts-page)
  // =========================================================================

  _handleTransferError() {
    this._retryCount += 1;
    if (this._retryCount >= 3) {
      this._retryCount = 0;
      this._dispatchCancel();
      return;
    }
    this._showActionModal("transferError");
  }

  _showActionModal(actionType) {
    this._actionType = actionType;
    this._actionModalOpen = true;
  }

  _closeActionModal() {
    this._actionModalOpen = false;
    this._actionType = "";
  }

  _handleActionModalAction(e) {
    const { buttonAction } = e.detail;
    this._closeActionModal();
    if (buttonAction === "retry") {
      this._requestRetry();
    }
  }

  _requestRetry() {
    this.dispatchEvent(new CustomEvent("transfer-retry", {
      bubbles: true,
      composed: true,
    }));
  }

  // =========================================================================
  // HANDLERS DE BOTONES PRINCIPALES
  // =========================================================================

  _handleAccept() {
    this.dispatchEvent(new CustomEvent("confirm-accept", {
      detail: { transferData: this.transferData },
      bubbles: true,
      composed: true,
    }));
  }

  _handleCancel() {
    this._dispatchCancel();
  }

  _dispatchCancel() {
    this.dispatchEvent(new CustomEvent("confirm-cancel", {
      bubbles: true,
      composed: true,
    }));
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  _renderActionModal() {
    return html`
      <action-modal
        action-type=${this._actionType}
        @action-modal-action=${this._handleActionModalAction}
      ></action-modal>
    `;
  }

  _renderContent() {
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
            @click=${this._handleAccept}
          ></type-button>
        </div>
      </type-modal>

      ${this._actionModalOpen ? this._renderActionModal() : nothing}
    `;
  }

  render() {
    return html`${this._renderContent()}`;
  }
}

customElements.define("confirm-transfer-page", ConfirmTransferPage);

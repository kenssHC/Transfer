import { html, LitElement } from "lit";
import styles from "./confirm-transfer-page-harness.css.js";
import "@pages/confirm-transfer-page/confirm-transfer-page.js";
import { TRANSFER_DATA_MOCK } from "@services/mocks/transfer-data.js";

/**
 * Harness mínimo para iterar visualmente la <confirm-transfer-page>.
 * NO es una demo elaborada: es el "scaffolding" de desarrollo mientras
 * no exista el store global ni la orquestación de la feature root.
 *
 * Expone:
 *   - Botón para abrir la page.
 *   - Botón para simular `loading=true` (Aceptar/Volver disabled).
 *   - Log de eventos para confirmar que confirm-accept y confirm-cancel
 *     se emiten con el detail correcto.
 */
export class ConfirmTransferPageHarness extends LitElement {
  static properties = {
    _open: { type: Boolean, state: true },
    _loading: { type: Boolean, state: true },
    _log: { type: String, state: true },
  };

  constructor() {
    super();
    this._open = false;
    this._loading = false;
    this._log = "Sin eventos. Abre la page y prueba los botones.";
  }

  static get styles() {
    return styles;
  }

  _setLog(line) {
    const stamp = new Date().toLocaleTimeString();
    this._log = `[${stamp}] ${line}`;
  }

  _openPage() {
    this._open = true;
  }

  _toggleLoading() {
    this._loading = !this._loading;
    this._setLog(`loading = ${this._loading}`);
  }

  _onAccept(e) {
    this._setLog(`confirm-accept → ${JSON.stringify(e.detail.transferData)}`);
    this._open = false;
  }

  _onCancel() {
    this._setLog("confirm-cancel");
    this._open = false;
  }

  render() {
    return html`
      <h1>Harness · confirm-transfer-page</h1>
      <p class="subtitle">
        Usa el mock <code>TRANSFER_DATA_MOCK</code> para iterar la page.
      </p>

      <button class="open-btn" @click=${this._openPage}>
        Abrir confirm-transfer-page
      </button>

      <button class="toggle-btn" @click=${this._toggleLoading}>
        ${this._loading
          ? "Quitar loading (habilitar botones)"
          : "Simular loading (Aceptar/Volver disabled)"}
      </button>

      <pre class="log">${this._log}</pre>

      <confirm-transfer-page
        ?open=${this._open}
        ?loading=${this._loading}
        .transferData=${TRANSFER_DATA_MOCK}
        @confirm-accept=${this._onAccept}
        @confirm-cancel=${this._onCancel}
      ></confirm-transfer-page>
    `;
  }
}

customElements.define("confirm-transfer-page-harness", ConfirmTransferPageHarness);

/**
 * MyElement — Orquestador raíz de la feature banking-transfer-pe.
 *
 * Cambios respecto a la versión anterior:
 *   - Se añadió step 2: confirm-transfer-page.
 *     El flujo completo ahora es:
 *       step 0 → accounts-page        (selección de cuenta origen)
 *       step 1 → new-transfer-page    (formulario de transferencia)
 *       step 2 → confirm-transfer-page (confirmación antes del POST)
 *       step 3 → successful-transfer-page (comprobante)
 *   - Se añadió la propiedad _transferData para transportar los datos del
 *     formulario entre new-transfer-page y confirm-transfer-page sin pasar
 *     por el DM antes de tiempo.
 *   - Se añaden los handlers: _handleConfirmRequested, _handleConfirmAccept,
 *     _handleConfirmCancel.
 *   - _handleDataSuccess ahora avanza a step 3 (antes era step 2).
 *   - new-transfer-page ya no escucha @form-submit (ese evento va al form
 *     interno). Escucha @confirm-requested, que new-transfer-page emite
 *     cuando los datos están listos y validados.
 */

import { LitElement, css, html, nothing } from "lit";
import "./components/type-icon/type-icon.js";
import "./components/type-text/type-text";
import "./compositions/info-card/info-card";
import "./compositions/type-input/type-input";
import "./compositions/type-header/type-header.js";
import "./page/new-transfer-page/new-transfer-page.js";
import "./page/accounts-page/AccountsPage.js";
import "@DM/entelgy-global-transfers-api-dm/entelgy-global-transfers-api-dm.js";
import "@pages/successful-transfer-page/successful-transfer-page.js";
import "@pages/confirm-transfer-page/confirm-transfer-page.js";
import locales from "@locales/locales.json";

const ALLOWED_LANGUAGES = ["es_LA"];

export class MyElement extends LitElement {
  static properties = {
    step: {
      type: Number,
    },

    accountCustomer: {
      type: Object,
    },

    /**
     * Datos del formulario normalizados al contrato unificado.
     * Los produce new-transfer-page vía @confirm-requested y los
     * consume confirm-transfer-page. Al aceptar se envían al DM.
     * @type {Object|null}
     */
    _transferData: { type: Object },

    lang: { type: String },
    current: { type: String },
    amount: { type: String },
    transactionNumber: { type: String },
    time: { type: String },
    date: { type: String },
    originAccount: { type: String },
    originAccountNumber: { type: String },
    beneficiaryName: { type: String },
    beneficiaryLastName: { type: String },
    concept: { type: String },
    status: { type: String },
    isDataReady: { type: Boolean },
  };

  constructor() {
    super();
    this.step = 0;
    this.accountCustomer = {};
    this._transferData = null;
    this.lang = "";
    this.current = "";
    this.amount = "";
    this.transactionNumber = "";
    this.time = "";
    this.date = "";
    this.originAccount = "";
    this.originAccountNumber = "";
    this.beneficiaryName = "";
    this.beneficiaryLastName = "";
    this.concept = "";
    this.status = "";
    this.isDataReady = false;
  }

  // =========================================================================
  // HANDLERS DE NAVEGACIÓN
  // =========================================================================

  /** step 0 → 1: el usuario seleccionó su cuenta origen. */
  getAccountCustomer(event) {
    this.accountCustomer = event.detail;
    this.step = 1;
    console.log("accountCustomer", this.accountCustomer);
  }

  /**
   * step 1 → 2: new-transfer-page terminó de validar y resolvió la cuenta
   * destino. Guarda el transferData normalizado y muestra la confirmación.
   */
  _handleConfirmRequested(event) {
    this._transferData = event.detail;
    this.step = 2;
  }

  /**
   * step 2 → 3 (vía DM): el usuario aceptó en confirm-transfer-page.
   * Llama al Data Manager para ejecutar la transferencia.
   */
  async _handleConfirmAccept(event) {
    const transferDm = this.shadowRoot.getElementById("transfers");
    const transferData = event.detail?.transferData ?? {};
    if (transferDm) {
      await transferDm.executeTransfer(transferData);
    }
  }

  /**
   * step 2 → 1: el usuario presionó "Volver" en confirm-transfer-page.
   * Regresa al formulario manteniendo los datos de accountCustomer.
   */
  _handleConfirmCancel() {
    this.step = 1;
  }

  /** Respuesta exitosa del DM → paso a step 3 (successful-transfer-page). */
  _handleDataSuccess(event) {
    const data = event.detail;
    this.current = data.current;
    this.amount = data.amount;
    this.transactionNumber = data.transactionNumber;
    this.date = data.date;
    this.time = data.time;
    this.originAccount = data.originAccount;
    this.originAccountNumber = data.originAccountNumber;
    this.beneficiaryName = data.beneficiaryName;
    this.beneficiaryLastName = data.beneficiaryLastName;
    this.concept = data.concept;
    this.status = data.status;
    this.isDataReady = true;
    // step 3 (antes era 2 — se desplazó porque se insertó confirm en step 2)
    this.step = 3;
  }

  _handleError(event) {
    console.error("Error cargando los datos de la transferencia", event);
    this.isDataReady = true;
  }

  _updateStep(event) {
    this.step = event.detail;
  }

  get locale() {
    return locales[this.lang];
  }

  // =========================================================================
  // RENDERS POR STEP
  // =========================================================================

  _renderAcountsPage() {
    return html`<accounts-page
      @account=${this.getAccountCustomer}
    ></accounts-page>`;
  }

  /**
   * new-transfer-page escucha @confirm-requested (no @form-submit) porque
   * el formulario valida y llama al API de cuenta destino internamente antes
   * de emitir los datos normalizados listos para confirmar.
   */
  _renderNewTransferPage() {
    return html`<new-transfer-page
      .accountCustomer=${this.accountCustomer}
      @confirm-requested=${this._handleConfirmRequested}
      @return-page=${this._updateStep}
    ></new-transfer-page>`;
  }

  /** confirm-transfer-page actúa como puerta antes de enviar al DM. */
  _renderConfirmTransferPage() {
    return html`<confirm-transfer-page
      ?open=${true}
      .transferData=${this._transferData}
      @confirm-accept=${this._handleConfirmAccept}
      @confirm-cancel=${this._handleConfirmCancel}
    ></confirm-transfer-page>`;
  }

  _renderSuccessfulTransferPage() {
    return html` <successful-transfer-page
      .locale=${this.locale}
      .current=${this.current}
      .amount=${this.amount}
      .transactionNumber=${this.transactionNumber}
      .time=${this.time}
      .date=${this.date}
      .originAccount=${this.originAccount}
      .originAccountNumber=${this.originAccountNumber}
      .beneficiaryName=${this.beneficiaryName}
      .beneficiaryLastName=${this.beneficiaryLastName}
      .concept=${this.concept}
      .status=${this.status}
      .isDataReady=${this.isDataReady}
      .isOpen=${this.isDataReady}
      @return-home=${this._updateStep}
    ></successful-transfer-page>`;
  }

  _renderStep(page) {
    const steps = {
      0: this._renderAcountsPage(),
      1: this._renderNewTransferPage(),
      2: this._renderConfirmTransferPage(),
      3: this._renderSuccessfulTransferPage(),
    };
    return steps[page] ?? nothing;
  }

  render() {
    return html`
      ${this._renderStep(this.step)}
      <entelgy-global-transfers-api-dm
        id="transfers"
        @transfer-api-dm-create=${this._handleDataSuccess}
        @transfer-api-dm-fetch-error=${this._handleError}
      >
      </entelgy-global-transfers-api-dm>
    `;
  }
}
window.customElements.define("my-element", MyElement);

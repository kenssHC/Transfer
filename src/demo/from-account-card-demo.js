import { html, LitElement } from "lit";
import styles from "./from-account-card-demo.css.js";
import "../page/new-transfer-page/compositions/from-account-card/from-account-card.js";

/**
 * Demo visual de <from-account-card>.
 * Cubre los 6 casos relevantes del contrato:
 *   1. Cuenta normal en USD.
 *   2. Cuenta en PEN (moneda local).
 *   3. Cuenta con saldo en 0.
 *   4. Cuenta con moneda no mapeada (EUR) - debe mostrar "EUR" tal cual.
 *   5. Account null - debe mostrar placeholder "Sin cuenta".
 *   6. Saldo muy alto - validar separadores de miles.
 */
export class FromAccountCardDemo extends LitElement {

  static get styles() {
    return styles;
  }

  render() {
    return html`
      <h1>Demo · from-account-card</h1>
      <p class="subtitle">
        Tarjeta "Desde" del formulario. Solo display, sin eventos.
      </p>

      <section class="case">
        <p class="case-title">1. Cuenta normal (USD)</p>
        <from-account-card
          .account=${{
            accountName: "Cuenta de Ahorros",
            accountNumber: "56785678",
            accountType: "Ahorros",
            availableBalance: 12800.50,
            currency: "USD",
          }}
        ></from-account-card>
      </section>

      <section class="case">
        <p class="case-title">2. Cuenta en PEN</p>
        <from-account-card
          .account=${{
            accountName: "Cuenta Nómina",
            accountNumber: "90129012",
            accountType: "Nómina",
            availableBalance: 3420.75,
            currency: "PEN",
          }}
        ></from-account-card>
      </section>

      <section class="case">
        <p class="case-title">3. Cuenta con saldo en 0</p>
        <from-account-card
          .account=${{
            accountName: "Cuenta Corriente",
            accountNumber: "12341234",
            accountType: "Corriente",
            availableBalance: 0,
            currency: "USD",
          }}
        ></from-account-card>
      </section>

      <section class="case">
        <p class="case-title">4. Moneda desconocida (EUR)</p>
        <from-account-card
          .account=${{
            accountName: "Cuenta Internacional",
            accountNumber: "11112222",
            accountType: "Corriente",
            availableBalance: 5000.5,
            currency: "EUR",
          }}
        ></from-account-card>
      </section>

      <section class="case">
        <p class="case-title">5. Account null (placeholder)</p>
        <from-account-card></from-account-card>
      </section>

      <section class="case">
        <p class="case-title">6. Saldo alto (separadores de miles)</p>
        <from-account-card
          .account=${{
            accountName: "Cuenta VIP",
            accountNumber: "99998888",
            accountType: "Premium",
            availableBalance: 1234567.89,
            currency: "USD",
          }}
        ></from-account-card>
      </section>
    `;
  }
}

customElements.define("from-account-card-demo", FromAccountCardDemo);

/**
 * Estilos de <confirm-transfer-page>
 *
 * Cambio: se añadió el layout del header (botón Volver + título apilados
 * verticalmente), consistente con new-transfer-page.
 */

import { css } from "lit";

export const styles = css`
  :host {
    /* display:contents hace al host transparente en el layout para que la 
       page no añada un wrapper extra al layout.
       El <type-modal> interno ya maneja position:fixed y backdrop es lo 
       que define el espacio visual. */
    display: contents;
  }

  /* Header: botón Volver arriba, título debajo */
  .confirm-transfer-page__header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  /* Footer: botón "Transferir" centrado a ancho completo */
  .confirm-transfer-page__footer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .confirm-transfer-page__back-btn {
    width: min-content;
    display: block;
  }
`;

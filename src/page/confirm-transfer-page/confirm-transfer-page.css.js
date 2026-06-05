import { css } from "lit";

export const styles = css`
  :host {
    /* display:contents para que la page no añada un wrapper extra al layout.
       El <type-modal> interno ya maneja position:fixed y backdrop. */
    display: contents;
  }

  .confirm-transfer-page__footer {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
`;

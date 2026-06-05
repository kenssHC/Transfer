import { css } from "lit";

export default css`
  :host {
    display: block;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    padding: 2rem 1.5rem;
    max-width: 480px;
    margin: 0 auto;
    color: #121212;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0 0 0.25rem 0;
  }

  .subtitle {
    color: #565656;
    margin: 0 0 2rem 0;
    font-size: 0.95rem;
  }

  .case {
    margin-bottom: 1.5rem;
  }

  .case-title {
    font-size: 0.8rem;
    color: #565656;
    margin: 0 0 0.5rem 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
`;

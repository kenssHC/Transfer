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
    margin: 0 0 1.5rem 0;
    font-size: 0.95rem;
  }

  button {
    display: block;
    width: 100%;
    padding: 1rem;
    margin-bottom: 0.75rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .open-btn {
    background-color: #4f38fb;
    color: #ffffff;
  }

  .toggle-btn {
    background-color: #dadadaff;
    color: #000000;
  }

  .log {
    margin: 1rem 0 0 0;
    padding: 0.75rem 1rem;
    background-color: #f4f5f7;
    border-radius: 0.5rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.85rem;
    color: #565656;
    white-space: pre-wrap;
    min-height: 2.5rem;
  }
`;

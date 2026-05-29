/**
 * Estilos de <type-modal>
 * =============================================================================
 * Estrategia:
 *   - Todo se construye con CSS Custom Properties (--type-modal-*) que el
 *     consumidor puede sobrescribir desde el padre. Así un equipo puede
 *     cambiar colores/tamaños sin tocar este archivo.
 *   - Las DIFERENCIAS entre variants se aplican con selectores de atributo
 *     :host([variant="..."]). Esto funciona porque en type-modal.js declaramos
 *     variant: { type: String, reflect: true } -> la prop se refleja al
 *     atributo HTML y el CSS la "lee".
 *   - Las ANIMACIONES son entrada-only (slide-up para page, fade para dialog).
 *     No animamos la salida porque al cerrar usamos 'nothing' y el componente
 *     se desmonta inmediatamente. Si en el futuro queremos animar la salida,
 *     habría que diferir el desmontado.
 * =============================================================================
 */

import { css } from "lit";

export default css`
    /* -------------------------------------------------------------------------
     * 1. Variables CSS por defecto (las del variant="page" / default)
     * -------------------------------------------------------------------------
     * :host es el propio elemento type-modal. Definir variables aquí las hace
     * accesibles a todo el shadow DOM interno y sobrescribibles desde fuera.
     * ------------------------------------------------------------------------- */
    :host {
        --type-modal-bg-color: #ffffff;
        --type-modal-backdrop-color: rgba(0, 0, 0, 0.5);
        --type-modal-width: 100%;
        --type-modal-max-width: 100%;
        --type-modal-min-width: auto;
        --type-modal-border-radius: 0;
        --type-modal-padding: 1.5rem;
        --type-modal-gap: 1rem;
        --type-modal-z-index: 1000;
    }

    /* Overrides cuando variant="dialog": modal centrado, más pequeño y con
       esquinas redondeadas. */
    :host([variant="dialog"]) {
        --type-modal-width: auto;
        --type-modal-max-width: 400px;
        --type-modal-border-radius: 1rem;
        --type-modal-padding: 1.5rem;
    }

    /* -------------------------------------------------------------------------
     * 2. Estado cerrado: el host no ocupa espacio
     * -------------------------------------------------------------------------
     * Aunque cuando open=false el render() devuelve 'nothing' y no hay DOM
     * interno, el propio elemento type-modal sigue existiendo como nodo del
     * DOM. Con display:none evitamos que reserve espacio en el layout.
     * ------------------------------------------------------------------------- */
    :host(:not([open])) {
        display: none;
    }

    /* -------------------------------------------------------------------------
     * 3. Backdrop (overlay oscuro a pantalla completa)
     * -------------------------------------------------------------------------
     * position:fixed + inset:0 lo pega a las 4 esquinas del viewport, sin
     * importar dónde esté el componente en el árbol DOM.
     * flex centra el contenido (modificado por variant más abajo).
     * z-index alto para quedar por encima del resto de la app.
     * ------------------------------------------------------------------------- */
    .type-modal-backdrop {
        position: fixed;
        inset: 0;
        background-color: var(--type-modal-backdrop-color);
        z-index: var(--type-modal-z-index);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: type-modal-backdrop-in 200ms ease-out;
    }

    /* En variant="page": el contenido ocupa todo el viewport.
       'stretch' en ambos ejes del flex hace que el hijo crezca a 100%. */
    :host([variant="page"]) .type-modal-backdrop {
        align-items: stretch;
        justify-content: stretch;
    }

    /* -------------------------------------------------------------------------
     * 4. Contenido del modal (la "caja blanca" central)
     * -------------------------------------------------------------------------
     * flex-direction:column apila header -> body -> footer.
     * box-sizing:border-box hace que padding NO sume al width/height (clave
     * cuando width=100%, para que no desborde el viewport).
     * outline:none quita el outline azul del navegador en focus (manejamos
     * accesibilidad con focus trap propio).
     * ------------------------------------------------------------------------- */
    .type-modal-content {
        background-color: var(--type-modal-bg-color);
        width: var(--type-modal-width);
        max-width: var(--type-modal-max-width);
        min-width: var(--type-modal-min-width);
        border-radius: var(--type-modal-border-radius);
        padding: var(--type-modal-padding);
        display: flex;
        flex-direction: column;
        gap: var(--type-modal-gap);
        outline: none;
        box-sizing: border-box;
    }

    /* -------------------------------------------------------------------------
     * 5. Sobreescrituras específicas por variant
     * -------------------------------------------------------------------------
     * Usamos 100dvh en vez de 100vh para que en mobile (donde la barra de URL
     * aparece/desaparece) el modal SIEMPRE ocupe el viewport real visible.
     * dvh = Dynamic Viewport Height. Soporte: iOS Safari 15.4+, Chrome 108+.
     * ------------------------------------------------------------------------- */
    :host([variant="page"]) .type-modal-content {
        width: 100%;
        max-width: 100%;
        height: 100dvh;
        border-radius: 0;
        animation: type-modal-slide-up 250ms ease-out;
    }

    :host([variant="dialog"]) .type-modal-content {
        /* 90dvh deja un margen de respiro arriba/abajo en mobile.
           El body se vuelve scrolleable si lo necesita (ver scrollable abajo). */
        max-height: 90dvh;
        animation: type-modal-fade-in 200ms ease-out;
    }

    /* Override opcional: el consumidor puede forzar alto completo en dialogs.
       Para variant="page" no es necesario porque ya tiene 100dvh. */
    :host([full-height]) .type-modal-content {
        height: 100dvh;
    }

    /* -------------------------------------------------------------------------
     * 6. Scroll interno del body
     * -------------------------------------------------------------------------
     * Cuando scrollable=true, el body crece y se vuelve scrolleable, mientras
     * header y footer se quedan fijos arriba y abajo (no scrollean).
     *
     * min-height:0 es un truco clásico de flexbox: por defecto los hijos tienen
     * min-height igual a su contenido, lo que les impide encoger. Poniéndolo a
     * 0 permitimos que el body respete su contenedor y aparezca el scroll en
     * vez de desbordarse.
     * ------------------------------------------------------------------------- */
    :host([scrollable]) .type-modal-body {
        overflow-y: auto;
        flex: 1 1 auto;
        min-height: 0;
    }

    /* Header y footer NO crecen ni encogen: se ajustan a su contenido.
       Esto evita que "roben" altura al body. */
    .type-modal-header,
    .type-modal-footer {
        flex: 0 0 auto;
    }

    /* Body por defecto crece para ocupar el espacio restante. */
    .type-modal-body {
        flex: 1 1 auto;
        min-height: 0;
    }

    /* -------------------------------------------------------------------------
     * 7. Animaciones (M1 del chat)
     * -------------------------------------------------------------------------
     * - backdrop-in: el fondo oscuro hace fade-in suave.
     * - fade-in: dialogs aparecen con fade + leve scale (sensación de "pop").
     * - slide-up: page-modales suben desde abajo (estándar mobile native).
     * ------------------------------------------------------------------------- */
    @keyframes type-modal-backdrop-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes type-modal-fade-in {
        from {
            opacity: 0;
            transform: scale(0.96);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }

    @keyframes type-modal-slide-up {
        from {
            transform: translateY(100%);
        }
        to {
            transform: translateY(0);
        }
    }

    /* -------------------------------------------------------------------------
     * 8. Accesibilidad: respetar "menos movimiento"
     * -------------------------------------------------------------------------
     * Usuarios con sensibilidad al movimiento pueden activar esta preferencia
     * en el sistema operativo. Cumplir esto es buena práctica (WCAG 2.3.3).
     * ------------------------------------------------------------------------- */
    @media (prefers-reduced-motion: reduce) {
        .type-modal-backdrop,
        .type-modal-content {
            animation: none;
        }
    }
`;

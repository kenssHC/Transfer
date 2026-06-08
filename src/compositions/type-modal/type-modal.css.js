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
 * 
 * Cambios respecto a la versión anterior:
 *   - Se eliminaron los valores hardcodeados del bloque :host (colores, padding,
 *     etc.). Ahora se consumen únicamente con var(--type-modal-*). Los valores
 *     por defecto viven en index.css (:root) para que sea la única fuente de
 *     verdad de tokens globales.
 *   - Se eliminó :host(:not([open])) { display:none }. El JS ya maneja el
 *     desmontado (render devuelve nothing). Con display:block el host no
 *     reserva espacio cuando el shadow DOM está vacío.
 *   - Se añadieron animaciones de SALIDA (slide-down y fade-out) activadas
 *     por las clases --closing que el JS aplica mientras _closing=true.
 * =============================================================================
 */

import { css } from "lit";

export default css`
    /* -------------------------------------------------------------------------
     * 1. Host baseline
     * -------------------------------------------------------------------------
     * display:block es necesario para que el host no sea inline (default de
     * custom elements) y el backdrop con position:fixed funcione correctamente.
     *
     * Los valores de las CSS custom properties vienen heredados de :root en
     * index.css. No se definen aquí para evitar duplicidad y conflictos.
     * El bloque :host([variant="dialog"]) sí los sobreescribe porque son
     * variaciones propias de este componente, no tokens globales.
     * ------------------------------------------------------------------------- */
    :host {
        display: block;
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
     * 2. Backdrop (overlay oscuro a pantalla completa)
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
     * flex-direction:column apila header → body → footer.
     * box-sizing:border-box evita que el padding desborde el viewport.
     * outline:none quita el foco visible del navegador (manejamos accesibilidad
     * con _focusFirst en el JS).
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
     * 4. Overrides/Sobreescrituras específicos por variant
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
     * 5. Scroll interno del body
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
     * 6. Animaciones de ENTRADA
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
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
    }

    /* -------------------------------------------------------------------------
     * 7. Animaciones de SALIDA
     * -------------------------------------------------------------------------
     * Las clases --closing las aplica type-modal.js cuando _closing=true.
     * El DOM se mantiene montado mientras la animación corre y se desmonta
     * cuando animationend dispara (o tras el fallback de 300 ms).
     *
     * forwards en animation-fill-mode mantiene el estado final visible hasta
     * que el JS desmonta el DOM, evitando un flash de vuelta al estado inicial.
     * pointer-events:none en el backdrop durante el cierre evita interacciones
     * accidentales mientras la animación corre.
     * ------------------------------------------------------------------------- */
    :host([variant="page"]) .type-modal-content--closing {
        animation: type-modal-slide-down 250ms ease-in forwards;
    }

    :host([variant="dialog"]) .type-modal-content--closing {
        animation: type-modal-fade-out 200ms ease-in forwards;
    }

    .type-modal-backdrop--closing {
        animation: type-modal-backdrop-out 250ms ease-in forwards;
        pointer-events: none;
    }

    @keyframes type-modal-slide-down {
        from { transform: translateY(0); }
        to   { transform: translateY(100%); }
    }

    @keyframes type-modal-fade-out {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.96);
        }
    }

    @keyframes type-modal-backdrop-out {
        from { opacity: 1; }
        to   { opacity: 0; }
    }

    /* -------------------------------------------------------------------------
     * 8. Accesibilidad: respetar "menos movimiento"
     * -------------------------------------------------------------------------
     * Usuarios con sensibilidad al movimiento pueden activar esta preferencia.
     * Cumplir esto es buena práctica (WCAG 2.3.3).
     * Al desactivar las animaciones, animationend no se dispara, por eso en el
     * JS existe un fallback de 300 ms que limpia igualmente en ese caso.
     * ------------------------------------------------------------------------- */
    @media (prefers-reduced-motion: reduce) {
        .type-modal-backdrop,
        .type-modal-content,
        .type-modal-backdrop--closing,
        .type-modal-content--closing {
            animation: none;
        }
    }
`;

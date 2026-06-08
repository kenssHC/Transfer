/**
 * <type-modal>
 * =============================================================================
 * Composition base reutilizable para TODAS las pages y dialogs de la feature.
 *
 * Idea central: separar "soy un modal" (este componente) de "qué contenido
 * tiene el modal" (lo decide quien lo usa, vía slots). Así el mismo
 * <type-modal> sirve para:
 *   - Page-modales grandes a pantalla completa (transfer-page, new-transfer-page,
 *     confirm-transfer-page, successful-transfer-page).
 *   - Dialog-modales pequeños centrados (errores, avisos, "cuenta bloqueada"...).
 *
 * * Cambios respecto a la versión anterior:
 *   - Se eliminó el focus trap (rebote Tab entre primer/último elemento).
 *     Se conserva _focusFirst (mueve el foco al primer elemento al abrir)
 *     y la restitución de foco al cerrar (accesibilidad básica).
 *   - Se añadió animación de CIERRE mediante la prop interna _closing.
 *     Cuando open pasa a false, el DOM permanece visible el tiempo que
 *     dure la animación (slide-down para "page", fade-out para "dialog")
 *     y luego se desmonta. Esto evita el desmontado abrupto sin animación.
 *   - Los colores y variables del :host se eliminaron de aquí; ahora son
 *     responsabilidad exclusiva de index.css (:root). type-modal solo
 *     los consume con var(--type-modal-*).
 * 
 * Contrato público:
 *   Atributos / props:
 *     - open (Boolean, reflect)         → controla la visibilidad.
 *     - variant ("page" | "dialog")     → tamaño, animación y layout.
 *     - scrollable (Boolean)            → permite scroll interno en el body.
 *     - full-height (Boolean)           → fuerza alto 100dvh.
 *     - has-footer (Boolean)            → habilita el slot footer.
 *
 *   Slots:
 *     - header                          → arriba (botón volver, X, título...).
 *     - body                            → contenido principal.
 *     - footer                          → abajo (botones de acción).
 *
 *   Eventos:
 *     - (No emite eventos propios)      → el componente es "controlled". El
 *                                         padre decide cuándo cerrarlo poniendo
 *                                         open=false. Esto evita estados
 *                                         duplicados entre padre e hijo.
 *
 *   CSS Custom Properties (override desde el padre):
 *     --type-modal-bg-color, --type-modal-backdrop-color,
 *     --type-modal-width, --type-modal-max-width, --type-modal-min-width,
 *     --type-modal-border-radius, --type-modal-padding, --type-modal-gap,
 *     --type-modal-z-index.
 * =============================================================================
 */

import { LitElement, html, nothing } from "lit";
import { classMap } from "lit/directives/class-map.js";
import styles from "./type-modal.css.js";

export class TypeModal extends LitElement {

    /**
     * Declara las propiedades reactivas de Lit. Cuando cambian, el componente
     * se re-renderiza automáticamente.
     *
     * `reflect: true` significa que el cambio de la propiedad también actualiza
     * el atributo HTML correspondiente. Esto nos permite estilar con selectores
     * de atributo como :host([variant="page"]) o :host([open]) desde el CSS.
     *
     * `attribute: "full-height"` mapea la prop camelCase `fullHeight` al
     * atributo HTML kebab-case `full-height` (que es la convención HTML).
     */
    static properties = {
        open: { type: Boolean, reflect: true },
        variant: { type: String, reflect: true },
        scrollable: { type: Boolean, reflect: true },
        fullHeight: { type: Boolean, reflect: true, attribute: "full-height" },
        hasFooter: { type: Boolean, reflect: true, attribute: "has-footer" },

        /**
         * Estado interno que mantiene el DOM visible durante la animación de
         * cierre. Cuando open pasa a false, _closing se pone en true mientras
         * la animación CSS corre; al terminar, se pone en false y el DOM se
         * desmonta. No se refleja como atributo porque es un detalle interno.
         */
        _closing: { state: true },
    };

    constructor() {
        super();
        this.open = false;
        this.variant = "page";
        this.scrollable = false;
        this.fullHeight = false;
        this.hasFooter = false;

        this._closing = false;

        /**
         * Elemento que tenía el foco antes de abrir el modal.
         * Se restaura al cerrar para no perder el contexto de navegación
         * del usuario (requisito de accesibilidad WCAG 2.1 - 2.4.3).
         */
        this._previousActiveElement = null;

        /**
         * Función que cancela una animación de cierre en curso.
         * Se usa cuando open vuelve a true antes de que termine la animación
         * de salida, evitando que el scroll se desbloquee innecesariamente.
         */
        this._abortClose = null;

        /**
         * Bandera local: ¿esta instancia tiene activo el lock de scroll del body?
         * Evita desbloquear el body más de una vez si el componente se destruye
         * o cambia de open varias veces seguidas.
         */
        this._bodyScrollLocked = false;
    }

    static get styles() {
        return styles;
    }

    /**
     * Lifecycle de Lit: se ejecuta cada vez que termina un render.
     * `changedProps` es un Map con las props que cambiaron y sus valores previos.
     * Reacciona a cambios de la prop `open` para activar/desactivar efectos
     * (scroll lock, foco, animaciones).
     *
     * Aquí detectamos las transiciones de `open` para activar/desactivar
     * los side-effects (scroll lock, focus, listeners de teclado).
     *
     * ¿Por qué no usar `firstUpdated` o el constructor?
     *   - El constructor corre antes de que el DOM exista → no podemos enfocar.
     *   - `firstUpdated` solo corre 1 vez → no detectaría cambios posteriores.
     *   - `updated` corre en cada cambio → perfecto para reaccionar a `open`.
    * La condición `changedProps.get("open") === true` detecta la transición
     * open:true → open:false (el Map guarda el VALOR ANTERIOR). Esto evita
     * llamar a _onClose en el primer render cuando open ya era false.
     */
    updated(changedProps) {
        if (!changedProps.has("open")) return;

        if (this.open) {
            this._onOpen();
        } else if (changedProps.get("open") === true) {
            // Solo llamamos a _onClose si ANTES estaba abierto. Evita disparar
            // limpieza en el primer render cuando open ya era false desde el inicio.
            this._onClose();
        }
    }

    /**
     * Lifecycle de Lit: se ejecuta cuando el componente se remueve del DOM.
     * Limpieza defensiva: si el modal se destruye mientras está abierto,
     * desbloqueamos el scroll del body y removemos el listener de teclado.
     * Sin esto, el body podría quedar con overflow:hidden para siempre.
     * 
     * Limpieza defensiva para que el body no quede con overflow:hidden
     * si el modal se destruye mientras estaba abierto o cerrándose.
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        if (this._abortClose) {
            this._abortClose();
            this._abortClose = null;
        }
        if (this._bodyScrollLocked) {
            TypeModal._unlockBodyScroll();
            this._bodyScrollLocked = false;
        }
        this._closing = false;
    }

    // =========================================================================
    // APERTURA / CIERRE
    // =========================================================================

    /**
     * Side-effects al ABRIR el modal:
     *   1. Bloquea el scroll del <body> (M2 del chat).
     *   2. Guarda el elemento que tenía el foco (para devolverlo al cerrar).
     *   3. Espera al render y mueve el foco al primer elemento focusable
     *      dentro del modal (mejor accesibilidad).
     * 
     * Side-effects al ABRIR el modal.
     * Si había una animación de cierre en curso, la cancelamos primero para
     * no desbloquear el scroll ni restaurar el foco innecesariamente.
     */
    _onOpen() {
        if (this._abortClose) {
            // Cancelamos el cierre en curso: el scroll ya estaba bloqueado
            // por la apertura anterior, no hace falta re-bloquearlo.
            this._abortClose();
            this._abortClose = null;
            this._closing = false;
            this.updateComplete.then(() => this._focusFirst());
            return;
        }

        TypeModal._lockBodyScroll();
        this._bodyScrollLocked = true;
        this._previousActiveElement = document.activeElement;
        this.updateComplete.then(() => this._focusFirst());
    }

    /**
     * Side-effects al CERRAR el modal.
     * En lugar de desmontar el DOM inmediatamente, se activa _closing=true
     * para que el CSS pueda correr la animación de salida. Cuando termina
     * (o tras un fallback de 300 ms para prefers-reduced-motion), se llama
     * a _cleanupAfterClose para desbloquear el scroll y desmontar el DOM.
     */
    _onClose() {
        this._closing = true;

        let aborted = false;
        this._abortClose = () => { aborted = true; };

        this.updateComplete.then(() => {
            if (aborted) return;

            const content = this.renderRoot.querySelector(".type-modal-content");
            if (!content) {
                if (!aborted) this._cleanupAfterClose();
                return;
            }

            // Fallback para cuando animation:none (prefers-reduced-motion o en tests).
            // Si animationend no se dispara, limpiamos igualmente en 300 ms.
            const fallback = setTimeout(() => {
                if (!aborted) this._cleanupAfterClose();
            }, 300);

            const handleAnimationEnd = () => {
                clearTimeout(fallback);
                content.removeEventListener("animationend", handleAnimationEnd);
                if (!aborted) this._cleanupAfterClose();
            };

            content.addEventListener("animationend", handleAnimationEnd);
        });
    }

    /**
     * Limpieza final tras completarse la animación de cierre.
     * Desmonta el DOM (poniendo _closing=false), libera el scroll del body
     * y devuelve el foco al elemento anterior.
     */
    _cleanupAfterClose() {
        this._abortClose = null;
        this._closing = false;

        if (this._bodyScrollLocked) {
            TypeModal._unlockBodyScroll();
            this._bodyScrollLocked = false;
        }

        if (this._previousActiveElement && typeof this._previousActiveElement.focus === "function") {
            this._previousActiveElement.focus();
        }
        this._previousActiveElement = null;
    }

    // =========================================================================
    // SCROLL LOCK GLOBAL (compartido entre TODAS las instancias de TypeModal)
    // =========================================================================
    //
    // Estos miembros son `static` (a nivel de clase, no de instancia) para que
    // sean COMPARTIDOS por todos los modales abiertos al mismo tiempo.
    //
    // Caso de uso (M4 - apilamiento):
    //   1. Abro una page-modal     → _openCount = 1, body.overflow = "hidden"
    //   2. Encima abro un dialog   → _openCount = 2, body sigue bloqueado
    //   3. Cierro el dialog        → _openCount = 1, body sigue bloqueado ✓
    //   4. Cierro la page          → _openCount = 0, body.overflow = "" (restaurado)
    //
    // Sin el contador, al cerrar el dialog se desbloquearía el body aunque
    // la page-modal siguiera abierta detrás → mal UX (el fondo scrollearía).
    // =========================================================================
    static _openCount = 0;
    static _previousBodyOverflow = "";

    static _lockBodyScroll() {
        TypeModal._openCount += 1;
        // Solo guardamos y bloqueamos en el PRIMER modal de la pila.
        // Los modales sucesivos ya encuentran el scroll bloqueado.
        if (TypeModal._openCount === 1) {
            TypeModal._previousBodyOverflow = document.body.style.overflow || "";
            document.body.style.overflow = "hidden";
        }
    }

    static _unlockBodyScroll() {
        // Math.max evita que el contador caiga en negativo por errores.
        TypeModal._openCount = Math.max(0, TypeModal._openCount - 1);
        // Solo restauramos cuando se cierra el ÚLTIMO modal de la pila.
        if (TypeModal._openCount === 0) {
            document.body.style.overflow = TypeModal._previousBodyOverflow;
        }
    }

    // =========================================================================
    // FOCO INICIAL (accesibilidad básica, sin focus trap)
    // =========================================================================
    //
    // Al abrir el modal, movemos el foco al primer elemento interactivo. Esto
    // le indica al screen reader que hay contenido nuevo y dónde empezar.
    //
    // Nota: ya NO hay trap (el Tab puede salir del modal). Si en el futuro se
    // requiere trap, reintroducir _handleKeyDown y el listener de keydown.
    //
    // El reto técnico es que el contenido está en SLOTS (light DOM), no en el
    // shadow root. slot.assignedElements() resuelve los nodos del padre.
    // =========================================================================

    _getFocusableElements() {
        const selectors = [
            "a[href]",
            "button:not([disabled])",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "[tabindex]:not([tabindex='-1'])",
        ].join(",");

        const focusables = [];
        const slots = this.renderRoot.querySelectorAll("slot");
        slots.forEach((slot) => {
            slot.assignedElements({ flatten: true }).forEach((el) => {
                if (el.matches && el.matches(selectors)) {
                    focusables.push(el);
                }
                if (el.querySelectorAll) {
                    focusables.push(...el.querySelectorAll(selectors));
                }
            });
        });
        return focusables;
    }

    /**
     * Al abrir el modal, mueve el foco al primer focusable.
     * Si no hay ninguno (modal puramente informativo), hace focusable el
     * contenedor para que el screen reader anuncie el modal.
     */
    _focusFirst() {
        const focusables = this._getFocusableElements();
        if (focusables.length > 0) {
            focusables[0].focus();
            return;
        }
        const content = this.renderRoot.querySelector(".type-modal-content");
        if (content) {
            content.setAttribute("tabindex", "-1");
            content.focus();
        }
    }

    /**
     * Evita que un click DENTRO del modal burbujee hacia elementos padres
     * (p.ej. un router que escucha clicks en su contenedor). Es defensa
     * preventiva independientemente de si cerramos por backdrop o no.
     */
    _handleContentClick(e) {
        e.stopPropagation();
    }

    /**
     * El DOM se mantiene visible cuando _closing es true para que la animación
     * CSS de salida pueda correr. Solo se desmonta cuando ambos son false.
     *
     * Las clases --closing activan las animaciones de salida definidas en el CSS.
     */
    render() {
        if (!this.open && !this._closing) return nothing;

        return html`
            <div class=${classMap({
                "type-modal-backdrop": true,
                "type-modal-backdrop--closing": this._closing,
            })}>
                <div
                    class=${classMap({
                        "type-modal-content": true,
                        "type-modal-content--closing": this._closing,
                    })}
                    role="dialog"
                    aria-modal="true"
                    @click=${this._handleContentClick}
                >
                    <header class="type-modal-header">
                        <slot name="header"></slot>
                    </header>
                    <section class="type-modal-body">
                        <slot name="body"></slot>
                    </section>
                    ${this.hasFooter ? html`
                        <footer class="type-modal-footer">
                            <slot name="footer"></slot>
                        </footer>
                    ` : nothing}
                </div>
            </div>
        `;
    }
}

// Registra el custom element. A partir de aquí, <type-modal> es usable en HTML.
customElements.define("type-modal", TypeModal);

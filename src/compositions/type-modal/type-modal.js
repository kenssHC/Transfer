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
    };

    constructor() {
        super();
        this.open = false;
        this.variant = "page";
        this.scrollable = false;
        this.fullHeight = false;
        this.hasFooter = false;

        // Guarda quién tenía el foco ANTES de abrir el modal, para devolvérselo
        // al cerrar. Mejora la accesibilidad (no perdemos el contexto del usuario).
        this._previousActiveElement = null;

        // Hacemos bind del handler porque addEventListener pierde el `this` del
        // componente. Sin este bind, dentro del handler `this` apuntaría al
        // elemento DOM que disparó el evento, no a la instancia de TypeModal.
        this._handleKeyDown = this._handleKeyDown.bind(this);

        // Bandera local: ¿esta instancia particular tiene activo el lock de scroll?
        // Sirve para evitar desbloquear el body más de una vez (si el componente
        // se destruye o cambia open varias veces seguidas).
        this._bodyScrollLocked = false;
    }

    static get styles() {
        return styles;
    }

    /**
     * Lifecycle de Lit: se ejecuta cada vez que termina un render.
     * `changedProps` es un Map con las props que cambiaron y sus valores previos.
     *
     * Aquí detectamos las transiciones de `open` para activar/desactivar
     * los side-effects (scroll lock, focus, listeners de teclado).
     *
     * ¿Por qué no usar `firstUpdated` o el constructor?
     *   - El constructor corre antes de que el DOM exista → no podemos enfocar.
     *   - `firstUpdated` solo corre 1 vez → no detectaría cambios posteriores.
     *   - `updated` corre en cada cambio → perfecto para reaccionar a `open`.
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
     */
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._bodyScrollLocked) {
            TypeModal._unlockBodyScroll();
            this._bodyScrollLocked = false;
        }
        this.removeEventListener("keydown", this._handleKeyDown);
    }

    /**
     * Side-effects al ABRIR el modal:
     *   1. Bloquea el scroll del <body> (M2 del chat).
     *   2. Guarda el elemento que tenía el foco (para devolverlo al cerrar).
     *   3. Espera al render y mueve el foco al primer elemento focusable
     *      dentro del modal (mejor accesibilidad).
     *   4. Activa el focus trap (M3 del chat) escuchando keydown.
     *
     * `this.updateComplete` es una Promise que se resuelve cuando Lit terminó
     * de renderizar. La usamos porque _focusFirst necesita leer el DOM ya pintado.
     */
    _onOpen() {
        TypeModal._lockBodyScroll();
        this._bodyScrollLocked = true;

        this._previousActiveElement = document.activeElement;

        this.updateComplete.then(() => this._focusFirst());

        this.addEventListener("keydown", this._handleKeyDown);
    }

    /**
     * Side-effects al CERRAR el modal:
     *   1. Libera el scroll del body (si esta instancia lo tenía bloqueado).
     *   2. Devuelve el foco al elemento que lo tenía antes (accesibilidad).
     *   3. Quita el listener de teclado del focus trap.
     */
    _onClose() {
        if (this._bodyScrollLocked) {
            TypeModal._unlockBodyScroll();
            this._bodyScrollLocked = false;
        }

        if (this._previousActiveElement && typeof this._previousActiveElement.focus === "function") {
            this._previousActiveElement.focus();
        }
        this._previousActiveElement = null;

        this.removeEventListener("keydown", this._handleKeyDown);
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
    // FOCUS TRAP (accesibilidad, M3 del chat)
    // =========================================================================
    //
    // Atrapa el foco DENTRO del modal cuando el usuario navega con Tab.
    // Sin esto, el Tab saldría al contenido detrás del backdrop → confuso y
    // rompe la expectativa de un modal (debe ser una "isla" hasta que cierre).
    //
    // El reto técnico: el contenido del modal está en SLOTS (light DOM), no
    // en el shadow root. Tenemos que recorrer los <slot> y pedirles los
    // elementos asignados (slot.assignedElements) para encontrar los focusables.
    // =========================================================================

    /**
     * Busca todos los elementos focusables dentro del modal (en los slots).
     *
     * - `slot.assignedElements({ flatten: true })` devuelve los nodos del light
     *   DOM que el consumidor metió en cada slot. `flatten: true` también
     *   resuelve slots anidados.
     * - Para cada elemento asignado, comprobamos si ÉL mismo es focusable
     *   (ej. un <button slot="header">) y además buscamos focusables anidados
     *   dentro de él (ej. botones dentro de un <div slot="footer">).
     */
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
     * propio contenedor con tabindex=-1 y lo enfoca, para que el screen reader
     * anuncie el modal y el Tab no se escape al fondo.
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
     * Lógica del focus trap: cuando el usuario presiona Tab estando en el
     * último focusable, lo manda al primero (y viceversa con Shift+Tab).
     * El foco "rebota" dentro del modal y nunca se sale.
     */
    _handleKeyDown(e) {
        if (e.key !== "Tab") return;
        const focusables = this._getFocusableElements();
        if (focusables.length === 0) {
            // Sin focusables: bloqueamos el Tab para no salir.
            e.preventDefault();
            return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            // Shift+Tab desde el primero → saltar al último.
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            // Tab desde el último → saltar al primero.
            e.preventDefault();
            first.focus();
        }
    }

    /**
     * stopPropagation en el contenido (M5 del chat).
     *
     * Aunque ya no cerramos por click en el backdrop, esto evita que un click
     * dentro del modal burbujee fuera del componente y dispare handlers de
     * elementos padres que no debería (por ej. un router que escucha clicks
     * en su contenedor). Es defensa preventiva.
     */
    _handleContentClick(e) {
        e.stopPropagation();
    }

    /**
     * Render:
     * - Si open=false, devolvemos `nothing` (símbolo de Lit que NO crea DOM).
     *   Esto es más eficiente que renderizar y ocultar con display:none, porque
     *   no monta el contenido cuando el modal está cerrado.
     * - El <div backdrop> es solo el fondo oscuro. Ya NO escucha clicks
     *   porque el equipo decidió que ningún variant cierra por backdrop.
     * - El <div content> tiene role="dialog" y aria-modal="true" para que
     *   los screen readers anuncien el modal correctamente.
     * - El slot footer solo se renderiza si hasFooter=true, para que ni siquiera
     *   exista en el DOM cuando no se usa.
     */
    render() {
        if (!this.open) return nothing;

        return html`
            <div class="type-modal-backdrop">
                <div
                    class="type-modal-content"
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

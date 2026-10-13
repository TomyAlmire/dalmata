// ─────────────────────────────────────────────
//  cart.js
//  Estado, persistencia y renderizado del carrito
// ─────────────────────────────────────────────

const STORAGE_KEY = "dalmata-store-cart";

// ── Estado interno ──────────────────────────
let cart = _loadCart();

// ── Persistencia ────────────────────────────

function _loadCart() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function _saveCart() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

// ── API pública ─────────────────────────────

/**
 * Agrega un ítem al carrito. Si ya existe (mismo producto, talle, color
 * y estado de personalización), incrementa su cantidad.
 * @param {{ productId, name, price, size, colorLabel, colorValue, customized }} item
 */
function addToCart(item) {
  const existing = cart.find(
    (entry) =>
      entry.productId === item.productId &&
      entry.size       === item.size &&
      entry.colorLabel === item.colorLabel &&
      entry.customized === item.customized
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      ...item,
      quantity: 1,
      id: `${item.productId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    });
  }

  _saveCart();
  _updateHeaderCount();
  renderCart();

  // Abrir el carrito automáticamente al agregar un producto
  window.dispatchEvent(new CustomEvent("dalmata:open-cart"));
}

/**
 * Modifica la cantidad de un ítem. Si llega a 0, lo elimina.
 * @param {string} itemId
 * @param {number} delta  +1 o -1
 */
function updateCartItemQuantity(itemId, delta) {
  const item = cart.find((entry) => entry.id === itemId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((entry) => entry.id !== itemId);
  }

  _saveCart();
  _updateHeaderCount();
  renderCart();
}

/**
 * Elimina un ítem del carrito por su id único.
 * @param {string} itemId
 */
function removeCartItem(itemId) {
  cart = cart.filter((item) => item.id !== itemId);
  _saveCart();
  _updateHeaderCount();
  renderCart();
}

// ── UI ──────────────────────────────────────

/** Actualiza el badge de cantidad en el header. */
function _updateHeaderCount() {
  const countNode = document.getElementById("cartCountHeader");
  if (!countNode) return;
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  countNode.textContent = String(count);
}

function _cartItemsHTML() {
  if (!cart.length) {
    return '<div class="cart-empty">Todavía no agregaste productos al carrito.</div>';
  }
  return cart
    .map(
      (item) => `
        <article class="cart-item">
          <div class="cart-item-header">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
          </div>
          <div class="cart-item-meta">
            Talle ${item.size} · ${item.colorLabel}${item.customized ? " · Personalizado" : ""}
          </div>
          <div class="cart-item-footer">
            <div class="qty-controls">
              <button class="qty-btn" type="button" data-qty="-1" data-item="${item.id}">-</button>
              <strong>${item.quantity}</strong>
              <button class="qty-btn" type="button" data-qty="1" data-item="${item.id}">+</button>
            </div>
            <button class="remove-item" type="button" data-remove="${item.id}">Eliminar</button>
          </div>
        </article>`
    )
    .join("");
}

function _bindCartItemEvents(root) {
  root.querySelectorAll("[data-qty]").forEach((btn) => {
    btn.addEventListener("click", () =>
      updateCartItemQuantity(btn.dataset.item, Number(btn.dataset.qty))
    );
  });
  root.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => removeCartItem(btn.dataset.remove));
  });
}

/** Renderiza la lista de ítems y el subtotal en todos los paneles de carrito visibles. */
function renderCart() {
  const cartItemsEls = document.querySelectorAll(".js-cart-items, #cartItems");
  const cartSubtotalEls = document.querySelectorAll(".js-cart-subtotal, #cartSubtotal");
  const clearCartBtns = document.querySelectorAll(".js-clear-cart-btn, #clearCartButton");
  const checkoutBtns = document.querySelectorAll(".js-checkout-btn, #checkoutButton");

  if (!cartItemsEls.length) return;

  const html = _cartItemsHTML();
  cartItemsEls.forEach((el) => {
    el.innerHTML = html;
    _bindCartItemEvents(el);
  });

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotalText = formatPrice(subtotal);
  cartSubtotalEls.forEach((el) => {
    el.textContent = subtotalText;
  });

  const clearHandler = () => {
    cart = [];
    _saveCart();
    _updateHeaderCount();
    renderCart();
  };

  clearCartBtns.forEach((btn) => {
    btn.onclick = clearHandler;
  });

  const checkoutHandler = async (btn) => {
    if (!cart.length) {
      window.alert("Tu carrito está vacío.");
      return;
    }
    btn.disabled = true;
    try {
      if (!window.DALMATA_SUPABASE_URL || !window.DALMATA_SUPABASE_ANON_KEY) {
        window.alert(
          "Para guardar pedidos en la nube, creá config.local.js (copiá config.local.example.js) con DALMATA_SUPABASE_URL y DALMATA_SUPABASE_ANON_KEY, y cargalo antes de app.js."
        );
        return;
      }
      const email = (window.prompt("Email para confirmar tu pedido (te vamos a contactar por acá):") || "").trim();
      if (!email || !email.includes("@")) {
        window.alert("Necesitamos un email válido para poder confirmarte el pedido: no coordinamos por WhatsApp.");
        return;
      }

      const ok = await submitOrder(cart, { email });

      if (ok) {
        await sendOrderEmail(cart, { email });
        window.alert("¡Pedido registrado! Te enviamos la confirmación por mail.");
        cart = [];
        _saveCart();
        _updateHeaderCount();
        renderCart();
      } else {
        window.alert("No se pudo registrar el pedido. Revisá políticas RLS y la tabla orders en Supabase.");
      }
    } catch (e) {
      console.error(e);
      window.alert("Error de red al enviar el pedido.");
    } finally {
      btn.disabled = false;
    }
  };

  checkoutBtns.forEach((btn) => {
    btn.onclick = () => checkoutHandler(btn);
  });
}

/** Inicializa el badge del header con el estado guardado en localStorage. */
function initCartHeader() {
  _updateHeaderCount();
}

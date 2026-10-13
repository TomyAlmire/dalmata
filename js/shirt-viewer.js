// ─────────────────────────────────────────────
//  shirt-viewer.js — Mockup 3D en vivo (Three.js)
//  Script clásico (no módulo): funciona también con file://
//  Expone window.DalmataShirtViewer.open(product)
//  formatPrice y fixImagePath son globales definidos en js/utils.js, cargado antes que este archivo.
// ─────────────────────────────────────────────
(function () {
  const SHIRT_SILHOUETTES = ["clasica", "crop-top", "crop-top-oversize", "buzo"];

  const DECAL_FRONT_Z = 0.125;
  const DECAL_BACK_Z = -0.125;

  let scene, camera, renderer, shirtGroup, shirtMesh, decalMesh, frameMesh;
  let textureLoader = null;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let rotY = 0.4;
  let rotX = 0;
  let autoRotate = true;
  let rafId = null;
  let modalEls = null;
  let currentDecalUrl = null;
  let decalSide = "front";

  function buildShirtShape() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.9, 0);
    shape.lineTo(-0.9, 1.35);
    shape.lineTo(-1.5, 1.55);
    shape.lineTo(-1.45, 2.05);
    shape.lineTo(-1.0, 1.85);
    shape.lineTo(-0.75, 2.25);
    shape.lineTo(-0.32, 2.42);
    shape.quadraticCurveTo(0, 2.15, 0.32, 2.42);
    shape.lineTo(0.75, 2.25);
    shape.lineTo(1.0, 1.85);
    shape.lineTo(1.45, 2.05);
    shape.lineTo(1.5, 1.55);
    shape.lineTo(0.9, 1.35);
    shape.lineTo(0.9, 0);
    shape.lineTo(-0.9, 0);
    return shape;
  }

  function buildShirtGeometry() {
    const shape = buildShirtShape();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.035,
      bevelSegments: 3,
      curveSegments: 12,
    });
    geometry.center();
    return geometry;
  }

  function initScene(container) {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 5.4);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(2.5, 3, 3.5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbcd3ff, 0.35);
    fillLight.position.set(-3, 1.5, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, -2, -3);
    scene.add(rimLight);

    shirtGroup = new THREE.Group();

    const geometry = buildShirtGeometry();
    const material = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.92,
      metalness: 0.02,
    });
    shirtMesh = new THREE.Mesh(geometry, material);
    shirtGroup.add(shirtMesh);

    const frameGeometry = new THREE.PlaneGeometry(1.12, 1.12);
    const frameMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
    shirtGroup.add(frameMesh);

    const decalGeometry = new THREE.PlaneGeometry(1, 1);
    const decalMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);
    decalMesh.position.set(0, 0.15, DECAL_FRONT_Z);
    shirtGroup.add(decalMesh);

    applyDecalTransform();

    shirtGroup.rotation.y = rotY;
    scene.add(shirtGroup);

    bindDragControls(container);
  }

  function bindDragControls(container) {
    const onDown = (x, y) => {
      dragging = true;
      autoRotate = false;
      lastX = x;
      lastY = y;
    };
    const onMove = (x, y) => {
      if (!dragging) return;
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;
      rotY += dx * 0.01;
      rotX = Math.max(-0.5, Math.min(0.5, rotX + dy * 0.008));
    };
    const onUp = () => {
      dragging = false;
    };

    container.addEventListener("pointerdown", (e) => onDown(e.clientX, e.clientY));
    window.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
    window.addEventListener("pointerup", onUp);
    container.style.touchAction = "none";
  }

  function animate() {
    rafId = requestAnimationFrame(animate);
    if (autoRotate && !dragging) {
      rotY += 0.0035;
    }
    if (shirtGroup) {
      shirtGroup.rotation.y += (rotY - shirtGroup.rotation.y) * 0.15;
      shirtGroup.rotation.x += (rotX - shirtGroup.rotation.x) * 0.15;
    }
    renderer.render(scene, camera);
  }

  function resizeRenderer(container) {
    const size = Math.min(container.clientWidth, container.clientHeight) || 360;
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  function setShirtColor(hex) {
    if (!shirtMesh) return;
    shirtMesh.material.color.set(hex || "#111111");
  }

  /** Recorta la textura vía UV (repeat/offset) para que cubra el plano 1:1 sin deformarse, sin tocar los píxeles de la imagen. */
  function applyCoverUV(texture) {
    const img = texture.image;
    if (!img || !img.width || !img.height) return;
    const imgAspect = img.width / img.height;
    if (imgAspect > 1) {
      const scale = 1 / imgAspect;
      texture.repeat.set(scale, 1);
      texture.offset.set((1 - scale) / 2, 0);
    } else {
      const scale = imgAspect;
      texture.repeat.set(1, scale);
      texture.offset.set(0, (1 - scale) / 2);
    }
    texture.needsUpdate = true;
  }

  function decalZFor(side) {
    return side === "back" ? DECAL_BACK_Z : DECAL_FRONT_Z;
  }

  /** Ubica la estampa y el marco en el frente o la espalda de la remera. */
  function applyDecalTransform() {
    if (!decalMesh) return;
    const z = decalZFor(decalSide);
    const flipped = decalSide === "back";
    decalMesh.position.z = z;
    decalMesh.rotation.y = flipped ? Math.PI : 0;
    if (frameMesh) {
      frameMesh.position.z = z + (flipped ? 0.002 : -0.002);
      frameMesh.rotation.y = decalMesh.rotation.y;
    }
  }

  function setDecalSide(side) {
    decalSide = side === "back" ? "back" : "front";
    applyDecalTransform();
  }

  function setDecalImage(rawUrl) {
    if (!decalMesh) return;
    currentDecalUrl = rawUrl;

    // Ocultamos y liberamos la textura anterior de inmediato: dejar el material
    // con "map" nulo pero sin marcar needsUpdate podía renderizar un cuadro negro
    // mientras cargaba la siguiente imagen.
    decalMesh.material.opacity = 0;
    if (decalMesh.material.map) {
      decalMesh.material.map.dispose();
      decalMesh.material.map = null;
      decalMesh.material.needsUpdate = true;
    }

    const url = fixImagePath(rawUrl);
    if (!url) return;

    if (!textureLoader) textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      url,
      (texture) => {
        if (currentDecalUrl !== rawUrl) return; // el usuario ya cambió de producto
        applyCoverUV(texture);
        decalMesh.material.map = texture;
        decalMesh.material.opacity = 1;
        decalMesh.material.needsUpdate = true;
      },
      undefined,
      () => {
        if (currentDecalUrl === rawUrl) decalMesh.material.opacity = 0;
      }
    );
  }

  function buildModal() {
    const overlay = document.createElement("div");
    overlay.className = "shirt3d-overlay";
    overlay.innerHTML = `
      <div class="shirt3d-modal">
        <button type="button" class="shirt3d-close" aria-label="Cerrar visor 3D">×</button>
        <div class="shirt3d-body">
          <div class="shirt3d-canvas-wrap"><div class="shirt3d-canvas"></div><p class="shirt3d-hint">Arrastrá para rotar</p></div>
          <div class="shirt3d-info">
            <p class="shirt3d-kicker">Mockup 3D en vivo</p>
            <h3 class="shirt3d-name"></h3>
            <p class="shirt3d-price"></p>
            <div class="shirt3d-field">
              <span>Estampa</span>
              <div class="shirt3d-sides">
                <button type="button" class="shirt3d-side is-active" data-side="front">Frente</button>
                <button type="button" class="shirt3d-side" data-side="back">Espalda</button>
              </div>
            </div>
            <div class="shirt3d-field">
              <span>Color</span>
              <div class="shirt3d-colors"></div>
            </div>
            <div class="shirt3d-field">
              <span>Talle</span>
              <div class="shirt3d-sizes"></div>
            </div>
            <button type="button" class="shirt3d-add-btn">Agregar al Carrito</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const els = {
      overlay,
      closeBtn: overlay.querySelector(".shirt3d-close"),
      canvasWrap: overlay.querySelector(".shirt3d-canvas"),
      name: overlay.querySelector(".shirt3d-name"),
      price: overlay.querySelector(".shirt3d-price"),
      sides: overlay.querySelector(".shirt3d-sides"),
      colors: overlay.querySelector(".shirt3d-colors"),
      sizes: overlay.querySelector(".shirt3d-sizes"),
      addBtn: overlay.querySelector(".shirt3d-add-btn"),
    };

    els.sides.querySelectorAll("[data-side]").forEach((btn) => {
      btn.addEventListener("click", () => {
        els.sides.querySelectorAll(".shirt3d-side").forEach((s) => s.classList.remove("is-active"));
        btn.classList.add("is-active");
        setDecalSide(btn.dataset.side);
        // Gira la prenda para que el lado elegido quede a la vista.
        rotY = btn.dataset.side === "back" ? Math.PI : 0.4;
        autoRotate = false;
      });
    });

    els.closeBtn.addEventListener("click", closeViewer);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeViewer();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeViewer();
    });

    window.addEventListener("resize", () => {
      if (overlay.classList.contains("is-open") && renderer) resizeRenderer(els.canvasWrap);
    });

    return els;
  }

  function renderColors(product, selected) {
    const colors = product.colors && product.colors.length ? product.colors : [{ label: "Negro", value: "#000000" }];
    modalEls.colors.innerHTML = colors
      .map(
        (c) =>
          `<button type="button" class="shirt3d-swatch${c.value === selected ? " is-active" : ""}" data-color="${c.value}" data-label="${c.label}" style="background:${c.value}" title="${c.label}"></button>`
      )
      .join("");

    modalEls.colors.querySelectorAll("[data-color]").forEach((btn) => {
      btn.addEventListener("click", () => {
        modalEls.colors.querySelectorAll(".shirt3d-swatch").forEach((s) => s.classList.remove("is-active"));
        btn.classList.add("is-active");
        setShirtColor(btn.dataset.color);
      });
    });
  }

  function renderSizes(product) {
    const sizes = product.sizes && product.sizes.length ? product.sizes : ["ÚNICO"];
    modalEls.sizes.innerHTML = sizes
      .map((s, i) => `<button type="button" class="shirt3d-size${i === 0 ? " is-active" : ""}" data-size="${s}">${s}</button>`)
      .join("");

    modalEls.sizes.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        modalEls.sizes.querySelectorAll(".shirt3d-size").forEach((s) => s.classList.remove("is-active"));
        btn.classList.add("is-active");
      });
    });
  }

  function openViewer(product) {
    if (!product) return;

    if (!modalEls) modalEls = buildModal();
    if (!renderer) initScene(modalEls.canvasWrap);

    modalEls.name.textContent = product.name;
    modalEls.price.textContent = formatPrice(product.price);

    const defaultColor = (product.colors && product.colors[0] && product.colors[0].value) || "#111111";
    setShirtColor(defaultColor);
    renderColors(product, defaultColor);
    renderSizes(product);

    modalEls.sides.querySelectorAll(".shirt3d-side").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.side === "front");
    });
    setDecalSide("front");
    // Preferimos la textura incrustada en base64 (data/product-textures.js): evita que
    // WebGL rechace la imagen por origen cuando el sitio se abre con file://.
    // Se busca por nombre de archivo (no por id de producto): varios productos comparten
    // la misma foto con ids distintos (ej. "buzo-the-strokes" usa the-strokes.jpg).
    const imageKey = String(product.image || "").split("/").pop().replace(/\.[a-z0-9]+$/i, "");
    const embeddedTexture =
      typeof DALMATA_DECAL_TEXTURES !== "undefined" ? DALMATA_DECAL_TEXTURES[imageKey] : null;
    setDecalImage(embeddedTexture || product.image);

    rotY = 0.4;
    rotX = 0;
    autoRotate = true;

    modalEls.overlay.classList.add("is-open");
    document.body.style.overflow = "hidden";

    modalEls.addBtn.onclick = () => {
      if (typeof window.addToCart !== "function") return;
      const activeColorBtn = modalEls.colors.querySelector(".shirt3d-swatch.is-active");
      const activeSizeBtn = modalEls.sizes.querySelector(".shirt3d-size.is-active");
      window.addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        size: activeSizeBtn ? activeSizeBtn.dataset.size : (product.sizes || ["ÚNICO"])[0],
        colorLabel: activeColorBtn ? activeColorBtn.dataset.label : (product.colors || [{ label: "Negro" }])[0].label,
        colorValue: activeColorBtn ? activeColorBtn.dataset.color : defaultColor,
        customized: false,
      });
      modalEls.addBtn.textContent = "¡Agregado!";
      window.setTimeout(() => {
        modalEls.addBtn.textContent = "Agregar al Carrito";
        closeViewer();
      }, 700);
    };

    requestAnimationFrame(() => {
      resizeRenderer(modalEls.canvasWrap);
      if (!rafId) animate();
    });
  }

  function closeViewer() {
    if (!modalEls) return;
    modalEls.overlay.classList.remove("is-open");
    document.body.style.overflow = "";
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function isShirtLike(product) {
    return SHIRT_SILHOUETTES.includes(String(product.silhouette || "").toLowerCase());
  }

  window.DalmataShirtViewer = {
    open: openViewer,
    close: closeViewer,
    isShirtLike,
  };
})();

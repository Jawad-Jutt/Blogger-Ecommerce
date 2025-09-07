//-------------------------Cart--------------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    function activateCartPanel() {
        const cartProducts = document.getElementById("CartProducts");
        const overlay = document.getElementById("Overlay");
        if (cartProducts && overlay) {
            cartProducts.classList.add("active");
            overlay.classList.add("active");
            document.body.style.overflow = "hidden";
            const wishlistProducts = document.querySelector("#WishlistProducts");
            if (wishlistProducts) wishlistProducts.classList.remove("active");
        }
    }
    const cart = {
        items: [],
        addItem: function (product) {
            try {
                const variantKey = product.variant
                    ? JSON.stringify(product.variant)
                    : "";
                const existingIndex = this.items.findIndex(
                    (item) => item.id === product.id && item.variantKey === variantKey
                );
                if (existingIndex >= 0) {
                    this.items[existingIndex].quantity++;
                } else {
                    this.items.push({ ...product, variantKey: variantKey, quantity: 1 });
                }
                this.save();
                this.updateUI();
                if (
                    !window.isBuyNowFlow &&
                    !window.location.pathname.includes("/p/cart.html")
                ) {
                    activateCartPanel();
                }
                return !0;
            } catch (e) {
                console.error("Error adding to cart:", e);
                return !1;
            }
        },
        removeItem: function (index) {
            this.items.splice(index, 1);
            this.save();
            this.updateUI();
        },
        updateQuantity: function (index, change) {
            const newQty = this.items[index].quantity + change;
            if (newQty > 0 && newQty <= 100) {
                this.items[index].quantity = newQty;
            } else if (newQty < 1) {
                this.removeItem(index);
            } else {
                this.items[index].quantity = 100;
            }
            this.save();
            this.updateUI();
            if (change > 0) activateCartPanel();
        },
        save: function () {
            localStorage.setItem("simpleCart", JSON.stringify(this.items));
        },
        load: function () {
            try {
                const saved = localStorage.getItem("simpleCart");
                this.items = saved ? JSON.parse(saved) : [];
                this.updateUI();
            } catch (e) {
                console.error("Error loading cart:", e);
                this.items = [];
            }
        },
        calculateTotal: function () {
            return this.items.reduce((total, item) => {
                const price =
                    parseFloat(item.currentPrice.replace(/[^0-9.-]/g, "")) || 0;
                return total + price * item.quantity;
            }, 0);
        },
        updateUI: function () {
            try {
                this.updateOffCanvasCart();
                this.updateCartPage();
            } catch (e) {
                console.error("Error updating cart UI:", e);
            }
        },
        updateOffCanvasCart: function () {
            const cartMenu = document.getElementById("CartMenu");
            if (!cartMenu) return;
            const container =
                cartMenu.querySelector(".cart-items") || document.createElement("div");
            container.className = "cart-items";
            const cartCount = cartMenu.querySelector(".cart-count");
            const cartProducts = cartMenu.querySelector("#CartProducts");
            const panelButtons = cartProducts.querySelector(".panel-buttons");
            let totalAmountElement = cartProducts.querySelector(
                ".total-amount .total-value"
            );
            if (!totalAmountElement) {
                totalAmountElement = this.createTotalAmountElement();
            }
            const totalItems = this.items.reduce(
                (sum, item) => sum + item.quantity,
                0
            );
            if (cartCount) {
                cartCount.textContent = totalItems;
            }
            container.innerHTML = "";
            if (this.items.length > 0) {
                const emptyState = cartProducts.querySelector(".empty-state");
                if (emptyState) emptyState.remove();
                if (!container.parentNode) {
                    cartProducts.insertBefore(container, panelButtons);
                }
                this.items.forEach((item, index) => {
                    const itemElement = document.createElement("div");
                    itemElement.className = "cart-item";
                    let variantText = "";
                    if (item.variant && typeof item.variant === "object") {
                        variantText = Object.values(item.variant)
                            .filter((val) => val && val !== "undefined")
                            .join(" / ");
                    }
                    itemElement.innerHTML = `
            <img src="${item.image || "https://via.placeholder.com/70?text=No+Image"
                        }" loading="lazy" alt="${item.title}">
            <div class="cart-item-details">
              <div class="cart-item-title">${item.title || "Untitled Product"
                        }</div>
              ${variantText
                            ? `<div class="cart-item-variant">${variantText}</div>`
                            : ""
                        }
              <div class="cart-item-price">
                <span class="current-price">${item.currentPrice || "$0.00"
                        }</span>
                ${item.oldPrice
                            ? `<span class="old-price">${item.oldPrice}</span>`
                            : ""
                        }
              </div>
              <div class="cart-item-actions">
                <div class="quantity-selector">
                  <button class="quantity-btn qty-minus" data-index="${index}">−</button>
                  <input class="quantity-input qty-display" type="text" value="${item.quantity
                        }" 
                         min="1" max="100" data-index="${index}" readonly>
                  <button class="quantity-btn qty-plus" data-index="${index}">+</button>
                </div>
                <button class="remove-btn" data-index="${index}">×</button>
              </div>
            </div>
          `;
                    container.appendChild(itemElement);
                });
                const total = this.calculateTotal();
                totalAmountElement.textContent = `$${total.toFixed(2)}`;
                totalAmountElement.style.display = "block";
            } else {
                const emptyState = cartProducts.querySelector(".empty-state");
                if (!emptyState) {
                    const newEmptyState = document.createElement("div");
                    newEmptyState.className = "empty-state";
                    newEmptyState.innerHTML = `
            <i class="bi bi-bag-x"></i>
            <p>Your cart is currently empty</p>
          `;
                    cartProducts.insertBefore(newEmptyState, panelButtons);
                }
                totalAmountElement.style.display = "none";
            }
        },
        updateCartPage: function () {
            if (!document.getElementById("CartPage")) return;
            try {
                const cartPage = document.getElementById("CartPageItems");
                const cartSummary = document.getElementById("CartSummary");
                const cartSubtotal = document.getElementById("CartSubtotal");
                const cartTotal = document.getElementById("CartTotal");
                const totalItems = this.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                );
                if (cartSummary) {
                    cartSummary.textContent =
                        totalItems > 0
                            ? `${totalItems} ${totalItems === 1 ? "item" : "items"
                            } in your cart`
                            : "Your cart is empty";
                }
                cartPage.innerHTML = "";
                if (this.items.length > 0) {
                    this.items.forEach((item, index) => {
                        let variantText = "";
                        if (item.variant && typeof item.variant === "object") {
                            variantText = Object.values(item.variant)
                                .filter((val) => val && val !== "undefined")
                                .join(" / ");
                        }
                        const itemElement = document.createElement("div");
                        itemElement.className = "cart-item-card";
                        itemElement.innerHTML = `
              <img src="${item.image || "https://via.placeholder.com/100?text=No+Image"
                            }" 
                   alt="${item.title}" 
                   class="cart-item-image"
                   loading="lazy">
              <div class="cart-item-details">
                <h3 class="cart-item-title">${item.title || "Untitled Product"
                            }</h3>
                ${variantText
                                ? `<div class="cart-item-variant">${variantText}</div>`
                                : ""
                            }
                <div class="cart-item-price">
                  <span class="current-price">${item.currentPrice || "$0.00"
                            }</span>
                  ${item.oldPrice
                                ? `<span class="old-price">${item.oldPrice}</span>`
                                : ""
                            }
                </div>
                <div class="cart-item-actions">
                  <div class="quantity-selector">
                    <button class="quantity-btn qty-minus" data-index="${index}">−</button>
                    <input class="quantity-input qty-display" type="text" value="${item.quantity
                            }" 
                           min="1" max="100" data-index="${index}" readonly>
                    <button class="quantity-btn qty-plus" data-index="${index}">+</button>
                  </div>
                </div>
              </div>
              <button class="remove-item-btn remove-btn" data-index="${index}">×</button>
            `;
                        cartPage.appendChild(itemElement);
                    });
                    const subtotal = this.calculateTotal();
                    if (cartSubtotal)
                        cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
                    if (cartTotal) cartTotal.textContent = `$${subtotal.toFixed(2)}`;
                } else {
                    const emptyMessage = document.createElement("div");
                    emptyMessage.className = "empty-cart-message";
                    emptyMessage.innerHTML = `
            <i class="bi bi-bag-x"></i>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything to your cart yet</p>
            <a href="/" class="continue-shopping-btn">Continue Shopping</a>
          `;
                    cartPage.appendChild(emptyMessage);
                    if (cartSubtotal) cartSubtotal.textContent = "$0.00";
                    if (cartTotal) cartTotal.textContent = "$0.00";
                }
            } catch (e) {
                console.error("Error updating cart page:", e);
            }
        },
        createTotalAmountElement: function () {
            const cartProducts = document.querySelector("#CartProducts");
            const panelButtons = cartProducts.querySelector(".panel-buttons");
            const totalElement = document.createElement("div");
            totalElement.className = "total-amount";
            totalElement.style.display = "none";
            totalElement.innerHTML = `
        <div class="total-row">
          <span class='subtotal'>Subtotal:</span>
          <span class="total-value">$0.00</span>
        </div>
      `;
            cartProducts.insertBefore(totalElement, panelButtons);
            return totalElement.querySelector(".total-value");
        },
    };
    cart.load();
    function handleQuantityChange(input, change) {
        if (!input) return;
        let newQty = parseInt(input.value) + change;
        newQty = Math.max(1, Math.min(100, newQty));
        input.value = newQty;
    }
    document.addEventListener("click", function (e) {
        if (
            e.target.classList.contains("quantity-btn") &&
            !e.target.hasAttribute("data-index")
        ) {
            const isMinus = e.target.classList.contains("qty-minus");
            const isPlus = e.target.classList.contains("qty-plus");
            const input = document.getElementById("product-qty");
            if (input && (isMinus || isPlus)) {
                handleQuantityChange(input, isMinus ? -1 : 1);
            }
        }
        const addToCartBtn = e.target.closest(".add-to-cart");
        if (addToCartBtn) {
            e.preventDefault();
            try {
                const postId = addToCartBtn.getAttribute("data-id") || "missing-id";
                const postTitle =
                    addToCartBtn.getAttribute("data-title") || "Untitled Product";
                const quantity =
                    parseInt(document.getElementById("product-qty")?.value) || 1;
                const productContainer =
                    addToCartBtn.closest(".post-outer") ||
                    addToCartBtn.closest(".post") ||
                    document;
                let currentPrice =
                    productContainer
                        .querySelector(".saved-current-price")
                        ?.textContent?.trim() ||
                    productContainer
                        .querySelector("[data-saved-current-price]")
                        ?.textContent?.trim() ||
                    productContainer
                        .querySelector("[data-saved-current-price]")
                        ?.getAttribute("data-saved-current-price") ||
                    productContainer
                        .querySelector(".current-price")
                        ?.textContent?.trim() ||
                    "$0.00";
                let oldPrice =
                    productContainer
                        .querySelector(".saved-old-price")
                        ?.textContent?.trim() ||
                    productContainer
                        .querySelector("[data-saved-old-price]")
                        ?.textContent?.trim() ||
                    productContainer
                        .querySelector("[data-saved-old-price]")
                        ?.getAttribute("data-saved-old-price") ||
                    productContainer.querySelector(".old-price")?.textContent?.trim() ||
                    "";
                let variant = {};
                const variantGroups =
                    productContainer.querySelectorAll(".variant-group");
                variantGroups.forEach((group) => {
                    const groupName =
                        group
                            .closest(".product-variants")
                            ?.querySelector("strong")
                            ?.textContent?.replace(":", "")
                            ?.trim() || "Option";
                    let selected =
                        group.querySelector(".selected") ||
                        group.querySelector('span[aria-pressed="true"]') ||
                        group.querySelector("span.active");
                    if (!selected) {
                        selected = group.querySelector("span[data-label], span");
                    }
                    if (selected) {
                        variant[groupName] =
                            selected.getAttribute("data-label") ||
                            selected.textContent?.trim() ||
                            "selected";
                    }
                });
                let image = "";
                const sliderWrapper =
                    productContainer.querySelector(".homepage-slider-wrapper") ||
                    productContainer.querySelector(".global-zoom-slider") ||
                    productContainer.querySelector(".swiper-container");
                if (sliderWrapper) {
                    const activeImg =
                        sliderWrapper.querySelector(".swiper-slide-active img") ||
                        sliderWrapper.querySelector(".swiper-slide-visible img") ||
                        sliderWrapper.querySelector(
                            '.swiper-slide img:not([style*="display: none"])'
                        );
                    const firstImg = sliderWrapper.querySelector(".swiper-slide img");
                    image = (activeImg || firstImg)?.src || "";
                }
                for (let i = 0; i < quantity; i++) {
                    cart.addItem({
                        id: postId,
                        title: postTitle,
                        image: image,
                        currentPrice: currentPrice,
                        oldPrice: oldPrice,
                        variant: variant,
                    });
                }
                const originalHTML = addToCartBtn.innerHTML;
                addToCartBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
                addToCartBtn.style.pointerEvents = "none";
                setTimeout(() => {
                    addToCartBtn.innerHTML = originalHTML;
                    addToCartBtn.style.pointerEvents = "";
                }, 2000);
            } catch (error) {
                console.error("Error adding to cart:", error);
            }
        }
        if (
            e.target.classList.contains("quantity-btn") &&
            e.target.hasAttribute("data-index")
        ) {
            const index = parseInt(e.target.getAttribute("data-index"));
            const change = e.target.classList.contains("qty-minus") ? -1 : 1;
            cart.updateQuantity(index, change);
        }
        if (
            e.target.classList.contains("remove-btn") ||
            e.target.classList.contains("remove-item-btn")
        ) {
            const index = parseInt(e.target.getAttribute("data-index"));
            cart.removeItem(index);
        }
    });

    const cartMenu = document.getElementById("CartMenu");
    if (cartMenu) {
        const cartIcon = cartMenu.querySelector(".cart-icon");
        const cartProducts = cartMenu.querySelector("#CartProducts");
        const overlay = document.getElementById("Overlay");
        cartIcon.addEventListener("click", function (e) {
            e.stopPropagation();
            if (!window.location.pathname.includes("/p/cart.html")) {
                activateCartPanel();
            }
        });

        const cartClose = cartProducts.querySelector(".close-panel");

        if (cartClose) {
            cartClose.addEventListener("click", function () {
                cartProducts.classList.remove("active");
                overlay.classList.remove("active");
                document.body.style.overflow = "";
            });
        }
    }
    const overlay = document.getElementById("Overlay");
    if (overlay) {
        overlay.addEventListener("click", function () {
            document
                .querySelectorAll("#WishlistProducts, #CartProducts")
                .forEach((panel) => {
                    panel.classList.remove("active");
                });
            overlay.classList.remove("active");
            document.body.style.overflow = "";
        });
    }

    document.addEventListener("click", function (e) {
        if (
            e.target.classList.contains("notcheckout") ||
            e.target.id === "HavingNotCheckoutpage"
        ) {
            e.preventDefault();
            if (cart.items.length > 0) {
                alert(
                    "Proceeding to checkout with " +
                    cart.items.reduce((sum, item) => sum + item.quantity, 0) +
                    " items"
                );
            } else {
                alert("Your cart is empty");
            }
        }
        if (e.target.classList.contains("view-cart")) {
            e.preventDefault();
            window.location.href = "/p/cart.html";
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const cartPage = document.getElementById("CartPage");
    if (cartPage) {
        const isCartPage = window.location.pathname.includes("/p/cart.html");
        cartPage.style.display = isCartPage ? "block" : "none";
    }
});

//----------------------------Buy Now------------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("click", function (e) {
        const buyNowBtn = e.target.closest(".direct-buy");
        if (!buyNowBtn) return;
        e.preventDefault();

        // Mark flow as Buy Now
        window.isBuyNowFlow = true;

        const productContainer =
            buyNowBtn.closest(".post-outer") ||
            buyNowBtn.closest(".post") ||
            document;
        let addToCartBtn = productContainer.querySelector(".add-to-cart");

        if (addToCartBtn) {
            try {
                addToCartBtn.dispatchEvent(
                    new MouseEvent("click", {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                    })
                );
            } catch (err) {
                try {
                    addToCartBtn.click();
                } catch (e) { }
            }

            // Redirect to checkout
            setTimeout(() => {
                window.location.href = "/p/checkout.html";
                window.isBuyNowFlow = false;
            }, 100);
            return;
        }
    });
});

//-------------------------- Wishlist System --------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const wishlistMenu = document.getElementById("WishlistMenu");
    const wishlistIcon = wishlistMenu?.querySelector(".wishlist-icon");
    const wishlistProducts = wishlistMenu?.querySelector("#WishlistProducts");
    const wishlistCount = wishlistMenu?.querySelector(".wishlist-count");
    const overlay = document.getElementById("Overlay");
    const wishlistPage = document.getElementById("wishlistPage");
    const wishlist = {
        items: JSON.parse(localStorage.getItem("wishlistItems")) || [],
        save() {
            localStorage.setItem("wishlistItems", JSON.stringify(this.items));
            this.updateAllUI();
        },
        addItem(item) {
            if (!this.items.find((i) => i.id === item.id)) {
                this.items.push(item);
                this.save();
                this.openMenu();
            }
        },
        removeItem(id) {
            this.items = this.items.filter((i) => i.id !== id);
            this.save();
        },
        clearAll() {
            if (this.items.length === 0) return;
            if (confirm("Are you sure you want to clear your entire wishlist?")) {
                this.items = [];
                this.save();
            }
        },
        openMenu() {
            if (wishlistProducts) {
                wishlistProducts.classList.add("active");
                overlay?.classList.add("active");
                document.body.style.overflow = "hidden";
            }
        },
        toggleItem(item) {
            const exists = this.items.find((i) => i.id === item.id);
            exists ? this.removeItem(item.id) : this.addItem(item);
        },
        updateAllUI() {
            this.updateMenuUI();
            this.updatePageUI();
            this.updateProductButtons();
        },
        updateMenuUI() {
            if (wishlistCount) wishlistCount.textContent = this.items.length;
            const listContainer = wishlistMenu?.querySelector(".wishlist-items");
            const emptyState = wishlistMenu?.querySelector(".empty-state");
            if (listContainer && emptyState) {
                listContainer.innerHTML = "";
                if (this.items.length === 0) {
                    emptyState.classList.remove("hidden");
                    listContainer.classList.add("hidden");
                } else {
                    emptyState.classList.add("hidden");
                    listContainer.classList.remove("hidden");
                    this.items.forEach((item) => {
                        const div = document.createElement("div");
                        div.className = "wishlist-item";
                        div.innerHTML = `
              <img src="${item.image}" class="wishlist-thumb"/>
              <div class="wishlist-info">
                <p class="wishlist-title">${item.title}</p>
                <div class="wishlist-actions">
                  <a href="${item.url}" title="View Product"><i class="bi bi-box-arrow-up-right"></i></a>
                  <button class="remove-wishlist-item" data-id="${item.id}" title="Remove">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>
            `;
                        listContainer.appendChild(div);
                    });
                }
            }
        },
        updatePageUI() {
            const container = document.querySelector(".wishlist-items-container");
            const emptyPageState = document.querySelector(
                ".wishlist-page .empty-state"
            );
            if (container) {
                container.innerHTML = "";
                if (this.items.length === 0) {
                    if (emptyPageState) {
                        emptyPageState.classList.remove("hidden");
                        container.classList.add("hidden");
                    } else {
                        container.innerHTML = `
              <div class="empty-state">
                <i class="bi bi-heartbreak"></i>
                <p>Your wishlist is currently empty</p>
              </div>
            `;
                    }
                } else {
                    if (emptyPageState) {
                        emptyPageState.classList.add("hidden");
                        container.classList.remove("hidden");
                    }
                    this.items.forEach((item) => {
                        const div = document.createElement("div");
                        div.className = "wishlist-page-item";
                        div.innerHTML = `
              <img src="${item.image}" class="wishlist-page-thumb"/>
              <div class="wishlist-page-info">
                <h2>${item.title}</h2>
                <div class="wishlist-page-actions">
                  <a href="${item.url}" class="view-btn" title="View Product">
                    <i class="bi bi-box-arrow-up-right"></i> View Product
                  </a>
                  <button class="remove-btn" data-id="${item.id}" title="Remove">
                    <i class="bi bi-x-circle"></i> Remove
                  </button>
                </div>
              </div>
            `;
                        container.appendChild(div);
                    });
                }
            }
        },
        updateProductButtons() {
            document.querySelectorAll(".add-to-wishlist").forEach((btn) => {
                const id = btn.getAttribute("data-id");
                const icon = btn.querySelector("i");
                const isInWishlist = this.items.find((i) => i.id === id);
                btn.classList.toggle("added", !!isInWishlist);
                if (icon)
                    icon.className = isInWishlist
                        ? "bi bi-heart-fill text-red"
                        : "bi bi-heart";
            });
        },
    };
    wishlist.updateAllUI();
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".add-to-wishlist");
        if (btn) {
            e.preventDefault();
            const id = btn.getAttribute("data-id");
            const title = btn.getAttribute("data-title");
            const url = btn.getAttribute("data-url") || btn.href;
            const container = btn.closest(".post-outer") || document;
            const imgEl = container.querySelector("img");
            const image = imgEl ? imgEl.src : "https://via.placeholder.com/70";
            wishlist.toggleItem({ id, title, url, image });
        }
        if (e.target.closest(".remove-wishlist-item")) {
            const id = e.target
                .closest(".remove-wishlist-item")
                .getAttribute("data-id");
            wishlist.removeItem(id);
        }
        if (e.target.closest(".clear-wishlish")) {
            wishlist.clearAll();
        }
        if (e.target.closest(".view-wishlist")) {
            sessionStorage.setItem(
                "tempWishlistItems",
                JSON.stringify(wishlist.items)
            );
            window.location.href = "/p/wishlist.html";
        }
        if (e.target.closest(".remove-btn")) {
            const id = e.target.closest(".remove-btn").getAttribute("data-id");
            wishlist.removeItem(id);
        }
    });
    wishlistIcon?.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!window.location.pathname.includes("/p/wishlist.html")) {
            wishlist.openMenu();
        }
    });
    document.querySelectorAll(".close-panel").forEach((btn) => {
        btn.addEventListener("click", () => {
            wishlistProducts?.classList.remove("active");
            overlay?.classList.remove("active");
            document.body.style.overflow = "";
        });
    });
    overlay?.addEventListener("click", () => {
        wishlistProducts?.classList.remove("active");
        overlay?.classList.remove("active");
        document.body.style.overflow = "";
    });
    if (window.location.pathname.includes("/p/wishlist.html")) {
        if (wishlistPage) wishlistPage.style.display = "block";
        const tempItems = JSON.parse(sessionStorage.getItem("tempWishlistItems"));
        if (tempItems) {
            wishlist.items = tempItems;
            sessionStorage.removeItem("tempWishlistItems");
            wishlist.save();
        }
        wishlist.updatePageUI();
    }
});

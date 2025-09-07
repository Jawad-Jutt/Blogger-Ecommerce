
// ---------------------Shop-----------------------//

(function () {
    const shopPagePath = "/p/shop.html";
    const postsFeedURL = "/feeds/posts/default?alt=json&max-results=500";

    // Check if on shop page and set shopPage visibility
    const shopPage = document.getElementById("shopPage");
    if (window.location.pathname === shopPagePath && shopPage) {
        shopPage.classList.add("active");
    } else {
        return;
    }

    document.addEventListener("DOMContentLoaded", initShopPage);

    /* ---------- helpers ---------- */
    const cleanUrl = url => (url || "").split("#")[0].split("?")[0].replace(/\/$/, "");
    const productStorageKey = url => `product:${cleanUrl(url)}`;

    function formatPrice(value) {
        if (value === null || value === undefined || value === "") return "";
        value = String(value).trim();
        const m = value.match(/^([^\d\s,.\-]*)\s*(.*)$/);
        const symbol = (m && m[1]) ? m[1].trim() : "";
        let num = (m && m[2]) ? m[2].replace(/\s+/g, "").replace(/,/g, "") : value.replace(/,/g, "");
        if (!/^\d+(\.\d+)?$/.test(num)) return value;
        const parts = num.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return symbol ? `${symbol} ${parts.join('.')}` : parts.join('.');
    }

    function parseShortcode(raw, key) {
        const re = new RegExp("\\[" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*=\\s*['\"]?([^\\]'\"]+?)['\"]?\\]", "i");
        const m = raw.match(re);
        return m ? m[1].trim() : "";
    }

    function parseBrandFromRaw(raw) {
        const val = parseShortcode(raw, "data-brand");
        if (!val) return {};
        const urls = [...val.matchAll(/\{(https?:\/\/[^\s{}]+)\}/g)].map(x => x[1]);
        const nameOnly = val.replace(/\{https?:\/\/[^\s{}]+\}/g, "").trim();
        return { name: nameOnly || "", link: urls[0] || "", image: urls[1] || "" };
    }

    function extractImagesFromHTML(html) {
        const holder = document.createElement("div");
        holder.innerHTML = html || "";
        return [...holder.querySelectorAll("img")]
            .map(i => i.getAttribute("src"))
            .filter((v, i, a) => v && a.indexOf(v) === i);
    }

    function parseVariantsFromRaw(raw) {
        if (!raw) return {};
        const ta = document.createElement("textarea");
        ta.innerHTML = raw;
        raw = ta.value;
        const groups = {};
        const re = /\[variants(\d)\(([^)]+)\)=([^\]\n\r]+)\]/gi;
        let m;
        while ((m = re.exec(raw)) !== null) {
            const idx = `group-${m[1]}`;
            const label = m[2].trim();
            const values = m[3]
                .split("+")
                .map(v => String(v).replace(/\u00A0/g, " ").trim())
                .filter(Boolean);
            groups[idx] = { label, values };
        }
        return groups;
    }

    /* ---------- building shop ---------- */
    /* ---------- read items-per-page from Theme Settings (robust) ---------- */
    function getItemsPerPageFromTheme(defaultItems = 4) {
        try {
            const possibleRoots = [
                document.getElementById('theme-settings'),
                document.querySelector('.theme-payments.section'),
                document.getElementById('LinkList11'),
                document.querySelector('[name="Theme Settings"]'),
                document.querySelector('.widget.LinkList')
            ].filter(Boolean);

            for (const root of possibleRoots) {
                const anchors = Array.from(root.querySelectorAll('a'));
                if (!anchors.length) continue;

                // 1) Prefer anchors whose text mentions "shop" and "item"
                for (const a of anchors) {
                    const text = (a.textContent || '').trim().toLowerCase();
                    if (text.includes('shop') && text.includes('item')) {
                        const href = (a.getAttribute('href') || '').trim();
                        const n = parseInt(href, 10);
                        if (!isNaN(n) && n > 0) return n;
                    }
                }

                // 2) Fallback: any numeric-only href within this widget
                const numeric = anchors.find(a => /^\d+$/.test((a.getAttribute('href') || '').trim()));
                if (numeric) return parseInt(numeric.getAttribute('href'), 10);
            }

            // 3) Final fallback: search whole doc for link text "Shop Page items"
            const match = Array.from(document.querySelectorAll('a')).find(a => /(shop\s*page\s*items)/i.test(a.textContent || ''));
            if (match) {
                const val = parseInt((match.getAttribute('href') || '').trim(), 10);
                if (!isNaN(val) && val > 0) return val;
            }
        } catch (e) {
            console.warn('getItemsPerPageFromTheme error:', e);
        }
        return defaultItems;
    }

    /* ---------- updated initShopPage using theme setting ---------- */
    function initShopPage() {
        const parent = document.getElementById("ShopProducts");
        if (!parent) {
            console.error("ShopProducts element not found");
            return;
        }

        const itemsPerPage = getItemsPerPageFromTheme(4); // default = 4 if not found
        console.log('Shop page items per batch:', itemsPerPage);

        fetch(postsFeedURL)
            .then(res => res.json())
            .then(data => {
                const entries = (data && data.feed && data.feed.entry) ? data.feed.entry : [];
                let currentIndex = 0;

                const loadMoreBtn = document.createElement("button");
                loadMoreBtn.textContent = "Load More";
                loadMoreBtn.className = "load-more-btn";

                function renderBatch() {
                    const slice = entries.slice(currentIndex, currentIndex + itemsPerPage);
                    slice.forEach(entry => appendPost(entry, parent));
                    currentIndex += slice.length;

                    // initialize sliders/variants for newly appended posts
                    initializeSlidersAndVariants();

                    // hide/remove button if all loaded
                    if (currentIndex >= entries.length) {
                        if (loadMoreBtn.parentNode) loadMoreBtn.parentNode.removeChild(loadMoreBtn);
                    } else {
                        loadMoreBtn.style.display = "";
                    }
                }

                loadMoreBtn.addEventListener("click", renderBatch);

                // initial render
                renderBatch();

                // append button only if there are more posts
                if (entries.length > currentIndex) {
                    if (parent.nextSibling) parent.parentNode.insertBefore(loadMoreBtn, parent.nextSibling);
                    else parent.parentNode.appendChild(loadMoreBtn);
                }
            })
            .catch(err => {
                console.error("Failed to load Blogger posts feed:", err);
                parent.innerHTML = "<p>Failed to load products.</p>";
            });
    }


    function appendPost(entry, parent) {
        const idMatch = (entry && entry.id && entry.id.$t) ? entry.id.$t.match(/post-(\d+)/) : null;
        const postId = idMatch ? idMatch[1] : (entry.id && entry.id.$t) || "";
        const linkObj = (entry.link || []).find(l => l.rel === "alternate") || {};
        const postUrl = linkObj.href || "#";
        const postTitle = (entry.title && entry.title.$t) ? entry.title.$t : "";
        const postBody = (entry.content && entry.content.$t) ? entry.content.$t : (entry.summary && entry.summary.$t) ? entry.summary.$t : "";

        const postOuter = document.createElement("div");
        postOuter.className = "post-outer post hentry";

        postOuter.innerHTML = `
      <div class='homepage-slider-wrapper' data-post-id=''>
        <div class='homepage-hidden-body' style='display:none;'></div>
        <a>
          <div class='homepage-main-slider swiper'>
            <div class='swiper-wrapper'></div>
            <div class='swiper-button-prev'></div>
            <div class='swiper-button-next'></div>
          </div>
        </a>
        <div class='homepage-thumb-slider swiper' style='display:none;'>
          <div class='swiper-wrapper'></div>
        </div>
      </div>
      <div class='separate-actions'>
        <div class='post home-post-sale'>
          <div class='saved-product-sale' data-saved-sale=''></div>
          <div class='raw-sale' style='display:none;'></div>
        </div>
        <div class='post home-post-brand'>
          <div class='saved-brand-image'></div>
          <div class='raw-brand' style='display:none;'></div>
        </div>
      </div>
      <div class='product-details'>
        <div class='post homepage-view-variants'>
          <div class='raw-variants' style='display:none;'></div>
          <div class='variants-container'>
            <div class='group-1-container product-variants'>
              <strong></strong>
              <div class='variant-group group-1'></div>
              <button class='clear-btn' onclick='clearSelection(this)' style='display:none;'>Clear</button>
            </div>
            <div class='group-2-container product-variants'>
              <strong></strong>
              <div class='variant-group group-2'></div>
              <button class='clear-btn' onclick='clearSelection(this)' style='display:none;'>Clear</button>
            </div>
            <div class='group-3-container product-variants'>
              <strong></strong>
              <div class='variant-group group-3'></div>
              <button class='clear-btn' onclick='clearSelection(this)' style='display:none;'>Clear</button>
            </div>
          </div>
        </div>
        <h3 class='product-title entry-title' itemprop='name'>
          <a class='product-title-link' href='#'></a>
        </h3>
        <div class='product-footer'>
          <div class='product-price'>
            <div class='post'>
              <div class='saved-old-price' data-saved-old-price=''></div>
              <div class='saved-current-price' data-saved-current-price=''></div>
              <div class='raw-price' style='display:none;'></div>
            </div>
            <div class='post'>
              <div class='saved-stock' data-stock='' id='product-stock'></div>
              <div class='raw-stock' style='display:none;'></div>
            </div>
          </div>
          <div class='product-actionspost post'>
            <div class='homepage-hidden-body' data-post-id='' style='display:none;'></div>
            <a class='icon-btn add-to-cart' href='#' title='Add to Cart'>
              <i class='bi bi-bag'></i> Add to Cart
            </a>
            <a class='add-to-wishlist' href='#' title='Add to Wishlist'>
              <i class='bi bi-heart'></i>
            </a>
          </div>
        </div>
      </div>
    `;

        postOuter.querySelector(".homepage-slider-wrapper").setAttribute("data-post-id", postId);
        postOuter.querySelectorAll(".homepage-hidden-body").forEach(el => {
            el.setAttribute("data-post-id", postId);
            el.innerHTML = postBody;
        });
        ["raw-sale", "raw-brand", "raw-variants", "raw-price", "raw-stock"].forEach(cls => {
            postOuter.querySelectorAll("." + cls).forEach(el => el.innerHTML = postBody);
        });

        const titleAnchor = postOuter.querySelector(".product-title-link");
        if (titleAnchor) {
            titleAnchor.setAttribute("href", postUrl);
            titleAnchor.textContent = postTitle;
        }
        postOuter.querySelectorAll(".post").forEach(el => el.setAttribute("data-post-url", postUrl));

        const addBtn = postOuter.querySelector(".icon-btn.add-to-cart");
        if (addBtn) {
            addBtn.setAttribute("data-id", postId);
            addBtn.setAttribute("data-title", postTitle);
            addBtn.setAttribute("href", "#");
        }
        const wishBtn = postOuter.querySelector(".add-to-wishlist");
        if (wishBtn) {
            wishBtn.setAttribute("data-id", postId);
            wishBtn.setAttribute("data-title", postTitle);
            wishBtn.setAttribute("href", "#");
        }

        hydrateFromRawAndStorage(postOuter, postUrl, postBody, postTitle);
        parent.appendChild(postOuter);
    }

    function hydrateFromRawAndStorage(container, postUrl, rawHTML, postTitle) {
        try {
            const key = productStorageKey(postUrl);
            let stored = JSON.parse(localStorage.getItem(key)) || {
                images: [],
                variants: { groups: {}, details: {} },
                prices: { current: "", old: "" },
                stock: "",
                sale: "",
                brand: {},
                imageToVariant: {}
            };

            if (!stored.images.length) {
                const temp = document.createElement("div");
                temp.innerHTML = rawHTML;
                const seen = new Set();
                const imageToVariant = {};
                const variantDetails = {};
                const images = [];

                temp.querySelectorAll("img").forEach(i => {
                    const src = i.getAttribute("src");
                    if (!src || seen.has(src)) return;
                    seen.add(src);
                    images.push(src);
                    const alt = i.getAttribute("alt") || "";
                    const m = alt.match(/\[([^\]]+)\]/);
                    if (m) {
                        const parts = m[1].split(",").map(p => p.trim());
                        const variantStr = parts.find(p => p.startsWith("variant="))?.split("=")[1]?.trim();
                        if (variantStr) {
                            const normVariant = variantStr.toLowerCase();
                            variantDetails[normVariant] = {
                                images: variantDetails[normVariant]?.images || [],
                                oldPrice: parts.find(p => p.startsWith("old-price="))?.split("=")[1]?.trim() || "",
                                currentPrice: parts.find(p => p.startsWith("current-price="))?.split("=")[1]?.trim() || "",
                                stock: parts.find(p => p.startsWith("stock="))?.split("=")[1]?.trim() || "",
                                sale: parts.find(p => p.startsWith("sale="))?.split("=")[1]?.trim() || ""
                            };
                            variantDetails[normVariant].images.push(src);
                            imageToVariant[src] = normVariant;
                        }
                    }
                });

                stored.images = images;
                stored.variants.details = variantDetails;
                stored.imageToVariant = imageToVariant;
            }

            const mainWrapper = container.querySelector(".homepage-main-slider .swiper-wrapper");
            const thumbWrapper = container.querySelector(".homepage-thumb-slider .swiper-wrapper");
            if (mainWrapper && stored.images.length) {
                mainWrapper.innerHTML = "";
                stored.images.forEach(src => {
                    const slide = document.createElement("div");
                    slide.className = "swiper-slide";
                    slide.innerHTML = `<img src="${src}" alt="${escapeHtml(postTitle)}" loading="lazy">`;
                    mainWrapper.appendChild(slide);
                });
            }
            if (thumbWrapper && stored.images.length) {
                thumbWrapper.innerHTML = "";
                stored.images.forEach(src => {
                    const slide = document.createElement("div");
                    slide.className = "swiper-slide";
                    slide.innerHTML = `<img src="${src}" alt="${escapeHtml(postTitle)}" loading="lazy">`;
                    thumbWrapper.appendChild(slide);
                });
            }

            stored.sale = stored.sale || parseShortcode(rawHTML, "data-sale") || "";
            const saleDiv = container.querySelector(".saved-product-sale");
            if (saleDiv) {
                if (stored.sale) {
                    const norm = normalizeSaleValue(stored.sale);
                    saleDiv.textContent = norm;
                    saleDiv.setAttribute("data-saved-sale", norm);
                    saleDiv.style.display = "inline-block";
                } else {
                    saleDiv.style.display = "none";
                }
            }

            stored.prices.current = stored.prices.current || parseShortcode(rawHTML, "data-current-price") || "";
            stored.prices.old = stored.prices.old || parseShortcode(rawHTML, "data-old-price") || "";
            container.querySelectorAll(".saved-current-price").forEach(el => {
                if (stored.prices.current) {
                    el.textContent = formatPrice(stored.prices.current);
                    el.style.display = "inline-block";
                    el.setAttribute("data-saved-current-price", stored.prices.current);
                } else {
                    el.style.display = "none";
                }
            });
            container.querySelectorAll(".saved-old-price").forEach(el => {
                if (stored.prices.old) {
                    el.textContent = formatPrice(stored.prices.old);
                    el.style.display = "inline-block";
                    el.setAttribute("data-saved-old-price", stored.prices.old);
                } else {
                    el.style.display = "none";
                }
            });

            stored.stock = stored.stock || parseShortcode(rawHTML, "data-stock") || "";
            const stockDiv = container.querySelector(".saved-stock");
            if (stockDiv) {
                stockDiv.className = "saved-stock";
                if (stored.stock === "0" || /out\s*of\s*stock/i.test(stored.stock)) {
                    stockDiv.textContent = "Out of Stock";
                    stockDiv.classList.add("out-of-stock");
                    stockDiv.setAttribute("data-stock", "Out of Stock");
                } else if (!stored.stock || /in\s*stock/i.test(stored.stock)) {
                    stockDiv.textContent = "In Stock";
                    stockDiv.classList.add("in-stock");
                    stockDiv.setAttribute("data-stock", "In Stock");
                } else if (/^\d+$/.test(stored.stock)) {
                    stockDiv.innerHTML = "";
                    const numberSpan = document.createElement("span");
                    numberSpan.className = "stock-number";
                    numberSpan.textContent = stored.stock;
                    const textSpan = document.createElement("span");
                    textSpan.className = "stock-text";
                    textSpan.textContent = " In Stock";
                    stockDiv.appendChild(numberSpan);
                    stockDiv.appendChild(textSpan);
                    stockDiv.setAttribute("data-stock", stored.stock);
                } else {
                    stockDiv.textContent = stored.stock;
                    stockDiv.setAttribute("data-stock", stored.stock);
                }
            }
            updateButtonsByStock(stored.stock, cleanUrl(postUrl));

            // Handle brand image
            stored.brand = stored.brand && Object.keys(stored.brand).length ? stored.brand : parseBrandFromRaw(rawHTML);
            const brandImgDiv = container.querySelector(".saved-brand-image");
            if (brandImgDiv) {
                if (stored.brand && stored.brand.image) {
                    brandImgDiv.style.backgroundImage = `url('${stored.brand.image}')`;
                    brandImgDiv.setAttribute("data-brand-image", stored.brand.image);
                    brandImgDiv.style.display = "block";
                } else {
                    brandImgDiv.style.display = "none";
                }
            }

            stored.variants.groups = stored.variants.groups && Object.keys(stored.variants.groups).length ? stored.variants.groups : parseVariantsFromRaw(rawHTML);
            localStorage.setItem(key, JSON.stringify(stored));

            if (stored.variants && stored.variants.groups && Object.keys(stored.variants.groups).length > 0) {
                populateVariantGroups(container, stored.variants.groups, stored, rawHTML, stored.images);
            } else {
                // Hide variants container if no variants
                const variantsContainer = container.querySelector(".variants-container");
                if (variantsContainer) {
                    variantsContainer.classList.remove("show");
                }
            }
        } catch (e) {
            console.error("Hydration error for", postUrl, e);
        }
    }

    const selectionMap = new WeakMap();

    function populateVariantGroups(container, variantsSource, stored, rawHTML, baseImages) {
        if (!variantsSource || Object.keys(variantsSource).length === 0) {
            const variantsContainer = container.querySelector(".variants-container");
            if (variantsContainer) {
                variantsContainer.classList.remove("show");
            }
            return;
        }

        if (!window.clearSelection) {
            window.clearSelection = function (btn) {
                try {
                    const containerBlock = btn.closest(".product-variants");
                    if (!containerBlock) return;
                    containerBlock.querySelectorAll(".variant-group span").forEach(s => s.classList.remove("selected"));
                    btn.style.display = "none";
                    const post = btn.closest(".post-outer") || btn.closest(".product-details");
                    if (post) {
                        const topContainer = post.closest(".post-outer") || post;
                        applyVariantSelection(topContainer, {}, stored, rawHTML, baseImages);
                    }
                } catch (e) { /* noop */ }
            };
        }

        const groupPriority = ["group-1", "group-2", "group-3"];
        const selected = {};
        selectionMap.set(container, selected);

        const variantsContainer = container.querySelector(".variants-container");
        if (variantsContainer) {
            variantsContainer.classList.add("show"); // Use class to control visibility
        }

        groupPriority.forEach(groupKey => {
            const groupData = variantsSource[groupKey];
            if (!groupData || !groupData.values || !groupData.values.length) {
                const containerHolder = container.querySelector(`.${groupKey}-container`);
                if (containerHolder) {
                    containerHolder.classList.remove("show");
                }
                return;
            }

            const label = groupData.label || "";
            const values = groupData.values;
            const containerHolder = container.querySelector(`.${groupKey}-container`);
            const groupEl = container.querySelector(`.variant-group.${groupKey}`);
            const clearBtn = containerHolder ? containerHolder.querySelector(".clear-btn") : null;

            if (!containerHolder || !groupEl) {
                console.warn(`Missing container or group element for ${groupKey}`);
                return;
            }

            containerHolder.classList.add("show"); // Use class to control visibility
            const strong = containerHolder.querySelector("strong");
            if (strong) strong.textContent = `${label}:`;

            groupEl.innerHTML = "";

            values.forEach(val => {
                const span = document.createElement("span");
                const cleanVal = String(val).replace(/\u00A0/g, " ").trim();
                const normalized = cleanVal.toLowerCase();

                if (groupKey === "group-1") {
                    const colorMatch = cleanVal.match(/\((#[^)]+)\)/);
                    if (colorMatch) {
                        span.style.backgroundColor = colorMatch[1];
                        span.setAttribute("data-color", colorMatch[1]);
                        const labelText = cleanVal.split("(")[0].trim();
                        span.setAttribute("data-label", labelText);
                        span.setAttribute("data-label-normalized", labelText.toLowerCase());
                    } else {
                        span.style.backgroundColor = cleanVal.toLowerCase();
                        span.setAttribute("data-label", cleanVal);
                        span.setAttribute("data-label-normalized", normalized);
                    }
                } else if (groupKey === "group-2") {
                    span.textContent = cleanVal;
                    span.setAttribute("data-label", cleanVal);
                    span.setAttribute("data-label-normalized", normalized);
                } else if (groupKey === "group-3") {
                    const imgMatch = cleanVal.match(/^(.*?)\s*\{(https?:\/\/[^\}\s]+(?:[^\}\s]*?)?)\}\s*$/i);
                    if (imgMatch) {
                        const name = imgMatch[1].trim();
                        const url = imgMatch[2].trim();
                        span.style.backgroundImage = `url("${url}")`;
                        span.setAttribute("data-img", url);
                        span.setAttribute("data-label", name);
                        span.setAttribute("data-label-normalized", name.toLowerCase());
                        span.setAttribute("title", name);
                    } else {
                        span.textContent = cleanVal;
                        span.setAttribute("data-label", cleanVal);
                        span.setAttribute("data-label-normalized", normalized);
                    }
                } else {
                    span.textContent = cleanVal;
                    span.setAttribute("data-label", cleanVal);
                    span.setAttribute("data-label-normalized", normalized);
                }

                span.addEventListener("click", function () {
                    groupEl.querySelectorAll("span").forEach(s => s.classList.remove("selected"));
                    span.classList.add("selected");
                    selected[groupKey] = span.getAttribute("data-label-normalized") || span.innerText.trim().toLowerCase();
                    if (clearBtn) clearBtn.style.display = "inline";
                    const postContainer = container.closest(".post-outer") || container;
                    applyVariantSelection(postContainer, selected, stored, rawHTML, baseImages);
                });

                groupEl.appendChild(span);
            });

            if (clearBtn) {
                clearBtn.style.display = "none";
                clearBtn.addEventListener("click", function () {
                    groupEl.querySelectorAll("span").forEach(s => s.classList.remove("selected"));
                    clearBtn.style.display = "none";
                    delete selected[groupKey];
                    const postContainer = container.closest(".post-outer") || container;
                    applyVariantSelection(postContainer, selected, stored, rawHTML, baseImages);
                });
            }
        });
    }

    function applyVariantSelection(postContainer, selected, stored, rawHTML, baseImages) {
        try {
            const mainWrapper = postContainer.querySelector(".homepage-main-slider .swiper-wrapper");
            const thumbWrapper = postContainer.querySelector(".homepage-thumb-slider .swiper-wrapper");
            const variantDetails = (stored && stored.variants && stored.variants.details) ? stored.variants.details : {};

            const priorityGroups = ["group-1", "group-2", "group-3"];
            const candidates = [];
            priorityGroups.forEach(k => { if (selected[k]) candidates.push(selected[k].toLowerCase()); });

            function findStoredVariantByCandidates() {
                if (!variantDetails || Object.keys(variantDetails).length === 0) return null;
                const keys = Object.keys(variantDetails);
                for (let c of candidates) {
                    for (let k of keys) {
                        const kk = String(k).toLowerCase();
                        if (kk === c || kk === c.replace(/\s+/g, '-') || kk.indexOf(c) !== -1 || c.indexOf(kk) !== -1) {
                            return variantDetails[k];
                        }
                    }
                }
                if (candidates.length > 1) {
                    const joined = candidates.join("-");
                    for (let k of keys) {
                        if (String(k).toLowerCase() === joined) return variantDetails[k];
                    }
                }
                return null;
            }

            const matchedStoredVariant = findStoredVariantByCandidates();

            let imagesToShow = [];
            if (matchedStoredVariant && matchedStoredVariant.images && matchedStoredVariant.images.length) {
                imagesToShow = matchedStoredVariant.images.slice();
            } else {
                const s3 = postContainer.querySelector(".variant-group.group-3 span.selected");
                if (s3 && s3.dataset && s3.dataset.img) imagesToShow.push(s3.dataset.img);
                const s1 = postContainer.querySelector(".variant-group.group-1 span.selected");
                if (!imagesToShow.length && s1) {
                    const possible = s1.getAttribute("data-label-normalized") || s1.innerText.trim().toLowerCase();
                    if (variantDetails) {
                        for (let k in variantDetails) {
                            if (String(k).toLowerCase() === possible || String(k).toLowerCase().includes(possible)) {
                                const v = variantDetails[k];
                                if (v && v.images && v.images.length) {
                                    imagesToShow = imagesToShow.concat(v.images);
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            if (!imagesToShow.length && stored && stored.images && stored.images.length) imagesToShow = stored.images.slice();
            if (!imagesToShow.length && baseImages && baseImages.length) imagesToShow = baseImages.slice();

            imagesToShow = imagesToShow.filter((v, i, a) => v && a.indexOf(v) === i);

            if (imagesToShow.length) {
                const targetSrc = imagesToShow[0];
                const mainSwiperEl = postContainer.querySelector(".homepage-main-slider").swiper;
                const thumbSwiperEl = postContainer.querySelector(".homepage-thumb-slider").swiper;

                if (mainSwiperEl && mainSwiperEl.slides) {
                    const targetIndex = [...mainSwiperEl.slides].findIndex(slide => {
                        const img = slide.querySelector("img");
                        return img && img.getAttribute("src") === targetSrc;
                    });
                    if (targetIndex !== -1) {
                        mainSwiperEl.slideTo(targetIndex);
                        if (thumbSwiperEl) thumbSwiperEl.slideTo(targetIndex);
                    }
                }
            }

            const cur = (matchedStoredVariant && (matchedStoredVariant.currentPrice || matchedStoredVariant.currentprice || matchedStoredVariant.current)) ? (matchedStoredVariant.currentPrice || matchedStoredVariant.currentprice || matchedStoredVariant.current) : (stored.prices && stored.prices.current ? stored.prices.current : parseShortcode(rawHTML, "data-current-price"));
            const old = (matchedStoredVariant && (matchedStoredVariant.oldPrice || matchedStoredVariant.oldprice || matchedStoredVariant.old)) ? (matchedStoredVariant.oldPrice || matchedStoredVariant.oldprice || matchedStoredVariant.old) : (stored.prices && stored.prices.old ? stored.prices.old : parseShortcode(rawHTML, "data-old-price"));
            const stock = (matchedStoredVariant && (matchedStoredVariant.stock || matchedStoredVariant.qty)) ? (matchedStoredVariant.stock || matchedStoredVariant.qty) : (stored.stock || parseShortcode(rawHTML, "data-stock"));
            const sale = (matchedStoredVariant && matchedStoredVariant.sale) ? matchedStoredVariant.sale : (stored.sale || parseShortcode(rawHTML, "data-sale"));

            postContainer.querySelectorAll(".saved-current-price").forEach(el => {
                if (cur) {
                    el.textContent = formatPrice(cur);
                    el.style.display = "inline-block";
                    el.setAttribute("data-saved-current-price", cur);
                } else {
                    el.style.display = "none";
                }
            });
            postContainer.querySelectorAll(".saved-old-price").forEach(el => {
                if (old) {
                    el.textContent = formatPrice(old);
                    el.style.display = "inline-block";
                    el.setAttribute("data-saved-old-price", old);
                } else {
                    el.style.display = "none";
                }
            });

            const saleDiv = postContainer.querySelector(".saved-product-sale");
            if (saleDiv) {
                if (sale) {
                    const norm = normalizeSaleValue(sale);
                    saleDiv.textContent = norm;
                    saleDiv.setAttribute("data-saved-sale", norm);
                    saleDiv.style.display = "inline-block";
                } else {
                    saleDiv.style.display = "none";
                }
            }

            const stockDiv = postContainer.querySelector(".saved-stock");
            if (stockDiv) {
                if (stock === "0" || /out\s*of\s*stock/i.test(stock)) {
                    stockDiv.textContent = "Out of Stock";
                    stockDiv.classList.add("out-of-stock");
                    stockDiv.setAttribute("data-stock", "Out of Stock");
                } else if (!stock || /in\s*stock/i.test(stock)) {
                    stockDiv.textContent = "In Stock";
                    stockDiv.classList.add("in-stock");
                    stockDiv.setAttribute("data-stock", "In Stock");
                } else if (/^\d+$/.test(String(stock))) {
                    stockDiv.innerHTML = "";
                    const numberSpan = document.createElement("span");
                    numberSpan.className = "stock-number";
                    numberSpan.textContent = stock;
                    const textSpan = document.createElement("span");
                    textSpan.className = "stock-text";
                    textSpan.textContent = " In Stock";
                    stockDiv.appendChild(numberSpan);
                    stockDiv.appendChild(textSpan);
                    stockDiv.setAttribute("data-stock", stock);
                } else {
                    stockDiv.textContent = stock;
                    stockDiv.setAttribute("data-stock", stock);
                }
            }
            updateButtonsByStock(stock, cleanUrl(postContainer.querySelector(".post")?.getAttribute("data-post-url") || ""));
        } catch (e) {
            console.error("applyVariantSelection error:", e);
        }
    }

    function normalizeSaleValue(v) {
        if (!v) return "";
        v = String(v).trim();
        let m = v.match(/(-?\d+)\s*%?/);
        if (m) return `${parseInt(m[1], 10)}%`;
        return v;
    }

    function updateButtonsByStock(stockVal, postUrlClean) {
        document.querySelectorAll(`.post[data-post-url="${postUrlClean}"] .icon-btn`).forEach(btn => {
            if (stockVal === "0" || /out\s*of\s*stock/i.test(String(stockVal))) btn.classList.add("disabled-button");
            else btn.classList.remove("disabled-button");
        });
    }

    function escapeHtml(str) {
        return String(str || "").replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
    }

    function initializeSlidersAndVariants() {
        document.querySelectorAll(".homepage-slider-wrapper").forEach((wrapper, index) => {
            const postId = wrapper.getAttribute("data-post-id");
            const postContainer = wrapper.closest(".post-outer");
            const postUrl = postContainer.querySelector(".product-title-link")?.getAttribute("href") || "#";
            const key = productStorageKey(postUrl);
            const stored = JSON.parse(localStorage.getItem(key)) || {};
            const images = stored.images || [];
            const variantDetails = stored.variants?.details || {};
            const imageToVariant = stored.imageToVariant || {};

            if (!images.length) return;

            if (images.length <= 1) {
                const prevBtn = wrapper.querySelector(".swiper-button-prev");
                const nextBtn = wrapper.querySelector(".swiper-button-next");
                if (prevBtn) prevBtn.style.display = "none";
                if (nextBtn) nextBtn.style.display = "none";
            }

            const thumbSwiper = new Swiper(wrapper.querySelector(".homepage-thumb-slider"), {
                slidesPerView: "auto",
                watchSlidesProgress: true,
                freeMode: true,
                roundLengths: true,
                spaceBetween: 0
            });

            const mainSwiper = new Swiper(wrapper.querySelector(".homepage-main-slider"), {
                effect: "fade",
                fadeEffect: { crossFade: true },
                speed: 1200,
                slidesPerView: 1,
                loop: false,
                roundLengths: true,
                spaceBetween: 0,
                navigation: { prevEl: wrapper.querySelector(".swiper-button-prev"), nextEl: wrapper.querySelector(".swiper-button-next") },
                thumbs: { swiper: thumbSwiper }
            });

            const resizeObserver = new ResizeObserver(() => {
                mainSwiper.update();
                thumbSwiper.update();
            });
            resizeObserver.observe(wrapper);

            function updateProductDetails(variantName) {
                const variantData = variantName ? variantDetails[variantName] : null;
                const cp = (variantData && variantData.currentPrice) ? variantData.currentPrice : stored.prices.current || "";
                const op = (variantData && variantData.oldPrice) ? variantData.oldPrice : stored.prices.old || "";
                const stock = (variantData && variantData.stock) ? variantData.stock : stored.stock || "";
                const sale = (variantData && variantData.sale) ? variantData.sale : stored.sale || "";

                postContainer.querySelectorAll(".saved-current-price").forEach(el => {
                    if (cp) {
                        el.textContent = formatPrice(cp);
                        el.style.display = "inline-block";
                        el.setAttribute("data-saved-current-price", cp);
                    } else {
                        el.style.display = "none";
                    }
                });
                postContainer.querySelectorAll(".saved-old-price").forEach(el => {
                    if (op) {
                        el.textContent = formatPrice(op);
                        el.style.display = "inline-block";
                        el.setAttribute("data-saved-old-price", op);
                    } else {
                        el.style.display = "none";
                    }
                });

                const stockDiv = postContainer.querySelector(".saved-stock");
                if (stockDiv) {
                    stockDiv.className = "saved-stock";
                    if (stock === "0" || /out\s*of\s*stock/i.test(stock)) {
                        stockDiv.textContent = "Out of Stock";
                        stockDiv.classList.add("out-of-stock");
                        stockDiv.setAttribute("data-stock", "Out of Stock");
                    } else if (!stock || /in\s*stock/i.test(stock)) {
                        stockDiv.textContent = "In Stock";
                        stockDiv.classList.add("in-stock");
                        stockDiv.setAttribute("data-stock", "In Stock");
                    } else if (/^\d+$/.test(stock)) {
                        stockDiv.innerHTML = `<span class="stock-number">${stock}</span><span class="stock-text"> In Stock</span>`;
                        stockDiv.setAttribute("data-stock", stock);
                    } else {
                        stockDiv.textContent = stock;
                        stockDiv.setAttribute("data-stock", stock);
                    }
                }
                updateButtonsByStock(stock, cleanUrl(postUrl));

                const saleDiv = postContainer.querySelector(".saved-product-sale");
                if (saleDiv) {
                    if (sale) {
                        const norm = normalizeSaleValue(sale);
                        saleDiv.textContent = norm;
                        saleDiv.setAttribute("data-saved-sale", norm);
                        saleDiv.style.display = "inline-block";
                    } else {
                        saleDiv.style.display = "none";
                    }
                }
            }

            function updateVariantSelectionUI(variantName) {
                const variantContainer = postContainer.querySelector(".homepage-view-variants");
                if (!variantContainer) return;
                const nameLower = variantName ? variantName.toLowerCase() : null;
                variantContainer.querySelectorAll("span[data-label-normalized]").forEach(btn => {
                    const btnLabel = btn.getAttribute("data-label-normalized");
                    btn.classList.toggle("selected", btnLabel === nameLower);
                });
            }

            const variantContainer = postContainer.querySelector(".homepage-view-variants");
            if (variantContainer) {
                variantContainer.querySelectorAll("span[data-label-normalized]").forEach(btn => {
                    btn.addEventListener("click", function () {
                        const label = this.getAttribute("data-label-normalized");
                        const variantInfo = variantDetails[label];
                        if (variantInfo && variantInfo.images && variantInfo.images.length) {
                            const index = images.indexOf(variantInfo.images[0]);
                            if (index !== -1) mainSwiper.slideTo(index);
                        }
                        updateVariantSelectionUI(label);
                        updateProductDetails(label);
                    });
                });
            }

            mainSwiper.on("slideChange", function () {
                const currentIndex = this.activeIndex;
                const currentSrc = this.slides[currentIndex].querySelector("img").getAttribute("src");
                const variantName = imageToVariant[currentSrc] || null;
                updateVariantSelectionUI(variantName);
                updateProductDetails(variantName);
            });

            const initialIndex = mainSwiper.activeIndex;
            const initialSrc = mainSwiper.slides[initialIndex].querySelector("img")?.getAttribute("src");
            const initialVariant = initialSrc ? imageToVariant[initialSrc] : null;
            updateVariantSelectionUI(initialVariant);
            updateProductDetails(initialVariant);
        });
    }
})();

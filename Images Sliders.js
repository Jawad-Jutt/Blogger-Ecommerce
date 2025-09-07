  //------------------------------------------Fullpage view Product Images Slider Script----------------------------------------------------//

    document.addEventListener('DOMContentLoaded', () => {
      const postBody = document.querySelector(".post-body"); const sliderWrapper = document.querySelector('.global-zoom-slider'); const loadingIndicator = document.querySelector('.global-loading'); if (!postBody || !sliderWrapper) { if (loadingIndicator) loadingIndicator.style.display = 'none'; if (sliderWrapper) sliderWrapper.style.display = 'none'; console.error("Required .post-body or .global-zoom-slider element not found."); return }
      const media = []; const imageUrls = new Set(); const postImages = postBody.querySelectorAll("img"); postImages.forEach(img => {
        const src = img.getAttribute("src"); const alt = img.getAttribute("alt") || "Product Image"; if (src && !imageUrls.has(src)) { imageUrls.add(src); media.push({ type: 'image', src: src, alt: alt }) }
        const parent = img.parentElement; if (parent && parent.classList.contains('separator')) { parent.style.display = 'none' } else { img.style.display = 'none' }
      }); postBody.querySelectorAll(".separator").forEach(separator => {
        separator.style.display = "none"; const prev = separator.previousElementSibling; const next = separator.nextElementSibling; if (prev && prev.tagName === "BR") { prev.style.display = "none" }
        if (next && next.tagName === "BR") { next.style.display = "none" }
      }); postBody.querySelectorAll("p, div").forEach(el => { const html = el.innerHTML.trim().toLowerCase(); if (el.textContent.trim() === "" && (html === "" || html === "<br>" || html === "<br/>" || html === "<br />")) { el.style.display = "none" } }); if (media.length === 0) { if (loadingIndicator) loadingIndicator.style.display = "none"; sliderWrapper.style.display = 'none'; return }
      const zoomSettings = { active: !1, level: 1.0, minZoom: 1.0, maxZoom: 5.0, }; const mainWrapper = document.getElementById('globalMainSlider'); const thumbWrapper = document.getElementById('globalThumbSlider'); const fullscreenMediaContainer = document.querySelector('.global-fullscreen-img'); const preloadMedia = () => { let loadedCount = 0; media.forEach(item => { const img = new Image(); img.src = item.src; img.onload = img.onerror = () => { loadedCount++; if (loadedCount === media.length) { if (loadingIndicator) loadingIndicator.style.display = 'none' } } }) }; const createSlides = () => {
        media.forEach((item, index) => {
          const mainSlide = document.createElement('div'); mainSlide.className = 'swiper-slide'; mainSlide.innerHTML = `
                        <div class="zoom-container" data-index="${index}">
                            <img src="${item.src}" alt="${item.alt}" class="main-image" loading="lazy"/>
                            <div class="controls">
                                <div class="global-control-btn fullscreen-btn" data-index="${index}" aria-label="Enter fullscreen">
                                    <i class="fas fa-expand"></i>
                                </div>
                                <div class="global-control-btn zoom-in" aria-label="Zoom in">
                                    <i class="fas fa-search-plus"></i>
                                </div>
                                <div class="global-control-btn zoom-out" aria-label="Zoom out">
                                    <i class="fas fa-search-minus"></i>
                                </div>
                                <div class="global-control-btn zoom-reset" aria-label="Reset zoom">
                                    <i class="fas fa-sync-alt"></i>
                                </div>
                                <div class="zoom-value" aria-live="polite">${zoomSettings.level.toFixed(1)}x</div>
                            </div>
                        </div>`; mainWrapper.appendChild(mainSlide); const thumbSlide = document.createElement('div'); thumbSlide.className = 'swiper-slide'; thumbSlide.innerHTML = `<img src="${item.src}" alt="${item.alt}" loading="lazy"/>`; thumbWrapper.appendChild(thumbSlide)
        })
      }; let mainSwiper, thumbSwiper; const initializeSwiper = () => { thumbSwiper = new Swiper('.global-thumb-slider', { slidesPerView: 'auto', spaceBetween: 10, freeMode: !0, watchSlidesProgress: !0, navigation: { nextEl: '.global-slider-nav.next', prevEl: '.global-slider-nav.prev', } }); mainSwiper = new Swiper('.global-main-slider', { loop: media.length > 1, thumbs: { swiper: thumbSwiper }, speed: 800, grabCursor: !0, effect: 'slide', spaceBetween: '20px', on: { slideChange: () => updateAllZoomDisplays() } }) }; const initializeZoom = () => { document.querySelectorAll('.zoom-container').forEach(container => { const img = container.querySelector('.main-image'); const zoomInBtn = container.querySelector('.zoom-in'); const zoomOutBtn = container.querySelector('.zoom-out'); const zoomResetBtn = container.querySelector('.zoom-reset'); const zoomValue = container.querySelector('.zoom-value'); const updateZoom = () => { zoomValue.textContent = `${zoomSettings.level.toFixed(1)}x`; img.style.transform = `scale(${zoomSettings.level})`; zoomInBtn.classList.toggle('active', zoomSettings.active && zoomSettings.level > 1); zoomOutBtn.classList.toggle('disabled', zoomSettings.level <= 1); zoomResetBtn.classList.toggle('disabled', zoomSettings.level <= 1); zoomInBtn.classList.toggle('disabled', zoomSettings.level >= zoomSettings.maxZoom) }; const onMouseMove = (e) => { if (zoomSettings.level > 1) { const rect = img.getBoundingClientRect(); const x = (e.clientX - rect.left) / rect.width * 100; const y = (e.clientY - rect.top) / rect.height * 100; img.style.transformOrigin = `${x}% ${y}%` } else { img.style.transformOrigin = 'center center' } }; container.addEventListener('mousemove', onMouseMove); container.addEventListener('mouseleave', () => { if (zoomSettings.level <= 1) img.style.transformOrigin = 'center center' }); container.addEventListener('touchmove', (e) => { if (e.touches.length === 1) onMouseMove(e.touches[0]); }); zoomInBtn.addEventListener('click', e => { e.stopPropagation(); if (zoomSettings.level < zoomSettings.maxZoom) { zoomSettings.level = Math.min(zoomSettings.maxZoom, zoomSettings.level + 0.25); zoomSettings.active = !0; updateAllZoomDisplays() } }); zoomOutBtn.addEventListener('click', e => { e.stopPropagation(); if (zoomSettings.level > zoomSettings.minZoom) { zoomSettings.level = Math.max(zoomSettings.minZoom, zoomSettings.level - 0.25); if (zoomSettings.level <= 1) zoomSettings.active = !1; updateAllZoomDisplays() } }); zoomResetBtn.addEventListener('click', e => { e.stopPropagation(); zoomSettings.level = 1.0; zoomSettings.active = !1; updateAllZoomDisplays() }); if (img.complete) updateZoom(); else img.onload = updateZoom }) }; const updateAllZoomDisplays = () => {
        document.querySelectorAll('.zoom-container').forEach(container => {
          const img = container.querySelector('.main-image'); const zoomValue = container.querySelector('.zoom-value'); const zoomInBtn = container.querySelector('.zoom-in'); const zoomOutBtn = container.querySelector('.zoom-out'); const zoomResetBtn = container.querySelector('.zoom-reset'); if (img) { img.style.transform = `scale(${zoomSettings.level})`; if (zoomSettings.level <= 1) img.style.transformOrigin = 'center center' }
          if (zoomValue) zoomValue.textContent = `${zoomSettings.level.toFixed(1)}x`; if (zoomInBtn) { zoomInBtn.classList.toggle('active', zoomSettings.active && zoomSettings.level > 1); zoomOutBtn.classList.toggle('disabled', zoomSettings.level <= 1); zoomResetBtn.classList.toggle('disabled', zoomSettings.level <= 1); zoomInBtn.classList.toggle('disabled', zoomSettings.level >= zoomSettings.maxZoom) }
        })
      }; const initializeFullscreen = () => { const fullscreenOverlay = document.querySelector('.global-fullscreen'); const fullscreenClose = document.querySelector('.global-fullscreen-close'); const fullscreenZoomIn = document.querySelector('.fullscreen-zoom-in'); const fullscreenZoomOut = document.querySelector('.fullscreen-zoom-out'); const fullscreenReset = document.querySelector('.fullscreen-reset'); const fullscreenNavPrev = document.querySelector('.fullscreen-main-nav.prev'); const fullscreenNavNext = document.querySelector('.fullscreen-main-nav.next'); let fullscreenZoom = 1; let isDragging = !1; let startPos = { x: 0, y: 0 }; let translate = { x: 0, y: 0 }; let currentImageIndex = 0; const updateFullscreenMedia = (index) => { currentImageIndex = (index + media.length) % media.length; const item = media[currentImageIndex]; const imgElement = document.querySelector('.global-fullscreen-img'); imgElement.src = item.src; imgElement.alt = item.alt; mainSwiper.slideToLoop(currentImageIndex); resetFullscreenPosition() }; const resetFullscreenPosition = () => { translate = { x: 0, y: 0 }; fullscreenZoom = 1; updateFullscreenZoom() }; const updateFullscreenZoom = () => { const mediaElement = document.querySelector('.global-fullscreen-img'); if (mediaElement) { mediaElement.style.transform = `translate(${translate.x}px, ${translate.y}px) scale(${fullscreenZoom})` } }; document.querySelectorAll('.fullscreen-btn').forEach(btn => { btn.addEventListener('click', () => { const index = parseInt(btn.getAttribute('data-index'), 10); updateFullscreenMedia(index); fullscreenOverlay.classList.add('active') }) }); fullscreenNavPrev.addEventListener('click', () => updateFullscreenMedia(currentImageIndex - 1)); fullscreenNavNext.addEventListener('click', () => updateFullscreenMedia(currentImageIndex + 1)); fullscreenClose.addEventListener('click', () => fullscreenOverlay.classList.remove('active')); fullscreenZoomIn.addEventListener('click', e => { e.stopPropagation(); if (fullscreenZoom < 5) { fullscreenZoom = Math.min(5, fullscreenZoom + 0.25); updateFullscreenZoom() } }); fullscreenZoomOut.addEventListener('click', e => { e.stopPropagation(); if (fullscreenZoom > 1) { fullscreenZoom = Math.max(1, fullscreenZoom - 0.25); updateFullscreenZoom() } }); fullscreenReset.addEventListener('click', e => { e.stopPropagation(); resetFullscreenPosition() }); const mediaElement = document.querySelector('.global-fullscreen-img'); const startDrag = (e, isTouch = !1) => { if (fullscreenZoom > 1) { isDragging = !0; mediaElement.classList.add('dragging'); const point = isTouch ? e.touches[0] : e; startPos = { x: point.clientX - translate.x, y: point.clientY - translate.y }; e.preventDefault() } }; const drag = (e, isTouch = !1) => { if (isDragging) { const point = isTouch ? e.touches[0] : e; translate.x = point.clientX - startPos.x; translate.y = point.clientY - startPos.y; updateFullscreenZoom(); if (isTouch) e.preventDefault(); } }; const endDrag = () => { if (isDragging) { isDragging = !1; mediaElement.classList.remove('dragging') } }; mediaElement.addEventListener('mousedown', (e) => startDrag(e, !1)); window.addEventListener('mousemove', (e) => drag(e, !1)); window.addEventListener('mouseup', endDrag); mediaElement.addEventListener('touchstart', (e) => startDrag(e, !0)); window.addEventListener('touchmove', (e) => drag(e, !0)); window.addEventListener('touchend', endDrag) }; preloadMedia(); createSlides(); initializeSwiper(); initializeZoom(); initializeFullscreen()
    })



    //-----------------------Fullpage view Slider scroll on Variants selection-------------------------------//


document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for the page + Swiper to initialize. We'll poll until found.
  function waitForSwiper(cb, attempt = 0) {
    const sliderEl = document.querySelector('.global-main-slider');
    const inst = sliderEl?.swiper;
    if (inst) return cb(inst);
    if (attempt >= 50) { // ~5 seconds max
      console.error('VariantSync: Swiper instance not found after retries.');
      return;
    }
    setTimeout(() => waitForSwiper(cb, attempt + 1), 100);
  }

  waitForSwiper((swiperInstance) => {
    try {
      console.debug('VariantSync: Swiper instance found.', swiperInstance);
      const imageAltMap = [];

      // Read fixed defaults (do not mutate these)
      const raw = document.body.innerText || '';
      const defaults = {
        oldPrice: (raw.match(/\[data-old-price="(.*?)"\]/)?.[1] || "").trim(),
        currentPrice: (raw.match(/\[data-current-price="(.*?)"\]/)?.[1] || "").trim(),
        stock: (raw.match(/\[data-stock="(.*?)"\]/)?.[1] || "In Stock").trim(),
        sale: (raw.match(/\[data-sale="(.*?)"\]/)?.[1] || "").trim(),
        badge: (raw.match(/\[data-badge="(.*?)"\]/)?.[1] || "").trim()
      };
      console.debug('VariantSync: Defaults', defaults);

      const allowedBadges = ["Hot", "New", "Best Seller", "Deal", "Trending", "Popular", "Limited Time", "Top Rated", "Free Shipping", "Recommended", "Free", "Sponsered"];
      const badgeClassMap = {
        "Hot": "badge-hot",
        "New": "badge-new",
        "Best Seller": "badge-best-seller",
        "Deal": "badge-deal",
        "Trending": "badge-trending",
        "Popular": "badge-popular",
        "Limited Time": "badge-limited-time",
        "Top Rated": "badge-top-rated",
        "Free Shipping": "badge-free-shipping",
        "Recommended": "badge-recommended",
        "Free": "badge-free",
        "Sponsered": "badge-sponsored"
      };

      // Helper: safe parse of a bracket that contains variant=
      function parseVariantFromAlt(alt) {
        if (!alt) return null;
        // find a bracketed segment that contains "variant="
        const bracketMatch = alt.match(/\[([^\]]*variant=[^\]]*)\]/i);
        if (!bracketMatch) return null;
        const content = bracketMatch[1];
        // split on commas that are not inside quotes (defensive)
        const parts = content.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(p => p.trim()).filter(Boolean);
        const values = {};
        let name = null;
        parts.forEach(part => {
          const idx = part.indexOf('=');
          if (idx === -1) return;
          const key = part.slice(0, idx).trim().toLowerCase();
          let val = part.slice(idx + 1).trim();
          // strip wrapping quotes if present
          if (/^".*"$/.test(val) || /^'.*'$/.test(val)) val = val.slice(1, -1).trim();
          if (key === 'variant') name = val;
          else if (key === 'old-price') values.oldPrice = val;
          else if (key === 'current-price') values.currentPrice = val;
          else if (key === 'stock') values.stock = val;
          else if (key === 'sale') values.sale = val;
          else if (key === 'badge') {
            if (allowedBadges.includes(val)) values.badge = val;
            else values.badge = val; // still set, validation happens on display
          }
        });
        if (!name) return null;
        return { name, values };
      }

      // Build imageAltMap from slides (index stored as Number)
      swiperInstance.slides.forEach(slide => {
        const rawIndex = slide.getAttribute('data-swiper-slide-index');
        const realIndex = rawIndex === null ? undefined : Number(rawIndex);
        const img = slide.querySelector('img');
        const alt = img?.alt || '';
        const parsed = parseVariantFromAlt(alt);
        const entry = {
          index: realIndex,
          name: parsed?.name ?? null,
          values: parsed?.values ?? {}
        };
        imageAltMap.push(entry);
      });

      // Normalize indices to numbers where possible
      imageAltMap.forEach(e => { if (e.index !== undefined) e.index = Number(e.index); });

      console.debug('VariantSync: Parsed imageAltMap', imageAltMap);

      // Price formatting (keeps original behavior)
      function formatPrice(value) {
        if (!value) return "";
        const m = value.match(/^([^\d\s,.\-]*)\s*(.*)$/);
        const symbol = (m?.[1] || "").trim();
        let numberPart = (m?.[2] || "").replace(/\s+/g, "").replace(/,/g, "");
        const decimalMatch = numberPart.match(/^(\d+)(\.\d{1,2})?$/);
        if (!decimalMatch) return value.trim();
        const integerPart = decimalMatch[1];
        const decimalPart = decimalMatch[2] || "";
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return symbol ? `${symbol} ${formattedInteger}${decimalPart}` : `${formattedInteger}${decimalPart}`;
      }

      // Merge defaults with variant values WITHOUT mutating defaults
      function getMergedValues(variant) {
        if (!variant) return { ...defaults };
        const v = variant.values || {};
        return {
          oldPrice: (v.oldPrice !== undefined && v.oldPrice !== null && String(v.oldPrice).trim() !== '') ? v.oldPrice : defaults.oldPrice,
          currentPrice: (v.currentPrice !== undefined && v.currentPrice !== null && String(v.currentPrice).trim() !== '') ? v.currentPrice : defaults.currentPrice,
          stock: (v.stock !== undefined && v.stock !== null && String(v.stock).trim() !== '') ? v.stock : defaults.stock,
          sale: (v.sale !== undefined && v.sale !== null && String(v.sale).trim() !== '') ? v.sale : defaults.sale,
          badge: (v.badge !== undefined && v.badge !== null && String(v.badge).trim() !== '') ? v.badge : defaults.badge
        };
      }

      // Update UI function
      function updateDisplayWithData(data) {
        document.querySelectorAll('.post[data-post-url]').forEach(post => {
          const oldPrice = data.oldPrice;
          const currentPrice = data.currentPrice;
          const stock = data.stock;
          const sale = data.sale;
          const badge = data.badge;

          // old price
          post.querySelectorAll('.saved-old-price').forEach(div => {
            div.style.display = oldPrice ? 'inline-block' : 'none';
            if (oldPrice) div.textContent = formatPrice(oldPrice);
          });

          // current price
          post.querySelectorAll('.saved-current-price').forEach(div => {
            div.style.display = currentPrice ? 'inline-block' : 'none';
            if (currentPrice) div.textContent = formatPrice(currentPrice);
          });

          // stock
          post.querySelectorAll('.saved-stock').forEach(div => {
            div.className = 'saved-stock';
            div.innerHTML = '';
            if (stock === 'Out of Stock' || stock === '0') {
              div.textContent = 'Out of Stock';
              div.classList.add('out-of-stock');
            } else if (stock === 'In Stock') {
              div.textContent = 'In Stock';
              div.classList.add('in-stock');
            } else if (/^\d+$/.test(String(stock).trim())) {
              div.innerHTML = `<span class="stock-number">${stock}</span><span class="stock-text"> In Stock</span>`;
            } else if (stock) {
              div.textContent = stock;
            }
          });

          // disable buttons if out of stock
          post.querySelectorAll('.icon-btn').forEach(btn => {
            btn.classList.toggle('disabled-button', stock === '0' || stock === 'Out of Stock');
          });

          // sale %
          post.querySelectorAll('.saved-product-sale').forEach(div => {
            const percent = parseInt(String(sale || ''), 10);
            const valid = (typeof sale === 'string' && sale.endsWith('%') && !isNaN(percent));
            div.style.display = valid ? 'inline-block' : 'none';
            if (valid) div.textContent = sale;
          });

          // badge
          post.querySelectorAll('.saved-product-badge').forEach(div => {
            const valid = badge && allowedBadges.includes(badge);
            div.style.display = valid ? 'inline-block' : 'none';
            if (valid) {
              div.textContent = badge;
              div.className = `saved-product-badge ${badgeClassMap[badge] || ''}`;
            }
          });
        });
      }

      // Public: updateDisplay by variant name (keeps defaults constant)
      function updateDisplay(variantName) {
        const variant = variantName ? imageAltMap.find(v => v.name && v.name.toLowerCase() === String(variantName).toLowerCase()) : null;
        const merged = getMergedValues(variant);
        console.debug('VariantSync: updateDisplay for', variantName, 'merged:', merged);
        updateDisplayWithData(merged);
      }

      // Variant button UI highlight
      function updateVariantSelectionUI(variantNameToSelect) {
        const nameLower = variantNameToSelect ? variantNameToSelect.toLowerCase() : null;
        document.querySelectorAll('.variant-group [data-label]').forEach(btn => {
          const btnLabel = (btn.getAttribute('data-label') || '').trim().toLowerCase();
          btn.classList.toggle('selected', btnLabel === nameLower);
        });
      }

      // Click handlers (broaden selector for any element with data-label)
      document.querySelectorAll('.variant-group [data-label]').forEach(el => {
        el.addEventListener('click', function () {
          const variantName = (this.getAttribute('data-label') || '').trim();
          if (!variantName) return;
          const match = imageAltMap.find(v => v.name && v.name.toLowerCase() === variantName.toLowerCase());
          if (match) {
            // attempt to move swiper to the slide corresponding to the variant's real index if available
            try {
              if (swiperInstance.params && swiperInstance.params.loop) {
                swiperInstance.slideToLoop(match.index);
              } else {
                // slideTo expects a slide index; we use match.index as realIndex because that's how your code used it
                swiperInstance.slideTo(match.index);
              }
            } catch (e) {
              console.warn('VariantSync: error sliding swiper', e);
            }
          } else {
            console.debug('VariantSync: clicked variant not found in imageAltMap:', variantName);
          }
          updateDisplay(variantName);
          updateVariantSelectionUI(variantName);
        });
      });

      // Slide change: update UI to the variant for the active realIndex (if any)
      swiperInstance.on('slideChange', () => {
        const activeRealIndex = Number(swiperInstance.realIndex);
        const activeVariant = imageAltMap.find(v => (v.index === activeRealIndex) && v.name);
        console.debug('VariantSync: slideChange activeRealIndex=', activeRealIndex, 'activeVariant=', activeVariant);
        updateDisplay(activeVariant?.name || null);
        updateVariantSelectionUI(activeVariant?.name || null);
      });

      // Initial: pick variant matching current realIndex (if exists), otherwise defaults
      const initialReal = Number(swiperInstance.realIndex);
      const initialVariant = imageAltMap.find(v => (v.index === initialReal) && v.name);
      console.debug('VariantSync: initialRealIndex=', initialReal, 'initialVariant=', initialVariant);
      updateDisplay(initialVariant?.name || null);
      updateVariantSelectionUI(initialVariant?.name || null);

    } catch (err) {
      console.error('VariantSync: unexpected error', err);
    }
  });
});


//-----------------------Homepage & Shop Page Slider & Variants-------------------------------//
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".homepage-slider-wrapper").forEach((wrapper, index) => {
        // --- Part 1: Gather Essential Elements and Data ---
        const postId = wrapper.getAttribute("data-post-id");
        const bodyHtml = wrapper.querySelector(".homepage-hidden-body")?.innerHTML;
        const mainWrapper = wrapper.querySelector(".homepage-main-slider .swiper-wrapper");
        const thumbWrapper = wrapper.querySelector(".homepage-thumb-slider .swiper-wrapper");
        const prevBtn = wrapper.querySelector(".swiper-button-prev");
        const nextBtn = wrapper.querySelector(".swiper-button-next");

        if (!bodyHtml || !mainWrapper) {
            console.error(`Slider #${index + 1} missing essential HTML.`);
            return;
        }

        // --- Part 2: Validate Post ID for LocalStorage ---
        let isIdValid = true;
        let productDataKey = '';
        if (!postId || postId.includes("{") || postId.includes("data:")) {
            isIdValid = false;
            console.warn(`Slider #${index + 1}: Invalid or missing 'data-post-id'. LocalStorage disabled.`);
        } else {
            productDataKey = `homepageProduct:${postId}`;
        }

        // --- Part 3: Parse default and variant data ---
        const productData = { defaults: {}, variants: {} };
        const indexToVariantNameMap = {};
        const cleanPriceString = str => (str || "").replace(/&nbsp;|&#160;|\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
        const formatPrice = value => {
            if (!value) return "";
            const match = value.match(/^([^\d\s,.\-]*)\s*([\d,.\s]+)$/);
            if (!match) return value.trim();
            const symbol = (match[1] || "").trim();
            let numberPart = (match[2] || "").replace(/\s+/g, "").replace(/,/g, "");
            const decimalMatch = numberPart.match(/^(\d+)(\.\d{1,2})?$/);
            if (!decimalMatch) return value.trim();
            const formattedInteger = decimalMatch[1].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            return symbol ? `${symbol} ${formattedInteger}${decimalMatch[2] || ""}` : `${formattedInteger}${decimalMatch[2] || ""}`;
        };

        productData.defaults = {
            oldPrice: cleanPriceString((bodyHtml.match(/\[data-old-price="(.*?)"\]/)?.[1]) || ""),
            currentPrice: cleanPriceString((bodyHtml.match(/\[data-current-price="(.*?)"\]/)?.[1]) || ""),
            stock: (bodyHtml.match(/\[data-stock="(.*?)"\]/)?.[1] || "In Stock").trim(),
            sale: (bodyHtml.match(/\[data-sale="(.*?)"\]/)?.[1] || "").trim(),
            badge: (bodyHtml.match(/\[data-badge="(.*?)"\]/)?.[1] || "").trim()
        };

        // Extract images and variant info from hidden body
        const temp = document.createElement("div");
        temp.innerHTML = bodyHtml;
        const urls = [], altMap = {};
        temp.querySelectorAll("img").forEach((img, idx) => {
            const src = img.getAttribute("src");
            const alt = img.getAttribute("alt") || "";
            if (!src || urls.includes(src)) return;
            urls.push(src);
            altMap[src] = alt;

            const match = alt.match(/\[([^\]]+)\]/);
            if (match) {
                const parts = match[1].split(',').map(p => p.trim());
                const variantName = parts.find(p => p.startsWith('variant='))?.split('=')[1]?.trim();
                if (variantName) {
                    productData.variants[variantName.toLowerCase()] = {
                        index: urls.length - 1,
                        name: variantName,
                        oldPrice: parts.find(p => p.startsWith('old-price='))?.split('=')[1]?.trim() || "",
                        currentPrice: parts.find(p => p.startsWith('current-price='))?.split('=')[1]?.trim() || "",
                        stock: parts.find(p => p.startsWith('stock='))?.split('=')[1]?.trim() || "",
                        sale: parts.find(p => p.startsWith('sale='))?.split('=')[1]?.trim() || "",
                        badge: parts.find(p => p.startsWith('badge='))?.split('=')[1]?.trim() || ""
                    };
                    indexToVariantNameMap[urls.length - 1] = variantName;
                }
            }
        });

        // --- Part 4: Save to LocalStorage if valid ---
        if (isIdValid) {
            try { localStorage.setItem(productDataKey, JSON.stringify(productData)); }
            catch (e) { console.error(`Error saving product ${postId} to localStorage:`, e); }
        }

        if (!urls.length) return;

        // --- Part 5: Build slider DOM ---
        mainWrapper.innerHTML = '';
        if (thumbWrapper) thumbWrapper.innerHTML = '';
        urls.forEach(src => {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            slide.innerHTML = `<img src="${src}" alt="${altMap[src]}" loading="lazy">`;
            mainWrapper.appendChild(slide);
            if (thumbWrapper) thumbWrapper.appendChild(slide.cloneNode(true));
        });
        if (urls.length <= 1) {
            if (prevBtn) prevBtn.style.display = "none";
            if (nextBtn) nextBtn.style.display = "none";
        }

        // --- Part 6: Initialize Swiper ---
        setTimeout(() => {
            const thumbSwiper = thumbWrapper ? new Swiper(wrapper.querySelector(".homepage-thumb-slider"), { slidesPerView: "auto", watchSlidesProgress: true, freeMode: true, roundLengths: true, spaceBetween: 0 }) : null;
            const mainSwiper = new Swiper(wrapper.querySelector(".homepage-main-slider"), {
                effect: "fade",
                fadeEffect: { crossFade: true },
                speed: 1200,
                slidesPerView: 1,
                loop: false,
                roundLengths: true,
                spaceBetween: 0,
                navigation: { prevEl: prevBtn, nextEl: nextBtn },
                thumbs: { swiper: thumbSwiper }
            });

            const resizeObserver = new ResizeObserver(() => {
                mainSwiper.update();
                if (thumbSwiper) thumbSwiper.update();
            });
            resizeObserver.observe(wrapper);

            // --- Part 7: Variant display logic ---
            const parent = wrapper.closest(".post") || document;
            const variantContainer = parent.querySelector(`.homepage-view-variants[data-post-id="${postId}"]`);
            const allowedBadges = ["Hot", "New", "Best Seller", "Deal", "Trending", "Popular", "Limited Time", "Top Rated", "Free Shipping", "Recommended", "Free", "Sponsered"];
            const badgeClassMap = { "Hot":"badge-hot","New":"badge-new","Best Seller":"badge-best-seller","Deal":"badge-deal","Trending":"badge-trending","Popular":"badge-popular","Limited Time":"badge-limited-time","Top Rated":"badge-top-rated","Free Shipping":"badge-free-shipping","Recommended":"badge-recommended","Free":"badge-free","Sponsered":"badge-sponsored"};

            function updateDisplay(variantName) {
                const variantData = variantName ? productData.variants[variantName.toLowerCase()] : undefined;
                const oldPrice = variantData?.oldPrice || productData.defaults.oldPrice;
                const currentPrice = variantData?.currentPrice || productData.defaults.currentPrice;
                const stock = variantData?.stock || productData.defaults.stock;
                const sale = variantData?.sale || productData.defaults.sale;
                const badge = variantData?.badge || productData.defaults.badge;

                parent.querySelectorAll(".saved-old-price").forEach(div => {
                    const formattedOld = formatPrice(oldPrice);
                    div.style.display = formattedOld ? "inline-block" : "none";
                    if (formattedOld) div.textContent = formattedOld;
                });
                parent.querySelectorAll(".saved-current-price").forEach(div => {
                    const formattedCurrent = formatPrice(currentPrice);
                    div.style.display = formattedCurrent ? "inline-block" : "none";
                    if (formattedCurrent) div.textContent = formattedCurrent;
                });
                parent.querySelectorAll(".saved-stock").forEach(div => {
                    div.className = "saved-stock";
                    div.innerHTML = "";
                    if (stock === "Out of Stock" || stock === "0") div.textContent = "Out of Stock", div.classList.add("out-of-stock");
                    else if (stock === "In Stock") div.textContent = "In Stock", div.classList.add("in-stock");
                    else if (/^\d+$/.test(stock)) div.innerHTML = `<span class="stock-number">${stock}</span><span class="stock-text"> In Stock</span>`;
                    div.setAttribute("data-stock", stock);
                });
                parent.querySelectorAll(".icon-btn").forEach(btn => btn.classList.toggle("disabled-button", stock === "0" || stock === "Out of Stock"));
                parent.querySelectorAll(".saved-product-sale").forEach(div => {
                    const percent = parseInt(sale, 10);
                    const isValid = sale && sale.endsWith('%') && !isNaN(percent) && percent >= -100 && percent <= 100;
                    div.style.display = isValid ? "inline-block" : "none";
                    if (isValid) div.textContent = sale;
                });
                parent.querySelectorAll(".saved-product-badge").forEach(div => {
                    const isValid = badge && allowedBadges.includes(badge);
                    div.style.display = isValid ? "inline-block" : "none";
                    if (isValid) div.textContent = badge, div.className = `saved-product-badge ${badgeClassMap[badge]||""}`;
                });
            }

            function updateVariantSelectionUI(variantName) {
                if (!variantContainer) return;
                const nameLower = variantName ? variantName.toLowerCase() : null;
                variantContainer.querySelectorAll("span[data-label]").forEach(btn => {
                    const btnLabel = btn.getAttribute("data-label").trim().toLowerCase();
                    btn.classList.toggle('selected', btnLabel === nameLower);
                });
            }

            if (variantContainer) {
                variantContainer.querySelectorAll("span[data-label]").forEach(btn => {
                    btn.addEventListener("click", function () {
                        const label = this.getAttribute("data-label").trim();
                        const variantInfo = productData.variants[label.toLowerCase()];
                        if (variantInfo) mainSwiper.slideTo(variantInfo.index);
                        updateDisplay(label);
                        updateVariantSelectionUI(label);
                    });
                });
            }

            mainSwiper.on("slideChange", function () {
                const currentIndex = mainSwiper.activeIndex;
                const currentVariantName = indexToVariantNameMap[currentIndex];
                updateDisplay(currentVariantName);
                updateVariantSelectionUI(currentVariantName);
            });

            const initialVariantName = indexToVariantNameMap[mainSwiper.activeIndex];
            updateDisplay(initialVariantName);
            updateVariantSelectionUI(initialVariantName);

        }, 100);
    });
});


//----------------------------Static pages----------------------------------//

document.addEventListener("DOMContentLoaded",function(){if(window.location.pathname.startsWith('/p/')){const postBody=document.querySelector('.post-body');if(!postBody)return;postBody.querySelectorAll("img, .separator, p, div, br").forEach(el=>{el.style.removeProperty('display');el.hidden=!1});const images=postBody.querySelectorAll('img');images.forEach(img=>{img.style.display='';img.hidden=!1});const separators=postBody.querySelectorAll('.separator');separators.forEach(sep=>{sep.style.display='';sep.hidden=!1})}})

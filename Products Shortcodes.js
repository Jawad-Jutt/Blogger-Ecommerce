//---------------------------Header Slider ---------------------------------//
(function () {
    document.addEventListener("DOMContentLoaded", function () {
        // Limit to the HeaderSlider widget only
        let container = document.querySelector("#HeroSection #HeaderSlider .widget-content");
        if (!container) return;

        let content = container.innerHTML;
        let regex = /\[slider\/(.*?)\/(\d+)\]/g;

        container.innerHTML = content.replace(regex, function (match, type, number) {
            let sliderId = "HeaderSlider_" + Math.random().toString(36).substr(2, 9);
            let wrapperId = "wrapper_" + sliderId;
            buildSlider(sliderId, wrapperId, type, number);
            return `
        <div class="HeaderSliderWrapper" id="${wrapperId}">
          <div class="swiper" id="${sliderId}">
            <div class="swiper-wrapper"></div>
          </div>
          <div class="swiper-pagination"></div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
        </div>`;
        });
    });

    function buildSlider(sliderId, wrapperId, type, number) {
        let blogUrl = window.location.origin;
        let feedUrl;

        if (type.toLowerCase() === "recent") {
            feedUrl = blogUrl + "/feeds/posts/default?alt=json&max-results=" + number;
        } else if (type.toLowerCase() === "random") {
            feedUrl = blogUrl + "/feeds/posts/default?alt=json&max-results=20";
        } else {
            feedUrl = blogUrl + "/feeds/posts/default/-/" + type + "?alt=json&max-results=" + number;
        }

        fetch(feedUrl)
            .then(res => res.json())
            .then(data => {
                let entries = data.feed.entry || [];
                if (type.toLowerCase() === "random") {
                    entries = entries.sort(() => 0.5 - Math.random()).slice(0, number);
                }
                let slidesHTML = "";

                entries.forEach(entry => {
                    let title = entry.title.$t;
                    let link = entry.link.find(l => l.rel === "alternate").href;

                    // Label
                    let label = (entry.category && entry.category.length > 0) ? entry.category[0].term : "";

                    // Image
                    let img = "";
                    if (entry.media$thumbnail) {
                        img = entry.media$thumbnail.url.replace(/s72-c/, "s800");
                    } else {
                        img = "https://via.placeholder.com/800x450?text=No+Image";
                    }

                    // Get prices from localStorage
                    let priceData = {};
                    try {
                        let stored = localStorage.getItem("product:" + link);
                        if (stored) {
                            priceData = JSON.parse(stored);
                        }
                    } catch (e) {
                        priceData = {};
                    }

                    let oldPrice = priceData?.prices?.old || "";
                    let currentPrice = priceData?.prices?.current || "";

                    let priceHTML = "";
                    if (currentPrice || oldPrice) {
                        priceHTML = `
              ${oldPrice ? `<span class="old-price">${oldPrice}</span>` : ""}
              ${currentPrice ? `<span class="current-price">${currentPrice}</span>` : ""}
            `;
                    }

                    slidesHTML += `
            <div class="swiper-slide">
              <div class="slider-left">
                ${label ? `<h4>${label}</h4>` : ""}
                <h2>${title}</h2>
                <div class="price-wrap">${priceHTML}</div>
                <a class="view-btn" href="${link}" target="_blank">View Product</a>
              </div>
              <div class="slider-right">
                <img src="${img}" alt="${title}">
              </div>
            </div>
          `;
                });

                document.querySelector("#" + sliderId + " .swiper-wrapper").innerHTML = slidesHTML;

                new Swiper("#" + sliderId, {
                    slidesPerView: 1,
                    spaceBetween: 30,
                    loop: true,
                    pagination: {
                        el: "#" + wrapperId + " .swiper-pagination",
                        clickable: true,
                    },
                    navigation: {
                        nextEl: "#" + wrapperId + " .swiper-button-next",
                        prevEl: "#" + wrapperId + " .swiper-button-prev",
                    },
                });
            });
    }
})();



//----------------------------Hot Post ----------------------------------//


(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        const container = document.querySelector('#HotPost #hot-post-widget .widget-content');
        if (!container) return;

        const content = container.innerHTML;
        const regex = /\[hot-post\/([^\/]+)(?:\/(\d+))?\]/gi;
        const tasks = [];

        // Build container markup first (so DOM element exists before we fetch)
        container.innerHTML = content.replace(regex, function (match, type, num) {
            const hotId = 'HotPost_' + Math.random().toString(36).slice(2, 9);
            const limit = num ? Math.max(1, Math.min(200, parseInt(num, 10))) : 5; // clamp 1..200
            tasks.push({ hotId, type, limit });
            return `<div id="${hotId}" class="hot-post-container"></div>`;
        });

        // Run tasks (fetch & render)
        tasks.forEach(t => buildHotPosts(t.hotId, t.type, t.limit));
    });

    // ---------- helpers ----------
    function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function escapeAttr(s) {
        return escapeHtml(s).replace(/"/g, '&quot;');
    }
    function slugFromUrl(url) {
        try {
            const u = new URL(url);
            return u.pathname.replace(/^\/+|\/+$/g, '');
        } catch (e) {
            // fallback: take last segment
            const m = (url || '').split('/').filter(Boolean);
            return m.length ? m[m.length - 1] : url;
        }
    }
    function sanitizeClassName(s) {
        return String(s || '').toLowerCase().replace(/[^a-z0-9\-]+/g, '-');
    }

    // Try many key variants and fallback to scanning localStorage keys that contain the slug
    function getProductDataFromLocalStorage(postLink) {
        if (!postLink) return {};
        const candidates = new Set();
        const trimSlash = x => x.replace(/\/+$/, '');

        try {
            candidates.add(postLink);
            candidates.add(trimSlash(postLink));
            candidates.add(postLink + '/');
            // http/https variants
            if (postLink.startsWith('https:')) candidates.add(postLink.replace(/^https:/, 'http:'));
            if (postLink.startsWith('http:')) candidates.add(postLink.replace(/^http:/, 'https:'));
            // encoded/decoded
            try { candidates.add(encodeURI(postLink)); } catch (e) { }
            try { candidates.add(decodeURI(postLink)); } catch (e) { }
        } catch (e) { }

        // common key prefixes
        const prefixes = ['product:'];
        // try direct lookups
        for (const p of prefixes) {
            for (const c of candidates) {
                const key = p + c;
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const json = tryParseJsonString(raw);
                        if (json) return json;
                    }
                } catch (e) { }
            }
        }

        // fallback: search all localStorage keys for ones that contain the slug
        const slug = slugFromUrl(postLink);
        for (let i = 0; i < localStorage.length; i++) {
            try {
                const k = localStorage.key(i);
                if (!k) continue;
                if (!k.toLowerCase().startsWith('product:')) continue;
                // if key contains slug or link fragment
                if (k.indexOf(slug) !== -1 || decodeURIComponent(k).indexOf(slug) !== -1) {
                    const raw = localStorage.getItem(k);
                    const json = tryParseJsonString(raw);
                    if (json) return json;
                }
            } catch (e) { /* ignore */ }
        }

        // nothing found
        return {};
    }

    // Try JSON.parse, if fails attempt to extract {...} substring and parse
    function tryParseJsonString(raw) {
        if (!raw) return null;
        if (typeof raw !== 'string') return null;
        raw = raw.trim();
        try {
            return JSON.parse(raw);
        } catch (e) {
            // find first '{' and last '}' and try parse
            const first = raw.indexOf('{');
            const last = raw.lastIndexOf('}');
            if (first !== -1 && last !== -1 && last > first) {
                const sub = raw.slice(first, last + 1);
                try {
                    return JSON.parse(sub);
                } catch (e2) { /* fallthrough */ }
            }
        }
        return null;
    }

    // get image: prefer media$thumbnail, then <img src> inside content, else placeholder
    function getImageFromEntry(entry) {
        try {
            if (entry.media$thumbnail && entry.media$thumbnail.url) {
                return entry.media$thumbnail.url.replace(/s72-c/, 's800');
            }
            const content = entry.content && entry.content.$t ? entry.content.$t : '';
            const m = content.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (m && m[1]) return m[1];
        } catch (e) { }
        return 'https://via.placeholder.com/900x520?text=No+Image';
    }

    // ---------- main: fetch + render ----------
    function buildHotPosts(hotId, type, limit) {
        const target = document.getElementById(hotId);
        if (!target) return;

        const siteOrigin = window.location.origin || (location.protocol + '//' + location.host);
        const t = (type || '').toLowerCase();
        // Blogger feed limits: use a reasonable cap
        const maxFetch = Math.min(Math.max(limit, 1), 500);

        let feedUrl;
        if (t === 'recent') {
            feedUrl = `${siteOrigin}/feeds/posts/default?alt=json&max-results=${maxFetch}`;
        } else if (t === 'random') {
            // fetch extra for randomness then slice later
            feedUrl = `${siteOrigin}/feeds/posts/default?alt=json&max-results=${Math.min(200, maxFetch * 2)}`;
        } else {
            // label-based
            feedUrl = `${siteOrigin}/feeds/posts/default/-/${encodeURIComponent(type)}?alt=json&max-results=${maxFetch}`;
        }

        fetch(feedUrl).then(r => r.json()).then(data => {
            let entries = (data && data.feed && data.feed.entry) ? data.feed.entry : [];
            if (!Array.isArray(entries)) entries = [];

            if (t === 'random') {
                entries = entries.sort(() => 0.5 - Math.random()).slice(0, limit);
            } else {
                entries = entries.slice(0, limit);
            }

            const parts = [];
            entries.forEach(entry => {
                const title = (entry.title && entry.title.$t) ? entry.title.$t : '';
                const altLinkObj = Array.isArray(entry.link) ? entry.link.find(l => l.rel === 'alternate') : null;
                const link = (altLinkObj && altLinkObj.href) ? altLinkObj.href : '#';
                const label = (Array.isArray(entry.category) && entry.category.length) ? entry.category[0].term : '';

                const img = getImageFromEntry(entry);

                // robustly get product data from localStorage
                const productData = getProductDataFromLocalStorage(link) || {};
                const oldPrice = (productData && productData.prices && productData.prices.old) ? String(productData.prices.old).trim() : '';
                const currentPrice = (productData && productData.prices && productData.prices.current) ? String(productData.prices.current).trim() : '';
                const badge = productData && productData.badge ? String(productData.badge).trim() : '';
                const sale = productData && productData.sale ? String(productData.sale).trim() : '';

                const priceHtml = (oldPrice || currentPrice)
                    ? `<div class="hot-prices">${oldPrice ? `<span class="old-price">${escapeHtml(oldPrice)}</span>` : ''}${currentPrice ? `<span class="current-price">${escapeHtml(currentPrice)}</span>` : ''}</div>`
                    : '';

                // badge class (sanitized)
                const badgeClass = badge ? 'hot-badge ' + sanitizeClassName(badge) : '';
                const badgeHtml = badge ? `<span class="${badgeClass}">${escapeHtml(badge)}</span>` : '';
                const saleHtml = sale ? `<span class="hot-sale">${escapeHtml(sale)}</span>` : '';

                parts.push(`
          <div class="hot-post-item">
            <a href="${escapeAttr(link)}" target="_blank" rel="noopener">
              <div class="hot-post-image">
                <img src="${escapeAttr(img)}" alt="${escapeAttr(title)}">
                ${badgeHtml}
                ${saleHtml}
                <div class="hot-post-overlay">
                  ${label ? `<h4 class="hot-label">${escapeHtml(label)}</h4>` : ''}
                  <h3 class="hot-title">${escapeHtml(title)}</h3>
                  ${priceHtml}
                </div>
              </div>
            </a>
          </div>
        `);
            });

            target.innerHTML = parts.join('') || '<div class="hot-empty">No posts found</div>';
        }).catch(err => {
            console.error('HotPost fetch error:', err);
            const target = document.getElementById(hotId);
            if (target) target.innerHTML = '<div class="hot-empty">Error loading posts</div>';
        });
    }
})();



//---------------------------------Post List (Horizontal Slider)------------------------//


(function () {
    'use strict';
    document.addEventListener('DOMContentLoaded', function () {
        const container = document.querySelector('#PostList #post-list-widget .widget-content');
        if (!container) return;

        const content = container.innerHTML;
        const regex = /\[post-list\/([^\/]+)(?:\/(\d+))?\]/gi;
        const tasks = [];

        container.innerHTML = content.replace(regex, function (match, type, num) {
            const sliderId = 'PostList_' + Math.random().toString(36).slice(2, 9);
            const limit = num ? Math.max(1, Math.min(50, parseInt(num, 10))) : 5;
            tasks.push({ sliderId, type, limit });
            return `
        <div class="post-list-slider-container">
          <div class="swiper" id="${sliderId}">
            <div class="swiper-wrapper"></div>
            <div class="swiper-button-prev"></div>
            <div class="swiper-button-next"></div>
            <div class="swiper-pagination"></div>
          </div>
        </div>
      `;
        });

        tasks.forEach(t => buildPostListSlider(t.sliderId, t.type, t.limit));
    });

    function buildPostListSlider(sliderId, type, limit) {
        const target = document.getElementById(sliderId);
        if (!target) return;

        const siteOrigin = window.location.origin || (location.protocol + '//' + location.host);
        const t = (type || '').toLowerCase();
        const maxFetch = Math.min(Math.max(limit, 1), 200);

        let feedUrl;
        if (t === 'recent') {
            feedUrl = `${siteOrigin}/feeds/posts/default?alt=json&max-results=${maxFetch}`;
        } else if (t === 'random') {
            feedUrl = `${siteOrigin}/feeds/posts/default?alt=json&max-results=${Math.min(200, maxFetch * 2)}`;
        } else {
            feedUrl = `${siteOrigin}/feeds/posts/default/-/${encodeURIComponent(type)}?alt=json&max-results=${maxFetch}`;
        }

        fetch(feedUrl).then(res => res.json()).then(data => {
            let entries = (data && data.feed && data.feed.entry) ? data.feed.entry : [];
            if (!Array.isArray(entries)) entries = [];
            if (t === 'random') entries = entries.sort(() => 0.5 - Math.random()).slice(0, limit);
            else entries = entries.slice(0, limit);

            const slidesHTML = entries.map(entry => {
                const title = entry.title?.$t || '';
                const linkObj = Array.isArray(entry.link) ? entry.link.find(l => l.rel === 'alternate') : null;
                const link = linkObj?.href || '#';
                const img = entry.media$thumbnail ? entry.media$thumbnail.url.replace(/s72-c/, 's300') : 'https://via.placeholder.com/300x200?text=No+Image';

                // prices from localStorage
                let productData = {};
                try {
                    const stored = localStorage.getItem("product:" + link);
                    if (stored) productData = JSON.parse(stored);
                } catch (e) { }

                const oldPrice = productData?.prices?.old || '';
                const currentPrice = productData?.prices?.current || '';
                const priceHTML = (oldPrice || currentPrice)
                    ? `<div class="pl-prices">${oldPrice ? `<span class="pl-old-price">${oldPrice}</span>` : ''}${currentPrice ? `<span class="pl-current-price">${currentPrice}</span>` : ''}</div>`
                    : '';

                return `
          <div class="swiper-slide post-list-item">
            <a href="${link}" target="_blank">
              <div class="post-list-img"><img src="${img}" alt="${title}"></div>
              <div class="post-list-content">
                <h3 class="pl-title">${title}</h3>
                ${priceHTML}
              </div>
            </a>
          </div>
        `;
            }).join('');

            target.querySelector('.swiper-wrapper').innerHTML = slidesHTML;

            // Initialize Swiper
            new Swiper("#" + sliderId, {
                slidesPerView: 4,
                spaceBetween: 10,
                loop: entries.length > 4,
                navigation: {
                    nextEl: "#" + sliderId + " .swiper-button-next",
                    prevEl: "#" + sliderId + " .swiper-button-prev",
                },
                pagination: {
                    el: "#" + sliderId + " .swiper-pagination",
                    clickable: true,
                },
                breakpoints: {
                    1600: { slidesPerView: 6 },
                    1400: { slidesPerView: 5 },
                    1024: { slidesPerView: 4 },
                    768: { slidesPerView: 3 },
                    480: { slidesPerView: 2 },
                    360: { slidesPerView: 1 },
                    120: { slidesPerView: 1 }
                }
            });
        }).catch(err => console.error('Post List Slider fetch error:', err));
    }
})();



//-----------------------------Brand Products------------------------------//


(function () {
    document.addEventListener("DOMContentLoaded", function () {
        let container = document.querySelector("#BrandProducts #brand-products-widget .widget-content");
        if (!container) return;

        let content = container.innerHTML;
        let regex = /\[brand-products\/(.*?)\/(\d+)\]/i;

        container.innerHTML = content.replace(regex, function (match, type, number) {
            let brandId = "BrandProducts_" + Math.random().toString(36).substr(2, 9);
            buildBrandProducts(brandId, type, parseInt(number));
            return `<div id="${brandId}" class="brand-products-slider swiper"></div>`;
        });
    });

    function buildBrandProducts(brandId, type, number) {
        let blogUrl = window.location.origin;
        let feedUrl;

        // ✅ Handle recent, random, or label
        if (type.toLowerCase() === "recent") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=${number}`;
        } else if (type.toLowerCase() === "random") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=50`; // fetch more for randomness
        } else {
            feedUrl = `${blogUrl}/feeds/posts/default/-/${encodeURIComponent(type)}?alt=json&max-results=${number}`;
        }

        fetch(feedUrl)
            .then(res => res.json())
            .then(data => {
                let entries = data.feed.entry || [];

                // ✅ Random support
                if (type.toLowerCase() === "random") {
                    entries = entries.sort(() => 0.5 - Math.random()).slice(0, number);
                } else {
                    entries = entries.slice(0, number);
                }

                let slidesHTML = "";
                entries.forEach(entry => {
                    let link = entry.link.find(l => l.rel === "alternate").href;

                    // Post Image
                    let img = entry.media$thumbnail ? entry.media$thumbnail.url.replace(/s72-c/, "s800")
                        : "https://via.placeholder.com/800x500?text=No+Image";

                    // Brand Image from localStorage
                    let brandData = {};
                    try {
                        let stored = localStorage.getItem("product:" + link);
                        if (stored) brandData = JSON.parse(stored);
                    } catch (e) { brandData = {}; }

                    let brandHTML = "";
                    if (brandData?.brand?.image) {
                        brandHTML = `
              <div class="brand-image-wrapper">
                <div class="brand-image-inner">
                  <img src="${brandData.brand.image}" alt="Brand">
                </div>
              </div>
            `;
                    }

                    // ✅ Extract numeric post ID
                    let rawId = (entry.id && entry.id.$t) ? entry.id.$t : link;
                    let m = rawId.match(/post-(\d+)/);
                    let postId = m ? m[1] : rawId;

                    // ✅ Escape title
                    let titleText = (entry.title && entry.title.$t) ? entry.title.$t.replace(/"/g, '&quot;') : '';

                    slidesHTML += `
  <div class="swiper-slide brand-product-item post-outer">
    <a href="${link}" target="_blank">
      <div class="brand-product-image">
        <img src="${img}" alt="Product">
        ${brandHTML}
      </div>
    </a>
    <a class="add-to-wishlist" 
       href="#"
       data-id="${postId}" 
       data-title="${titleText}" 
       data-url="${link}" 
       data-image="${img}"
       title="Add to Wishlist">
      <i class="bi bi-heart"></i>
    </a>
  </div>
`;
                });

                let sliderEl = document.querySelector("#" + brandId);
                sliderEl.innerHTML = `<div class="swiper-wrapper">${slidesHTML}</div>
                              <div class="swiper-button-next"></div>
                              <div class="swiper-button-prev"></div>
                              <div class="swiper-pagination"></div>`;

                new Swiper("#" + brandId, {
                    slidesPerView: 1,
                    spaceBetween: 20,
                    loop: true,
                    pagination: { el: "#" + brandId + " .swiper-pagination", clickable: true },
                    navigation: { nextEl: "#" + brandId + " .swiper-button-next", prevEl: "#" + brandId + " .swiper-button-prev" },
                    breakpoints: {
                        1600: { slidesPerView: 6 },
                        1400: { slidesPerView: 5 },
                        1024: { slidesPerView: 4 },
                        768: { slidesPerView: 3 },
                        480: { slidesPerView: 3 },
                        320: { slidesPerView: 2 },
                        220: { slidesPerView: 1 }
                    }
                });
            })
            .catch(() => {
                document.querySelector("#" + brandId).innerHTML = "<p>Could not load products.</p>";
            });
    }
})();




//-------------------------Feactured Post (4 post Flex Box)-----------------------------//


// FeacturedPost — robust label support, limited to 4 items, scoped to #FeacturedPost
(function () {
    const container = document.querySelector('#FeacturedPost .widget-content');
    if (!container) return;

    const text = container.textContent.trim();
    const match = text.match(/\[feactured\/([^\]]+)\]/i);
    if (!match) return;

    const param = match[1].trim();
    const site = window.location.origin;

    container.innerHTML = `
    <div class="product-grid">
    <div class="left-column-wrapper">
      <div class="product-box" id="box1"></div>
      <div class="product-box" id="box2"></div>
    </div>
      <div class="right-column-wrapper">
        <div class="product-box" id="box3"></div>
        <div class="product-box" id="box4"></div>
      </div>
    </div>
  `;

    const boxes = ['box1', 'box2', 'box3', 'box4'].map(id => document.getElementById(id));

    function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
    function getPostImage(entry) {
        if (entry.media$thumbnail) return entry.media$thumbnail.url.replace('s72-c', 's800');
        const m = (entry.content?.$t || entry.summary?.$t || '').match(/<img[^>]+src=["']([^"']+)["']/i);
        return m ? m[1] : 'https://via.placeholder.com/800x600?text=No+Image';
    }
    function getLocalData(url) {
        try {
            const keys = ['product:' + url, 'product:' + url.replace(/\/+$/, '')];
            for (let k of keys) {
                const raw = localStorage.getItem(k);
                if (raw) return JSON.parse(raw);
            }
        } catch (e) { }
        return {};
    }

    async function fetchPosts(label) {
        let urls = [];
        const enc = encodeURIComponent(label);
        if (label.toLowerCase() === 'random') {
            urls = [`${site}/feeds/posts/default?alt=json&max-results=40`];
        } else if (label.toLowerCase() === 'recent') {
            urls = [`${site}/feeds/posts/default?alt=json&max-results=20`];
        } else {
            urls = [
                `${site}/feeds/posts/default/-/${enc}?alt=json&max-results=4`,
                `${site}/search/label/${enc}?alt=json&max-results=4`
            ];
        }

        for (let url of urls) {
            try {
                const res = await fetch(url);
                if (!res.ok) continue;
                const data = await res.json();
                const entries = (data.feed?.entry || data.items || []);
                if (entries.length) return entries;
            } catch (e) { continue; }
        }
        return [];
    }

    fetchPosts(param).then(posts => {
        posts = posts.slice(0, 4);
        boxes.forEach((box, i) => {
            const post = posts[i];
            if (!post) { box.setAttribute('hidden', ''); return; }
            box.removeAttribute('hidden');

            const title = post.title?.$t || post.title || '';
            const link = (Array.isArray(post.link) ? (post.link.find(l => l.rel === 'alternate')?.href) : post.url) || '#';
            const img = getPostImage(post);
            const pdata = getLocalData(link);
            const oldPrice = pdata?.prices?.old || '';
            const currentPrice = pdata?.prices?.current || '';
            const badge = pdata?.badge || '';
            const sale = pdata?.sale || '';

            const priceHTML = (oldPrice || currentPrice) ? `<div class="price">${oldPrice ? `<span class="old-price">${escapeHtml(oldPrice)}</span>` : ''}${currentPrice ? `<span class="current-price">${escapeHtml(currentPrice)}</span>` : ''}</div>` : '';
            const saleHTML = sale ? `<div class="sale-tag">${escapeHtml(sale)}</div>` : '';
            const badgeHTML = badge ? `<div class="label">${escapeHtml(badge)}</div>` : '';

            box.innerHTML = `
        <img src="${escapeHtml(img)}" alt="${escapeHtml(title)}" />
        ${badgeHTML}
        ${saleHTML}
        <div class="product-content">
          <h3 class="title">${escapeHtml(title)}</h3>
          ${priceHTML}
          <a class="view-product-btn" href="${escapeHtml(link)}" target="_blank" rel="noopener">View Product</a>
        </div>
      `;
        });
    }).catch(e => {
        container.innerHTML = `<div class="fp-empty">Could not load featured posts.</div>`;
        console.error('FeacturedPost error:', e);
    });

})();




//-------------------------Product List (Inside Post)---------------------------//


(function () {
    document.addEventListener("DOMContentLoaded", function () {
        // Look in both post content and widgets
        let containers = document.querySelectorAll(".post-body, .widget-content");

        containers.forEach(container => {
            let content = container.innerHTML;
            let regex = /\[product-list\/(.*?)\/?(\d*)\]/g;
            let matches = [...content.matchAll(regex)];
            if (matches.length === 0) return;

            matches.forEach(match => {
                let type = match[1];
                let count = match[2] ? parseInt(match[2], 10) : 5;
                let prodId = "ProductList_" + Math.random().toString(36).substr(2, 9);

                content = content.replace(
                    match[0],
                    `<div id="${prodId}" class="product-list-slider-container" data-type="${type}" data-count="${count}"></div>`
                );
            });

            container.innerHTML = content;

            container.querySelectorAll(".product-list-slider-container").forEach(el => {
                let type = el.getAttribute("data-type");
                let count = parseInt(el.getAttribute("data-count"), 10);
                buildProductList(el.id, type, count);
            });
        });
    });

    function buildProductList(prodId, type, count) {
        let blogUrl = window.location.origin;
        let feedUrl;

        // Determine feed URL based on type
        if (type.toLowerCase() === "recent") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=${count}`;
        } else if (type.toLowerCase() === "random") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=50`; // fetch more for random
        } else {
            feedUrl = `${blogUrl}/feeds/posts/default/-/${encodeURIComponent(type)}?alt=json&max-results=${count}`;
        }

        fetch(feedUrl)
            .then(res => res.json())
            .then(data => {
                let entries = (data && data.feed && data.feed.entry) ? data.feed.entry : [];

                if (type.toLowerCase() === "random") {
                    entries = entries.sort(() => 0.5 - Math.random()).slice(0, count);
                } else {
                    entries = entries.slice(0, count);
                }

                const target = document.getElementById(prodId);
                if (!target) return;

                if (!entries.length) {
                    target.innerHTML = "<p>Could not load products.</p>";
                    return;
                }

                let html = `<div class="swiper product-list-swiper"><div class="swiper-wrapper">`;

                entries.forEach(entry => {
                    let title = entry.title.$t;
                    let linkObj = Array.isArray(entry.link) ? entry.link.find(l => l.rel === "alternate") : null;
                    let link = linkObj ? linkObj.href : "#";

                    // Image
                    let img = entry.media$thumbnail
                        ? entry.media$thumbnail.url.replace(/s72-c/, "s400")
                        : "https://via.placeholder.com/400x250?text=No+Image";

                    // Prices and badge from localStorage
                    let priceData = {};
                    try {
                        let stored = localStorage.getItem("product:" + link);
                        if (stored) priceData = JSON.parse(stored);
                    } catch (e) {
                        priceData = {};
                    }

                    let oldPrice = priceData?.prices?.old || "";
                    let currentPrice = priceData?.prices?.current || "";
                    let badge = priceData?.badge || "";

                    html += `
            <div class="swiper-slide product-list-item">
              <a href="${link}" target="_blank">
                <div class="product-list-img">
                  <img src="${img}" alt="${title}">
                  ${badge ? `<span class="product-badge">${badge}</span>` : ""}
                </div>
                <div class="product-list-content">
                  <h3 class="pl-title">${title}</h3>
                  <div class="pl-prices">
                    ${oldPrice ? `<span class="pl-old-price">${oldPrice}</span>` : ""}
                    ${currentPrice ? `<span class="pl-current-price">${currentPrice}</span>` : ""}
                  </div>
                </div>
              </a>
            </div>`;
                });

                html += `</div>
                 <div class="swiper-button-next"></div>
                 <div class="swiper-button-prev"></div>
                 <div class="swiper-pagination"></div>
               </div>`;

                target.innerHTML = html;

                // Initialize Swiper safely per container
                new Swiper(`#${prodId} .swiper`, {
                    slidesPerView: 3,
                    spaceBetween: 15,
                    loop: true,
                    navigation: {
                        nextEl: `#${prodId} .swiper-button-next`,
                        prevEl: `#${prodId} .swiper-button-prev`,
                    },
                    pagination: {
                        el: `#${prodId} .swiper-pagination`,
                        clickable: true,
                    },
                    breakpoints: {
                        1600: { slidesPerView: 4 },
                        1024: { slidesPerView: 3 },
                        480: { slidesPerView: 2 },
                        320: { slidesPerView: 1 },
                        120: { slidesPerView: 1 }
                    }
                });
            })
            .catch(err => {
                const target = document.getElementById(prodId);
                if (target) target.innerHTML = "<p>Could not load products.</p>";
                console.error(err);
            });
    }
})();




//---------------------Product List 2 (Vertical List)---------------------------//


(function () {
    document.addEventListener("DOMContentLoaded", function () {
        // Look in the same safe containers your product-grid uses
        let containers = document.querySelectorAll(".post-body, .widget-content");

        containers.forEach(container => {
            let content = container.innerHTML;
            let regex = /\[product-list-2\/(.*?)\/(\d+)\]/g;
            let matches = [...content.matchAll(regex)];
            if (matches.length === 0) return;

            // Replace each shortcode with a placeholder div that carries data-type & data-limit
            matches.forEach(match => {
                let type = match[1];
                let limit = parseInt(match[2], 10);
                let id = "PostProductList2_" + Math.random().toString(36).substr(2, 9);

                content = content.replace(
                    match[0],
                    `<div id="${id}" class="product-list-2-post-container" data-type="${type}" data-limit="${limit}"></div>`
                );
            });

            // Commit replacements for this container
            container.innerHTML = content;

            // Build each found placeholder inside this container
            container.querySelectorAll(".product-list-2-post-container").forEach(el => {
                let type = el.getAttribute("data-type");
                let limit = parseInt(el.getAttribute("data-limit"), 10);
                buildProductList2InPost(el.id, type, limit);
            });
        });
    });

    function buildProductList2InPost(id, type, limit) {
        let blogUrl = window.location.origin;
        let feedUrl;

        if (type.toLowerCase() === "recent") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=${limit}`;
        } else if (type.toLowerCase() === "random") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=${limit * 2}`;
        } else {
            feedUrl = `${blogUrl}/feeds/posts/default/-/${encodeURIComponent(type)}?alt=json&max-results=${limit}`;
        }

        fetch(feedUrl)
            .then(res => res.json())
            .then(data => {
                let entries = (data && data.feed && data.feed.entry) ? data.feed.entry : [];

                if (type.toLowerCase() === "random") {
                    entries = entries.sort(() => 0.5 - Math.random()).slice(0, limit);
                } else {
                    entries = entries.slice(0, limit);
                }

                const target = document.getElementById(id);
                if (!target) return;

                if (entries.length === 0) {
                    target.innerHTML = "<p>No products found.</p>";
                    return;
                }

                let html = `<div class="product-list-2-post-vertical">`;

                entries.forEach(entry => {
                    let title = entry.title.$t;
                    let linkObj = Array.isArray(entry.link) ? entry.link.find(l => l.rel === "alternate") : null;
                    let link = linkObj ? linkObj.href : "#";
                    let img = entry.media$thumbnail
                        ? entry.media$thumbnail.url.replace(/s72-c/, "s200")
                        : "https://via.placeholder.com/150?text=No+Image";

                    // Optional price/badge data from localStorage
                    let priceData = {};
                    try {
                        let stored = localStorage.getItem("product:" + link);
                        if (stored) priceData = JSON.parse(stored);
                    } catch (e) { }

                    let oldPrice = priceData?.prices?.old || "";
                    let currentPrice = priceData?.prices?.current || "";

                    html += `
            <div class="product-list-2-post-item">
              <div class="pl2-post-img">
                <a href="${link}" target="_blank">
                  <img src="${img}" alt="${title}">
                </a>
              </div>
              <div class="pl2-post-content">
                <h4 class="pl2-post-title"><a href="${link}" target="_blank">${title}</a></h4>
                <div class="pl2-post-prices">
                  ${oldPrice ? `<span class="pl2-post-old-price">${oldPrice}</span>` : ""}
                  ${currentPrice ? `<span class="pl2-post-current-price">${currentPrice}</span>` : ""}
                </div>
              </div>
            </div>`;
                });

                html += `</div>`;
                target.innerHTML = html;
            })
            .catch(err => {
                const target = document.getElementById(id);
                if (target) target.innerHTML = "<p>Could not load products.</p>";
                console.error(err);
            });
    }
})();



//------------------------Product Grid Shortcode---------------------------//


(function () {
    document.addEventListener("DOMContentLoaded", function () {
        let containers = document.querySelectorAll(".post-body, .widget-content");

        containers.forEach(container => {
            let content = container.innerHTML;
            let regex = /\[product-grid\/(.*?)\/?(\d+)?\]/g;
            let matches = [...content.matchAll(regex)];
            if (matches.length === 0) return;

            matches.forEach(match => {
                let type = match[1];
                let count = match[2] ? parseInt(match[2]) : 5;
                let gridId = "ProductGrid_" + Math.random().toString(36).substr(2, 9);

                content = content.replace(match[0], `<div id="${gridId}" class="product-grid-slider" data-type="${type}" data-count="${count}"></div>`);
            });

            container.innerHTML = content;

            container.querySelectorAll(".product-grid-slider").forEach(grid => {
                let type = grid.getAttribute("data-type");
                let count = parseInt(grid.getAttribute("data-count"));
                buildProductGrid(grid, type, count);
            });
        });
    });

    function buildProductGrid(container, type, count) {
        if (!container) return;

        let blogUrl = window.location.origin;
        let feedUrl;

        if (type.toLowerCase() === "recent") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=${count}`;
        } else if (type.toLowerCase() === "random") {
            feedUrl = `${blogUrl}/feeds/posts/default?alt=json&max-results=20`;
        } else {
            feedUrl = `${blogUrl}/feeds/posts/default/-/${encodeURIComponent(type)}?alt=json&max-results=${count}`;
        }

        fetch(feedUrl)
            .then(res => res.json())
            .then(data => {
                let entries = data.feed.entry || [];
                if (type.toLowerCase() === "random") {
                    entries = entries.sort(() => 0.5 - Math.random()).slice(0, count);
                } else {
                    entries = entries.slice(0, count);
                }

                if (entries.length === 0) {
                    container.innerHTML = "<p>No products found.</p>";
                    return;
                }

                let html = `<div class="swiper"><div class="swiper-wrapper">`;

                entries.forEach(entry => {
                    let title = entry.title.$t;
                    let link = entry.link.find(l => l.rel === "alternate").href;
                    let img = entry.media$thumbnail ? entry.media$thumbnail.url.replace(/s72-c/, "s400") : "https://via.placeholder.com/400x300?text=No+Image";

                    let priceData = {};
                    try {
                        let stored = localStorage.getItem("product:" + link);
                        if (stored) priceData = JSON.parse(stored);
                    } catch (e) { priceData = {}; }

                    let oldPrice = priceData?.prices?.old || "";
                    let currentPrice = priceData?.prices?.current || "";
                    let badge = priceData?.badge || "";
                    let sale = priceData?.sale || "";
                    let stock = priceData?.stock || "";
                    let brandImg = priceData?.brand?.img || "";

                    // Get label from entry categories
                    const label = entry.category && entry.category.length ? entry.category[0].term : "";

                    html += `
          <div class="swiper-slide product-grid-item">
            <a href="${link}" target="_blank">
              <div class="grid-image-wrapper">
                <img src="${img}" alt="${title}" class="grid-image">
                ${badge ? `<span class="grid-badge">${badge}</span>` : ''}
                ${sale ? `<span class="grid-sale">${sale}</span>` : ''}
                ${stock ? `<span class="grid-stock">${stock}</span>` : ''}
                ${brandImg ? `<div class="grid-brand"><img src="${brandImg}" alt="Brand"></div>` : ''}
                ${label ? `<span class="grid-label">${label}</span>` : ''}
              </div>
              <div class="grid-content">
                <h3 class="grid-title">${title}</h3>
                <div class="grid-prices">
                  ${oldPrice ? `<span class="grid-old-price">${oldPrice}</span>` : ''}
                  ${currentPrice ? `<span class="grid-current-price">${currentPrice}</span>` : ''}
                </div>
                <a href="${link}" class="grid-view-btn">View Product</a>
              </div>
            </a>
          </div>`;
                });

                html += `</div>
          <div class="swiper-button-next"></div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-pagination"></div>
        </div>`;

                container.innerHTML = html;

                new Swiper(`#${container.id} .swiper`, {
                    slidesPerView: 3,
                    spaceBetween: 20,
                    loop: true,
                    navigation: {
                        nextEl: `#${container.id} .swiper-button-next`,
                        prevEl: `#${container.id} .swiper-button-prev`,
                    },
                    pagination: {
                        el: `#${container.id} .swiper-pagination`,
                        clickable: true,
                    },
                    breakpoints: {
                        1600: { slidesPerView: 5 },
                        1024: { slidesPerView: 4 },
                        768: { slidesPerView: 3 },
                        480: { slidesPerView: 2 },
                        120: { slidesPerView: 1 }
                    },
                });
            })
            .catch(() => {
                container.innerHTML = "<p>Could not load products.</p>";
            });
    }
})();



//-----------------------------Brand Images Slider----------------------------//

(function () {
    "use strict";

    const SHORTCODE = "[brand/images]";
    const SWIPER_CSS = "https://unpkg.com/swiper@11/swiper-bundle.min.css";
    const SWIPER_JS = "https://unpkg.com/swiper@11/swiper-bundle.min.js";

    function loadCssOnce(href) {
        return new Promise((resolve, reject) => {
            if (document.querySelector('link[href="' + href + '"]')) return resolve();
            const l = document.createElement('link');
            l.rel = 'stylesheet';
            l.href = href;
            l.onload = resolve;
            l.onerror = () => reject(new Error("CSS load failed: " + href));
            document.head.appendChild(l);
        });
    }
    function loadScriptOnce(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src="' + src + '"]')) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = resolve;
            s.onerror = () => reject(new Error("Script load failed: " + src));
            document.head.appendChild(s);
        });
    }

    // BRAND IMAGE extractor (tries many keys but DOES NOT use top-level post link)
    function extractBrandUrl(obj) {
        if (!obj || typeof obj !== "object") return null;
        const b = obj.brand;
        if (b) {
            if (typeof b === "string" && /^https?:\/\//i.test(b)) return b;
            if (typeof b === "object") {
                const cand = ["img", "image", "logo", "logo_url", "url", "src", "logoUrl", "image_url"];
                for (const k of cand) if (b[k] && typeof b[k] === "string" && /^https?:\/\//i.test(b[k])) return b[k];
                if (b.image && b.image.src && /^https?:\/\//i.test(b.image.src)) return b.image.src;
            }
        }
        const alt = ["brandImage", "brand_img", "brand_logo", "brand_image", "brand"];
        for (const p of alt) if (obj[p] && typeof obj[p] === "string" && /^https?:\/\//i.test(obj[p])) return obj[p];
        return null;
    }

    // BRAND LINK extractor — only looks inside brand object or brand-specific keys
    // IMPORTANT: we intentionally DO NOT use top-level `link` (which is usually the post URL)
    function extractBrandLink(obj) {
        if (!obj || typeof obj !== "object") return null;
        const b = obj.brand;
        if (b) {
            if (typeof b === "string" && /^https?:\/\//i.test(b)) {
                // Rare case brand is stored as URL string
                return b;
            }
            if (typeof b === "object") {
                const cand = ["link", "url", "website", "site", "link_url", "website_url", "brand_url", "linkUrl", "websiteUrl"];
                for (const k of cand) {
                    if (b[k] && typeof b[k] === "string" && /^https?:\/\//i.test(b[k])) return b[k];
                }
            }
        }
        // top-level brand-specific keys (avoid plain 'link')
        const alt = ["brandLink", "brand_link", "brandUrl", "brand_url", "brand_website", "brandWebsite", "website"];
        for (const k of alt) {
            if (obj[k] && typeof obj[k] === "string" && /^https?:\/\//i.test(obj[k])) return obj[k];
        }
        return null;
    }

    // Collect brand items from localStorage (map image -> array of brand links found for that image)
    function collectBrandItems() {
        const map = new Map(); // key: image URL -> { img, links: [] , firstSeenIndex }
        let indexCounter = 0;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key || key.indexOf("product:") !== 0) continue;
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                try {
                    const obj = JSON.parse(raw);
                    const img = extractBrandUrl(obj);
                    if (!img) continue;
                    const link = extractBrandLink(obj); // may be null
                    if (!map.has(img)) {
                        map.set(img, { img: img, links: [], idx: indexCounter++ });
                    }
                    if (link && typeof link === 'string' && /^https?:\/\//i.test(link)) {
                        // push unique links only
                        const entry = map.get(img);
                        if (!entry.links.includes(link)) entry.links.push(link);
                    }
                } catch (e) {
                    // skip invalid JSON
                    continue;
                }
            }
        } catch (e) {
            console.error("collectBrandItems error", e);
        }

        // Build ordered array preserving first-seen order and choose a link per image
        const items = Array.from(map.values()).sort((a, b) => a.idx - b.idx).map(entry => {
            const chosenLink = entry.links.length ? entry.links[0] : "#"; // choose first found brand link or '#'
            return { img: entry.img, link: chosenLink };
        });

        return items;
    }

    // Find exact text nodes equal to shortcode (safe)
    function findShortcodeTextNodes(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) { return node.nodeValue && node.nodeValue.trim() === SHORTCODE ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; }
        }, false);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        return nodes;
    }

    // Build slider DOM — wrap image in anchor only if item's link is truthy (we use '#' fallback)
    function buildSliderPlaceholder(id, items) {
        const wrapper = document.createElement('div');
        wrapper.className = 'brand-images-slider';
        wrapper.id = id;

        const inner = document.createElement('div');
        inner.className = 'brand-inner';

        const swiper = document.createElement('div');
        swiper.className = 'swiper';

        const swWrapper = document.createElement('div');
        swWrapper.className = 'swiper-wrapper';

        items.forEach(it => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide';

            const img = document.createElement('img');
            img.src = it.img;
            img.alt = '';
            img.loading = 'lazy';

            // if link exists and is a valid http(s) URL, use it; else fallback to '#'
            const href = (it.link && typeof it.link === 'string' && /^https?:\/\//i.test(it.link)) ? it.link : "#";

            const a = document.createElement('a');
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.appendChild(img);

            slide.appendChild(a);
            swWrapper.appendChild(slide);
        });

        const prev = document.createElement('div');
        prev.className = 'brand-prev';
        prev.innerHTML = '❮';
        const next = document.createElement('div');
        next.className = 'brand-next';
        next.innerHTML = '❯';
        const pag = document.createElement('div');
        pag.className = 'swiper-pagination';

        swiper.appendChild(swWrapper);
        swiper.appendChild(prev);
        swiper.appendChild(next);
        swiper.appendChild(pag);

        inner.appendChild(swiper);
        wrapper.appendChild(inner);
        return wrapper;
    }

    function initSwiperInstance(wrapperEl) {
        const swiperEl = wrapperEl.querySelector('.swiper');
        if (!swiperEl) return;
        if (swiperEl.__initialized) return;
        swiperEl.__initialized = true;

        const prevEl = wrapperEl.querySelector('.brand-prev');
        const nextEl = wrapperEl.querySelector('.brand-next');
        const pagEl = wrapperEl.querySelector('.swiper-pagination');

        try {
            /* global Swiper */
            const sw = new Swiper(swiperEl, {
                slidesPerView: 5,
                spaceBetween: 30,
                loop: true,
                navigation: { prevEl, nextEl },
                pagination: { el: pagEl, clickable: true, dynamicBullets: true },
                breakpoints: {
                    0: { slidesPerView: 1 },
                    480: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1340: { slidesPerView: 5 },
                }
            });
            wrapperEl.__swiper = sw;
        } catch (e) { console.error("swiper init failed", e); }
    }

    // main
    function run() {
        const nodes = findShortcodeTextNodes(document.body);
        if (!nodes.length) return;

        const items = collectBrandItems();
        if (!items || !items.length) {
            console.warn("No brand images found in localStorage (product:...)");
            return;
        }

        const ensureSwiper = (typeof window.Swiper !== 'undefined') ? Promise.resolve() : Promise.all([loadCssOnce(SWIPER_CSS), loadScriptOnce(SWIPER_JS)]);

        ensureSwiper.then(() => {
            nodes.forEach((textNode, idx) => {
                const parent = textNode.parentNode;
                if (!parent) return;
                const placeholderId = 'brandSlider_' + Math.random().toString(36).slice(2, 9) + '_' + idx;
                const placeholder = buildSliderPlaceholder(placeholderId, items);
                parent.replaceChild(placeholder, textNode);
                initSwiperInstance(placeholder);
            });
        }).catch(err => {
            console.error("Failed to load Swiper:", err);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
    else setTimeout(run, 0);

})();


//------------------LinkList10 Categories Slider ---------------------------//

document.addEventListener("DOMContentLoaded", () => {
    const ul = document.querySelector("#LinkList10 ul.categories-grid");
    const items = ul.querySelectorAll("li");

    // Create Swiper container dynamically
    const swiperContainer = document.createElement("div");
    swiperContainer.className = "swiper";
    const swiperWrapper = document.createElement("div");
    swiperWrapper.className = "swiper-wrapper";

    // Convert li -> swiper-slide
    items.forEach(li => {
        const link = li.querySelector("a");
        let text = link.childNodes[0].textContent.trim();
        let imgTag = link.querySelector("img");

        let url = "";
        if (imgTag) {
            url = imgTag.src;
        } else {
            const match = link.innerHTML.match(/{(https?:\/\/[^}]+)}/);
            if (match) {
                url = match[1];
                // Remove the {url} from the text
                text = text.replace(match[0], "").trim();
            }
        }

        if (url) {
            const slide = document.createElement("div");
            slide.className = "swiper-slide";
            slide.style.backgroundImage = `url(${url})`;

            const label = document.createElement("span");
            label.textContent = text;
            slide.appendChild(label);

            swiperWrapper.appendChild(slide);
        }
    });

    swiperContainer.appendChild(swiperWrapper);

    // Add navigation buttons
    const nextBtn = document.createElement("div");
    nextBtn.className = "swiper-button-next";
    const prevBtn = document.createElement("div");
    prevBtn.className = "swiper-button-prev";
    swiperContainer.appendChild(nextBtn);
    swiperContainer.appendChild(prevBtn);

    // Replace UL with Swiper
    ul.replaceWith(swiperContainer);

    // Init Swiper (no autoplay)
    new Swiper("#LinkList10 .swiper", {
        loop: true,
        centeredSlides: true,
        slidesPerView: 'auto',
        spaceBetween: 30,
        grabCursor: true,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        },
        breakpoints: {
            1600: { slidesPerView: 6 },
            1400: { slidesPerView: 5 },
            1024: { slidesPerView: 4 },
            768: { slidesPerView: 3 },
            480: { slidesPerView: 3 },
            350: { slidesPerView: 2 },
            320: { slidesPerView: 1 },
            120: { slidesPerView: 1 }
        }
    });
});


/*----------------------------Banner Images Buttons-----------------------*/

// Banner Images Buttons
document.addEventListener("DOMContentLoaded", function () {
    const imageIds = [
        "#Image1", "#Image2", "#Image3", "#Image4", "#Image5"
    ];

    imageIds.forEach(id => {
        const widgetContent = document.querySelector(id + " .widget-content");
        if (!widgetContent) return;

        const linkElement = widgetContent.querySelector("a[href]");
        if (!linkElement) return;

        const link = linkElement.getAttribute("href");
        if (!link) return;

        const button = document.createElement("a");
        button.href = link;
        button.className = "hero-button";
        button.textContent = "Shop Now";

        widgetContent.appendChild(button);
    });
});



//--------------------------Blogger Comments---------------------------//

document.addEventListener("DOMContentLoaded", function () {
    // --- Get comment limit from theme settings ---
    function getCommentLimit() {
        const el = document.querySelector("#theme-settings a[href*='Comments Limit']");
        if (el) {
            let val = parseInt(el.getAttribute("href"), 10);
            if (!isNaN(val)) {
                return Math.max(5, Math.min(val, 50)); // min 5, max 50
            }
        }
        return 8; // default fallback
    }

    const commentsPerPage = getCommentLimit();

    // --- Parse comments for images and links ---
    function parseCommentContent(text) {
        if (typeof text !== 'string') return text;

        // 1) Collect image URLs (limit 6)
        const imageRegex = /\{(https?:\/\/[^\s{}]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^\s{}]*)?)\}/gi;
        const imageMatches = [...text.matchAll(imageRegex)];
        const images = imageMatches.slice(0, 6).map(m => m[1]);

        // 2) If we have images, remove ALL image tokens and insert the image-container
        if (images.length > 0) {
            const firstMatch = imageMatches[0];
            const firstIndex = typeof firstMatch.index === 'number' ? firstMatch.index : text.search(imageRegex);

            // remove all image placeholders
            const textWithoutImages = text.replace(imageRegex, '');

            // build image container HTML
            const imagesHtml = images.map(url =>
                `<div class="comment-img"><img src="${url}" alt="Comment Image" onclick="openLightbox('${url.replace(/'/g, "\\'")}')"></div>`
            ).join('');

            const containerHtml = `<div class="comment-images">${imagesHtml}</div>`;

            // insert the container at the position of first image placeholder
            const insertPos = Math.max(0, firstIndex);
            text = textWithoutImages.slice(0, insertPos) + containerHtml + textWithoutImages.slice(insertPos);
        }

        // 3) Parse link tokens (Label {url}) - allow urls with or without protocol
        const linkRegex = /\(([^(){}]+?)\s*\{\s*([^\s{}]+)\s*\}\)/gi;
        text = text.replace(linkRegex, function (_, label, url) {
            let href = (url || '').trim();
            if (!href) return label || href;

            // if no scheme, prefix https://
            if (!/^[a-zA-Z][a-zA-Z0-9+.\-]*:\/\//.test(href)) {
                href = 'https://' + href;
            }

            // display label (trimmed) or short hostname if label empty
            let display = (label || '').trim();
            if (!display) {
                try { display = (new URL(href)).hostname.replace(/^www\./, ''); }
                catch (e) { display = href; }
            }

            return `<a href="${href}" class="comment-link" target="_blank" rel="noopener">${display}</a>`;
        });

        return text;
    }
    // --- Apply parsing to all comments ---
    function applyCommentEnhancements() {
        document.querySelectorAll(".comment .comment-content").forEach(function (el) {
            el.innerHTML = parseCommentContent(el.innerHTML);
        });
    }

    applyCommentEnhancements();

    // --- Load More functionality ---
    const commentList = document.querySelectorAll(".comment-thread .comment");
    if (commentList.length > commentsPerPage) {
        const loadMoreBtn = document.createElement("button");
        loadMoreBtn.className = "load-more-comments";
        loadMoreBtn.textContent = "Load More Comments";

        const replyBox = document.querySelector(".comment-replybox-thread") || document.querySelector(".comment-thread");
        replyBox.parentNode.insertBefore(loadMoreBtn, replyBox);

        let visibleCount = commentsPerPage;

        function updateComments() {
            commentList.forEach((c, i) => {
                c.style.display = i < visibleCount ? "block" : "none";
            });
        }

        updateComments();

        loadMoreBtn.addEventListener("click", function () {
            visibleCount += commentsPerPage;
            updateComments();
            if (visibleCount >= commentList.length) {
                loadMoreBtn.style.display = "none";
            }
        });
    }

    // --- Lightbox functionality ---
    window.openLightbox = function (src) {
        const existing = document.getElementById("lightbox");
        if (existing) existing.remove();

        const lb = document.createElement("div");
        lb.id = "lightbox";
        lb.innerHTML = `
      <div class="lightbox-content" role="dialog" aria-modal="true">
        <button class="lightbox-close" aria-label="Close">&times;</button>
        <img src="${src}" alt="Full Image">
      </div>`;
        document.body.appendChild(lb);

        // Close button
        lb.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
        // Background click
        lb.addEventListener("click", (e) => {
            if (e.target === lb) closeLightbox();
        });
        // Esc key
        document.addEventListener("keydown", escHandler);
    };

    function escHandler(e) {
        if (e.key === "Escape") closeLightbox();
    }

    window.closeLightbox = function () {
        const lb = document.getElementById("lightbox");
        if (lb) lb.remove();
        document.removeEventListener("keydown", escHandler);
    };
});

//---------------------------Products Short Codes--------------------------------------- //

//-----------------------Stock Status Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";

    // Function to update stock display for a post
    function updateStockDisplay(post, productData) {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const savedStock = productData.stock || "In Stock";
        const stockDiv = post.querySelector(".saved-stock");
        if (stockDiv) {
            stockDiv.className = "saved-stock";
            stockDiv.innerHTML = "";
            if (savedStock === "Out of Stock" || savedStock === "0") {
                stockDiv.textContent = "Out of Stock";
                stockDiv.classList.add("out-of-stock");
            } else if (savedStock === "In Stock") {
                stockDiv.textContent = "In Stock";
                stockDiv.classList.add("in-stock");
            } else if (/^\d+$/.test(savedStock)) {
                const numberSpan = document.createElement("span");
                numberSpan.className = "stock-number";
                numberSpan.textContent = savedStock;
                const textSpan = document.createElement("span");
                textSpan.className = "stock-text";
                textSpan.textContent = " In Stock";
                stockDiv.appendChild(numberSpan);
                stockDiv.appendChild(textSpan);
            }
            stockDiv.setAttribute("data-stock", savedStock);
            updateButtons(savedStock, postUrl);
        }
    }

    // Update buttons based on stock status
    const updateButtons = (stockVal, postUrl) => {
        document
            .querySelectorAll(`.post[data-post-url="${postUrl}"] .icon-btn`)
            .forEach((button) => {
                if (stockVal === "0" || stockVal === "Out of Stock") {
                    button.classList.add("disabled-button");
                } else {
                    button.classList.remove("disabled-button");
                }
            });
    };

    // Initial stock rendering on page load
    document.querySelectorAll(".post").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const postContent = post.textContent;
        const match = postContent.match(/\[data-stock="([\s\S]*?)"\]/i);
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        productData.stock = match ? match[1].trim() : "";
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving stock for product ${postUrl}:`, e);
        }

        updateStockDisplay(post, productData);
    });

    // Listen for stock updates from checkout
    window.addEventListener("stockUpdated", function (event) {
        const updatedProducts = event.detail.updatedProducts || [];
        updatedProducts.forEach(({ postUrl, variantKey }) => {
            const post = document.querySelector(`.post[data-post-url="${postUrl}"]`);
            if (!post) {
                console.warn(`No post found for ${postUrl} to update stock display`);
                return;
            }
            const productData =
                JSON.parse(localStorage.getItem(`product:${postUrl}`)) || {};
            updateStockDisplay(post, productData);
        });
    });
});

//-----------------------Sale Discount Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const rawSale =
            post.querySelector(".raw-sale")?.innerText || post.textContent;
        const badge = post.querySelector(".saved-product-sale");
        let saleValue = "";
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const match = rawSale.match(/\[data-sale="([^"]*?)"\]/i);
        if (match && match[1]) {
            const value = match[1].trim();
            const percent = parseInt(value, 10);
            if (!isNaN(percent) && percent >= -100 && percent <= 100) {
                saleValue = `${percent}%`;
            }
        }
        productData.sale = saleValue;
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving sale for product ${postUrl}:`, e);
        }

        if (badge) {
            const percent = parseInt(saleValue, 10);
            const isValid =
                saleValue &&
                saleValue.endsWith("%") &&
                !isNaN(percent) &&
                percent >= -100 &&
                percent <= 100;
            if (isValid) {
                badge.textContent = saleValue;
                badge.setAttribute("data-saved-sale", saleValue);
                badge.style.display = "inline-block";
                badge.classList.remove("invalid");
            } else {
                badge.style.display = "none";
            }
        }
    });
});

//-----------------------Prices Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    function extractShortcode(text, key) {
        const regex = new RegExp(`\\[${key}="([^"]*?)"\\]`, "i");
        const match = text.match(regex);
        return match ? match[1].trim() : "";
    }

    function formatPrice(value) {
        if (!value) return "";
        const match = value.match(/^([^\d\s,.\-]*)\s*(.*)$/);
        const symbol = (match[1] || "").trim();
        let numberPart = (match[2] || "").replace(/\s+/g, "").replace(/,/g, "");
        const decimalMatch = numberPart.match(/^(\d+)(\.\d{1,2})?$/);
        if (!decimalMatch) return value.trim();
        const integerPart = decimalMatch[1];
        const decimalPart = decimalMatch[2] || "";
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return symbol
            ? `${symbol} ${formattedInteger}${decimalPart}`
            : `${formattedInteger}${decimalPart}`;
    }

    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const rawPrice =
            post.querySelector(".raw-price")?.innerText || post.textContent;
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const currentPrice = extractShortcode(rawPrice, "data-current-price");
        const oldPrice = extractShortcode(rawPrice, "data-old-price");
        productData.prices = { current: currentPrice || "", old: oldPrice || "" };
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving prices for product ${postUrl}:`, e);
        }

        const savedCurrent = productData.prices.current;
        const savedOld = productData.prices.old;
        const currentDivs = post.querySelectorAll(".saved-current-price");
        const oldDivs = post.querySelectorAll(".saved-old-price");

        currentDivs.forEach((div) => {
            if (savedCurrent) {
                div.textContent = formatPrice(savedCurrent);
                div.style.display = "inline-block";
                div.setAttribute("data-saved-current-price", savedCurrent);
            } else {
                div.style.display = "none";
            }
        });

        oldDivs.forEach((div) => {
            if (savedOld) {
                div.textContent = formatPrice(savedOld);
                div.style.display = "inline-block";
                div.setAttribute("data-saved-old-price", savedOld);
            } else {
                div.style.display = "none";
            }
        });
    });
});

//-----------------------Brand Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const nameDiv = post.querySelector(".saved-brand-name");
        const imageDiv = post.querySelector(".saved-brand-image");
        let matchedText = null;
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const walker = document.createTreeWalker(
            post,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        while (walker.nextNode()) {
            const nodeText = walker.currentNode.nodeValue;
            const match = nodeText.match(/\[data-brand="([^"]+)"\]/i);
            if (match) {
                matchedText = match[1];
                const span = document.createElement("span");
                span.style.display = "none";
                span.textContent = nodeText;
                walker.currentNode.parentNode.replaceChild(span, walker.currentNode);
                break;
            }
        }

        if (matchedText) {
            const curlyMatches = [
                ...matchedText.matchAll(/\{(https?:\/\/[^\s{}]+)\}/g),
            ];
            const linkUrl = curlyMatches[0]?.[1] || "";
            const imageUrl = curlyMatches[1]?.[1] || "";
            const nameOnly = matchedText
                .replace(/\{https?:\/\/[^\s{}]+\}/g, "")
                .trim();
            productData.brand = {
                name: nameOnly || "",
                link: linkUrl || "",
                image: imageUrl || "",
            };
        } else {
            productData.brand = {};
        }
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving brand for product ${postUrl}:`, e);
        }

        const savedBrand = productData.brand || {};
        const savedName = savedBrand.name;
        const savedImage = savedBrand.image;
        const savedLink = savedBrand.link;

        if (savedName && nameDiv) {
            nameDiv.textContent = savedName;
            nameDiv.style.display = "flex";
            nameDiv.setAttribute("data-brand-name", savedName);
        } else if (nameDiv) {
            nameDiv.style.display = "none";
        }

        if (savedImage && imageDiv) {
            imageDiv.style.backgroundImage = `url('${savedImage}')`;
            imageDiv.style.display = "flex";
            imageDiv.setAttribute("data-brand-image", savedImage);
        } else if (imageDiv) {
            imageDiv.style.display = "none";
        }

        if (savedLink) {
            if (nameDiv && !nameDiv.closest("a")) {
                const nameLink = document.createElement("a");
                nameLink.href = savedLink;
                nameLink.className = "brand-link";
                nameDiv.parentNode.insertBefore(nameLink, nameDiv);
                nameLink.appendChild(nameDiv);
            }
            if (imageDiv && !imageDiv.closest("a")) {
                const imageLink = document.createElement("a");
                imageLink.href = savedLink;
                imageLink.className = "brand-link";
                imageDiv.parentNode.insertBefore(imageLink, imageDiv);
                imageLink.appendChild(imageDiv);
            }
        }
    });
});

//-----------------------SKU Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const rawSku =
            post.querySelector(".raw-sku")?.innerText || post.textContent;
        const skuDiv = post.querySelector(".saved-sku");
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const match = rawSku.match(/\[data-SKU="([^"]*?)"\]/i);
        productData.sku = match ? match[1].trim() : "";
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving SKU for product ${postUrl}:`, e);
        }

        if (skuDiv) {
            if (productData.sku) {
                skuDiv.textContent = productData.sku;
                skuDiv.setAttribute("data-sku", productData.sku);
                skuDiv.classList.remove("hidden");
            } else {
                skuDiv.classList.add("hidden");
            }
        }
    });
});

//-----------------------CountDown Timer Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    const MAX_DAYS = 365;
    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const rawCountdown =
            post.querySelector(".raw-countdown")?.innerText || post.textContent;
        const container = post.querySelector(".countdown-container");
        const timer = post.querySelector(".saved-countdown");
        if (!container || !timer) return;

        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const match = rawCountdown
            .trim()
            .match(/\[countdown=(\d+)\/(\d+)\/(\d+)\/(\d+)(\(repeat\))?\]/i);
        if (!match) {
            container.style.display = "none";
            productData.countdown = {};
            try {
                localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
            } catch (e) {
                console.error(`Error saving countdown for product ${postUrl}:`, e);
            }
            return;
        }

        let [, dStr, hStr, mStr, sStr, repeatFlag] = match;
        let d = Math.min(parseInt(dStr), MAX_DAYS);
        let h = parseInt(hStr);
        let m = parseInt(mStr);
        let s = parseInt(sStr);
        const isRepeat = !!repeatFlag;
        const shortcodeValue = `${d}/${h}/${m}/${s}${isRepeat ? "(repeat)" : ""}`;

        // Only set countdown if not already running or shortcode changed
        const now = Date.now();
        const duration = (((d * 24 + h) * 60 + m) * 60 + s) * 1000;
        if (
            !productData.countdown?.target ||
            productData.countdown.shortcode !== shortcodeValue
        ) {
            productData.countdown = {
                shortcode: shortcodeValue,
                duration: duration,
                target: now + duration,
                repeat: isRepeat,
            };
            try {
                localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
            } catch (e) {
                console.error(`Error saving countdown for product ${postUrl}:`, e);
            }
        }

        const saved = productData.countdown || {};
        const updateCountdown = () => {
            if (!saved.target) return;
            const now = Date.now();
            let distance = saved.target - now;
            if (distance <= 0) {
                if (saved.repeat) {
                    saved.target = now + saved.duration;
                    productData.countdown = saved;
                    try {
                        localStorage.setItem(
                            `product:${postUrl}`,
                            JSON.stringify(productData)
                        );
                    } catch (e) {
                        console.error(
                            `Error updating countdown for product ${postUrl}:`,
                            e
                        );
                    }
                    distance = saved.duration;
                } else {
                    container.style.display = "none";
                    clearInterval(interval);
                    return;
                }
            }
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            timer.querySelector('[data-type="days"]').textContent = String(
                days
            ).padStart(2, "0");
            timer.querySelector('[data-type="hours"]').textContent = String(
                hours
            ).padStart(2, "0");
            timer.querySelector('[data-type="minutes"]').textContent = String(
                minutes
            ).padStart(2, "0");
            timer.querySelector('[data-type="seconds"]').textContent = String(
                seconds
            ).padStart(2, "0");
        };

        if (d + h + m + s > 0) {
            container.style.display = "block";
            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);
        } else {
            container.style.display = "none";
            productData.countdown = {};
            try {
                localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
            } catch (e) {
                console.error(`Error saving countdown for product ${postUrl}:`, e);
            }
        }
    });
});

//-----------------------Variants Short Codes-------------------------------//

(function () {
    const posts = document.querySelectorAll(".post");
    const allowedBadges = [
        "Hot",
        "New",
        "Best Seller",
        "Deal",
        "Trending",
        "Popular",
        "Limited Time",
        "Top Rated",
        "Free Shipping",
        "Recommended",
        "Free",
        "Sponsered",
    ];

    posts.forEach((post) => {
        const postUrl = post
            .getAttribute("data-post-url")
            ?.split("#")[0]
            ?.split("?")[0]
            ?.replace(/\/$/, "");
        const rawEl = post.querySelector(".raw-variants");
        if (!postUrl || !rawEl) return;

        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        // Extract variant groups from [variants] shortcode
        let rawHTML = rawEl.innerHTML;
        const textarea = document.createElement("textarea");
        textarea.innerHTML = rawHTML;
        rawHTML = textarea.value;
        const shortcodeRegex = /\[variants(\d)\(([^)]+)\)=([^\]\n\r]+)\]/g;
        let match;
        const parsed = {};
        let found = !1;

        while ((match = shortcodeRegex.exec(rawHTML)) !== null) {
            const [, groupId, label, rawValues] = match;
            const valueString = rawValues.replace(/\s*\+\s*/g, "+").trim();
            const values = valueString
                .split("+")
                .map((v) => v.trim())
                .filter(Boolean);
            parsed[`group-${groupId}`] = { label: label.trim(), values };
            found = !0;
        }

        // Extract variant details from <img> alt text
        const imageUrls = [];
        const variants = {};
        post.querySelectorAll("img").forEach((img) => {
            const src = img.getAttribute("src");
            const alt = img.getAttribute("alt") || "";
            if (src && !imageUrls.includes(src)) imageUrls.push(src);
            const match = alt.match(/\[([^\]]+)\]/);
            if (match) {
                const parts = match[1].split(",").map((p) => p.trim());
                const variantName = parts
                    .find((p) => p.startsWith("variant="))
                    ?.split("=")[1]
                    ?.trim()
                    ?.toLowerCase();
                if (variantName) {
                    const saleValue =
                        parts
                            .find((p) => p.startsWith("sale="))
                            ?.split("=")[1]
                            ?.trim() || "";
                    const badgeValue =
                        parts
                            .find((p) => p.startsWith("badge="))
                            ?.split("=")[1]
                            ?.trim() || "";
                    variants[variantName] = {
                        images: variants[variantName]?.images || [],
                        oldPrice:
                            parts
                                .find((p) => p.startsWith("old-price="))
                                ?.split("=")[1]
                                ?.trim() || "",
                        currentPrice:
                            parts
                                .find((p) => p.startsWith("current-price="))
                                ?.split("=")[1]
                                ?.trim() || "",
                        stock:
                            parts
                                .find((p) => p.startsWith("stock="))
                                ?.split("=")[1]
                                ?.trim() || "",
                        sale: saleValue && /^\-?\d+%$/.test(saleValue) ? saleValue : "",
                        badge: allowedBadges.includes(badgeValue) ? badgeValue : "",
                    };
                    if (src && !variants[variantName].images.includes(src)) {
                        variants[variantName].images.push(src);
                    }
                }
            }
        });

        // Merge variant groups and variant details
        productData.variants = found ? parsed : {};
        productData.images = imageUrls;
        if (Object.keys(variants).length > 0) {
            productData.variants.details = variants;
        }
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving variants for product ${postUrl}:`, e);
        }

        const variantData = productData.variants;
        if (!variantData || !found) return;

        const selected = {};
        const preview = post.querySelector(".variant-preview");
        const isLimitedView =
            post.classList.contains("homepage-view-variants") ||
            post.classList.contains("fullpage-view-variants");
        let groupShown = !1;
        const groupPriority = ["group-1", "group-2", "group-3"];

        groupPriority.forEach((groupKey) => {
            const groupData = variantData[groupKey];
            if (!groupData) return;
            const { label, values } = groupData;
            const container = post.querySelector(`.${groupKey}-container`);
            const group = container?.querySelector(`.variant-group.${groupKey}`);
            const clearBtn = container?.querySelector(".clear-btn");
            if (!container || !group || !values.length) return;
            if (isLimitedView && groupShown) return;
            groupShown = !0;

            container.classList.add("show");
            container.querySelector("strong").innerText = `${label}:`;
            group.innerHTML = "";

            values.forEach((val) => {
                const span = document.createElement("span");
                if (groupKey === "group-1") {
                    const colorMatch = /\((#[^)]+)\)/.exec(val);
                    if (colorMatch) {
                        span.style.backgroundColor = colorMatch[1];
                        span.setAttribute("data-label", val.split("(")[0].trim());
                    } else {
                        span.style.backgroundColor = val.toLowerCase();
                        span.setAttribute("data-label", val);
                    }
                } else if (groupKey === "group-2") {
                    span.textContent = val;
                    span.setAttribute("data-label", val);
                } else if (groupKey === "group-3") {
                    const imgMatch = val.match(/^(.*?)\s*\{(https?:\/\/.+?)\}\s*$/);
                    if (imgMatch) {
                        const name = imgMatch[1].trim();
                        const url = imgMatch[2].trim();
                        span.style.backgroundImage = `url("${url}")`;
                        span.setAttribute("data-label", name);
                    } else {
                        span.innerText = val;
                        span.setAttribute("data-label", val);
                    }
                }

                span.addEventListener("click", () => {
                    group
                        .querySelectorAll("span")
                        .forEach((s) => s.classList.remove("selected"));
                    span.classList.add("selected");
                    selected[label] =
                        span.getAttribute("data-label") || span.innerText || "N/A";
                    if (clearBtn) clearBtn.style.display = "inline";
                    updatePreview();
                });
                group.appendChild(span);
            });

            if (clearBtn) {
                clearBtn.style.display = "none";
                group.appendChild(clearBtn);
            }
        });

        function clearSelection(btn) {
            const container = btn.closest(".product-variants");
            const label = container
                .querySelector("strong")
                .innerText.replace(":", "");
            container
                .querySelectorAll("span")
                .forEach((s) => s.classList.remove("selected"));
            delete selected[label];
            btn.style.display = "none";
            updatePreview();
        }

        window.clearSelection = clearSelection;

        function updatePreview() {
            if (!preview) return;
            preview.innerHTML = "";
            if (Object.keys(selected).length > 0) {
                preview.style.display = "block";
                for (let key in selected) {
                    const span = document.createElement("span");
                    span.textContent = `${key}: ${selected[key]}`;
                    preview.appendChild(span);
                }
            } else {
                preview.style.display = "none";
            }
        }
    });
})();

//-----------------------Short Description Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const rawDesc =
            post.querySelector(".raw-short-description")?.innerText ||
            post.textContent;
        const descDiv = post.querySelector(".saved-short-description");
        if (!descDiv) return;

        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const match = rawDesc.match(/\[data-short-description="([\s\S]*?)"\]/i);
        productData.shortDescription = match ? match[1].trim() : "";
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(
                `Error saving short description for product ${postUrl}:`,
                e
            );
        }

        if (productData.shortDescription) {
            descDiv.textContent = productData.shortDescription;
            descDiv.classList.remove("hidden");
        } else {
            descDiv.textContent = "";
            descDiv.classList.add("hidden");
        }
    });
});

//-----------------------Badges Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    const allowedBadges = [
        "Hot",
        "New",
        "Best Seller",
        "Deal",
        "Trending",
        "Popular",
        "Limited Time",
        "Top Rated",
        "Free Shipping",
        "Recommended",
        "Free",
        "Sponsered",
    ];
    const classMap = {
        Hot: "badge-hot",
        New: "badge-new",
        "Best Seller": "badge-best-seller",
        Deal: "badge-deal",
        Trending: "badge-trending",
        Popular: "badge-popular",
        "Limited Time": "badge-limited-time",
        "Top Rated": "badge-top-rated",
        "Free Shipping": "badge-free-shipping",
        Recommended: "badge-recommended",
        Free: "badge-free",
        Sponsered: "badge-sponsored",
    };

    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        const rawBadge =
            post.querySelector(".raw-badge")?.innerText || post.textContent;
        const badgeDiv = post.querySelector(".saved-product-badge");
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        const match = rawBadge.match(/\[data-badge="([^"]*?)"\]/i);
        let badgeValue = match ? match[1].trim() : "";
        if (badgeValue && !allowedBadges.includes(badgeValue)) {
            badgeValue = "";
        }
        productData.badge = badgeValue;
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving badge for product ${postUrl}:`, e);
        }

        if (badgeDiv) {
            if (badgeValue && allowedBadges.includes(badgeValue)) {
                badgeDiv.textContent = badgeValue;
                badgeDiv.className = `saved-product-badge ${classMap[badgeValue]}`;
                badgeDiv.style.display = "inline-block";
            } else {
                badgeDiv.textContent = "";
                badgeDiv.className = "saved-product-badge";
                badgeDiv.style.display = "none";
            }
        }
    });
});

//-----------------------Size Chart Short Codes-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const cleanUrl = (url) =>
        url?.split("#")[0]?.split("?")[0]?.replace(/\/$/, "") || "";
    const htmlContent = document.body.innerHTML;
    let imageUrl = "";
    let hasExplicitNone = false;
    const sizeGuideMatch = htmlContent.match(
        /\[size-guide=\s*["']?\{([^}]+)\}["']?\]/i
    );
    if (sizeGuideMatch) {
        const value = sizeGuideMatch[1].trim().toLowerCase();
        if (value === "none") {
            hasExplicitNone = true;
            imageUrl = "none";
        } else if (value.startsWith("http")) {
            imageUrl = value;
        }
    }

    if (!imageUrl && !hasExplicitNone) {
        const defaultMatch = htmlContent.match(
            /\[size-guide-default=\s*["']?\{([^}]+)\}["']?\]/i
        );
        if (defaultMatch) {
            const fallbackUrl = defaultMatch[1].trim();
            if (fallbackUrl.startsWith("http")) {
                imageUrl = fallbackUrl;
            }
        }
    }

    document.querySelectorAll(".post[data-post-url]").forEach((post) => {
        const postUrl = cleanUrl(post.getAttribute("data-post-url"));
        if (!postUrl) return;
        let productData = JSON.parse(
            localStorage.getItem(`product:${postUrl}`)
        ) || {
            stock: "",
            sale: "",
            prices: { current: "", old: "" },
            badge: "",
            brand: {},
            sku: "",
            countdown: {},
            shortDescription: "",
            sizeGuide: "",
            variants: {},
            images: [],
        };

        productData.sizeGuide = imageUrl || "";
        try {
            localStorage.setItem(`product:${postUrl}`, JSON.stringify(productData));
        } catch (e) {
            console.error(`Error saving size guide for product ${postUrl}:`, e);
        }
    });

    const sizeGuideBtns = document.querySelectorAll(".size-guide-btn");
    const overlay = document.querySelector(".size-chart-overlay");
    if (!overlay) {
        sizeGuideBtns.forEach((btn) => (btn.style.display = "none"));
        return;
    }

    const closeBtn = overlay.querySelector(".close-btn");
    const sizeChartImg = overlay.querySelector(".size-chart-image");
    const productMainLeft = document.querySelector(".product-main-left");
    const originalZIndex = productMainLeft
        ? window.getComputedStyle(productMainLeft).zIndex
        : "";

    if (!imageUrl || hasExplicitNone) {
        sizeGuideBtns.forEach((btn) => (btn.style.display = "none"));
        overlay.style.display = "none";
        return;
    }

    sizeGuideBtns.forEach((btn) => {
        btn.addEventListener("click", function () {
            if (sizeChartImg) sizeChartImg.src = imageUrl;
            overlay.style.display = "block";
            document.body.style.overflow = "hidden";
            if (productMainLeft) productMainLeft.style.zIndex = "-1";
        });
    });

    function closeOverlay() {
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
        if (productMainLeft) productMainLeft.style.zIndex = originalZIndex || "";
    }

    if (closeBtn) closeBtn.addEventListener("click", closeOverlay);
    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeOverlay();
    });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeOverlay();
    });
});

//-----------------------Accorditions--------------------------------------//

// IIFE wrapper to prevent any conflicts with Blogger's scripts.
(function () {
    /**
     * Decodes HTML entities (e.g., &lt;) back into characters (e.g., <).
     * This is crucial for rendering Font Awesome icons from the shortcode.
     * @param {string} encodedString The string with HTML entities.
     * @returns {string} The decoded HTML string.
     */
    function decodeHtmlEntities(encodedString) {
        // A temporary textarea is a standard and safe way to decode entities.
        const textarea = document.createElement("textarea");
        textarea.innerHTML = encodedString;
        return textarea.value;
    }

    /**
     * This function finds and replaces all accordion shortcodes within the post body,
     * leaving all other scripts on the page unharmed.
     */
    function renderAccordionsInPost() {
        const postContainerSelector = ".post-body";
        const postContainer = document.querySelector(postContainerSelector);

        if (!postContainer) {
            console.warn(
                "Accordion script: Could not find post container with selector:",
                postContainerSelector
            );
            return;
        }

        let postHTML = postContainer.innerHTML;
        const shortcodeRegex = /\[accordition[\s\S]*?\]/g;

        const matches = postHTML.match(shortcodeRegex);
        if (!matches) return;

        let groupIndexCounter = 0;

        matches.forEach((shortcodeText) => {
            const accordionHtml = createAccordionHtml(
                shortcodeText,
                groupIndexCounter
            );
            if (accordionHtml) {
                postHTML = postHTML.replace(shortcodeText, accordionHtml);
                groupIndexCounter++;
            }
        });

        postContainer.innerHTML = postHTML;
    }

    /**
     * Takes a raw shortcode string and builds the final HTML for the accordion.
     */
    function createAccordionHtml(shortcodeText, groupIndex) {
        const itemRegex = /\(icon=([^,]*),\s*title=([^,]*),\s*content=([^\)]*)\)/g;
        const items = shortcodeText.match(itemRegex);
        if (!items) return "";

        let html = `<div class="accordion-container">`;

        items.forEach((item, itemIndex) => {
            const itemMatch = item.match(
                /\(icon=([^,]*),\s*title=([^,]*),\s*content=([^\)]*)\)/
            );
            if (!itemMatch) return;

            let [, icon, title, content] = itemMatch.map((s) => s.trim());
            if (!icon && !title) return;

            const inputId = `item-${groupIndex}-${itemIndex}`;
            const isChecked = itemIndex === 0 ? "checked" : "";

            let iconHtml = "";
            if (icon.startsWith("{") && icon.endsWith("}")) {
                // Image URLs don't need decoding.
                const imgSrc = icon.slice(1, -1);
                iconHtml = `<img src="${imgSrc}" alt="">`;
            } else if (icon) {
                // --- THIS IS THE FIX ---
                // Decode the icon string to turn entities like &lt; back into <
                iconHtml = decodeHtmlEntities(icon);
            }

            html += `
                <div class="accordion-item">
                    <input type="radio" name="accordion-group-${groupIndex}" id="${inputId}" ${isChecked}>
                    <label class="accordion-header" for="${inputId}">
                        <div class="title-icon-wrapper">
                            ${iconHtml}
                            <span class="accordion-title">${title}</span>
                        </div>
                        <span class="accordion-toggle-icon">&#43;</span>
                    </label>
                    <div class="accordion-content">
                        <p>${content}</p>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        return html;
    }

    // Run the script after the page structure is fully loaded.
    document.addEventListener("DOMContentLoaded", renderAccordionsInPost);
})();

//-------------------------- Product Additional Info ----------------------------- //

(function () {
    function splitItems(content) {
        const items = [];
        let buf = "";
        for (let i = 0; i < content.length;) {
            if (content[i] !== ",") {
                buf += content[i++];
                continue;
            }
            let j = i;
            while (j < content.length && content[j] === ",") j++;
            const cnt = j - i;
            if (cnt === 1) {
                items.push(buf.trim());
                buf = "";
            } else {
                buf += ",".repeat(cnt - 1);
            }
            i = j;
        }
        if (buf.trim()) items.push(buf.trim());
        return items;
    }

    function reduceSeq(s, sym) {
        return s.replace(new RegExp(sym + "+", "g"), (m) =>
            sym.repeat(m.length - 1)
        );
    }

    function splitKeyValue(item) {
        let buf = "";
        for (let i = 0; i < item.length;) {
            if (item[i] !== "=") {
                buf += item[i++];
                continue;
            }
            let j = i;
            while (j < item.length && item[j] === "=") j++;
            const cnt = j - i;
            if (cnt === 1) {
                return {
                    key: reduceSeq(buf.trim(), "="),
                    value: reduceSeq(item.slice(j).trim(), "="),
                };
            } else {
                buf += "=".repeat(cnt - 1);
                i = j;
            }
        }
        return { key: reduceSeq(buf.trim(), "="), value: "" };
    }

    function parseContent(raw) {
        return splitItems(raw.replace(/\r?\n/g, " ").trim()).map(splitKeyValue);
    }

    function render(target, raw) {
        const parsed = parseContent(raw);
        const box = document.createElement("div");
        box.className = "additional-info-box";
        const ul = document.createElement("ul");
        parsed.forEach((it) => {
            const li = document.createElement("li");
            const k = document.createElement("span");
            k.textContent = it.key + ": ";
            const v = document.createElement("span");
            v.textContent = it.value;
            li.appendChild(k);
            li.appendChild(v);
            ul.appendChild(li);
        });
        box.appendChild(ul);
        target.innerHTML = "";
        target.appendChild(box);
    }

    function process() {
        const body = document.querySelector(".post-body, .entry-content");
        if (!body) return;

        // Regex to capture [AdditionalInfo ( ... )]
        const regex = /\[AdditionalInfo\s*\(([\s\S]*?)\)\]/i;
        const match = regex.exec(body.innerHTML);

        if (match) {
            // Get raw text inside (...) and STRIP ALL HTML tags
            let raw = match[1]
                .replace(/<[^>]+>/g, " ") // remove ALL tags like <div>, <span>, <b>, <a>, etc.
                .replace(/&nbsp;/gi, " ") // normalize non-breaking spaces
                .replace(/\s+/g, " ") // collapse whitespace
                .trim();

            // Render parsed info in tab2
            const target = document.getElementById("render-additional-info");
            if (target) render(target, raw);

            // Remove the shortcode entirely from description tab
            body.innerHTML = body.innerHTML.replace(regex, "");
        }
    }

    if (document.readyState !== "loading") process();
    else document.addEventListener("DOMContentLoaded", process);
})();

//------------------------Messages-----------------------------//

/* Shortcode processing */
const messageTypes = {
    alert: { class: "alert", icon: "fa-info-circle" },
    warning: { class: "warning", icon: "fa-exclamation-triangle" },
    news: { class: "news", icon: "fa-newspaper" },
    dark: { class: "dark", icon: "fa-moon" },
    danger: { class: "danger", icon: "fa-times-circle" },
    success: { class: "success", icon: "fa-check-circle" },
    info: { class: "info", icon: "fa-info-circle" },
    tip: { class: "tip", icon: "fa-lightbulb" },
    loading: { class: "loading", icon: "fa-spinner fa-spin" },
    processing: { class: "processing", icon: "fa-cog fa-spin" },
    interactive: { class: "interactive", icon: "fa-hand-pointer" },
    promo: { class: "promo", icon: "fa-gift" },
    update: { class: "update", icon: "fa-sync-alt" },
    successActions: {
        class: "success successActions",
        icon: "fa-check-circle",
    },
    dangerActions: {
        class: "danger dangerActions",
        icon: "fa-exclamation-circle",
    },
};

function parseShortcodes(content) {
    const shortcodeRegex =
        /\[([^\s(]+)\(([^)]+)\)(?:,\s*([^"]*?))?\s*"((?:[^"]|\n)*)"\]/g;
    return content.replace(
        shortcodeRegex,
        (match, type, title, actions, message) => {
            const config = messageTypes[type] || {
                class: type,
                icon: "fa-info-circle",
            };
            let buttons = "";

            if (actions && actions.trim()) {
                const actionList = actions
                    .split(/,\s*(?=[^{]*(?:{[^{}]*})*[^{]*$)/)
                    .map((action) => {
                        const [text, url] = action.trim().split("{");
                        const urlClean = url ? url.replace("}", "").trim() : "#";
                        const finalUrl =
                            urlClean.startsWith("http://") || urlClean.startsWith("https://")
                                ? urlClean
                                : `https://${urlClean}`;
                        const btnClass =
                            type === "dangerActions" && text.trim() === "Pay Now"
                                ? "danger-btn"
                                : type === "update" ||
                                    (type === "successActions" && text.trim() === "View Profile")
                                    ? "primary"
                                    : type === "dangerActions" && text.trim() === "View Invoices"
                                        ? "secondary"
                                        : "";
                        return `<button class="message-btn ${btnClass}"><a href="${finalUrl}">${text.trim()}</a></button>`;
                    });
                buttons = `<div class="message-actions">${actionList.join("")}</div>`;
            }

            const dismissBtn = [
                "interactive",
                "loading",
                "processing",
                "update",
                "successActions",
                "dangerActions",
            ].includes(type)
                ? '<button class="dismiss-btn" aria-label="Dismiss message"><i class="fas fa-times"></i></button>'
                : "";

            // Use a div wrapper for message content so nested <p>, <div>, etc. remain valid HTML
            return `
      <div class="message ${config.class}">
        ${dismissBtn}
        <div class="message-title"><i class="fas ${config.icon}"></i>${title}</div>
        <div class="message-content">${message}</div>
        ${buttons}
      </div>`;
        }
    );
}

// Hide only truly empty leaf elements inside messages (ignore <br>, keep icons/buttons)
function cleanEmptyElements(container) {
    const candidates = container.querySelectorAll(".message *:not(br)");
    candidates.forEach((el) => {
        // keep critical UI/icon elements
        const tag = el.tagName.toLowerCase();
        if (
            el.classList.contains("dismiss-btn") ||
            el.classList.contains("message-btn") ||
            el.classList.contains("message-actions") ||
            el.classList.contains("message-title") ||
            (tag === "i" &&
                (el.closest(".dismiss-btn") ||
                    el.closest(".message-title") ||
                    el.closest(".message-btn")))
        ) {
            return;
        }

        // only hide leaf nodes so we don't collapse containers that hold other elements
        if (el.children.length === 0) {
            const text = el.textContent.replace(/\u00a0/g, "").trim(); // remove &nbsp; and spaces
            if (!text) {
                el.style.display = "none";
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Target only Blogger post content (common variants covered)
    const postBodies = document.querySelectorAll(
        '.post-body, .entry-content, [itemprop="articleBody"], .post-content'
    );

    postBodies.forEach((post) => {
        const originalHtml = post.innerHTML;
        const parsed = parseShortcodes(originalHtml);

        // Wrap parsed content in a container (scoped styling & cleanup)
        const wrapper = document.createElement("div");
        wrapper.className = "messages-main-container";
        wrapper.innerHTML = parsed;

        post.innerHTML = "";
        post.appendChild(wrapper);

        // Clean empties inside just this post's messages
        cleanEmptyElements(wrapper);

        // Wire up dismiss buttons in this post only
        wrapper.querySelectorAll(".dismiss-btn").forEach((btn) => {
            btn.addEventListener(
                "click",
                () => (btn.closest(".message").style.display = "none")
            );
        });

        // Wire up message action buttons in this post only
        wrapper.querySelectorAll(".message-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                if (!this.querySelector("a")) {
                    alert(`You clicked: ${this.textContent.trim()}`);
                }
            });
        });
    });
});

//-------------------------------Product Tabs-------------------------------//

document.addEventListener("DOMContentLoaded", () => {
    const tabsNav = document.querySelector(".tabs-nav");
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const tabToggleBg = document.querySelector(".tab-toggle-bg");

    function moveToggle(target) {
        tabToggleBg.style.width = `${target.offsetWidth}px`;
        tabToggleBg.style.transform = `translateX(${target.offsetLeft}px)`;
    }

    // Initialize toggle position
    const initialActiveTab = document.querySelector(".tab-btn.active");
    if (initialActiveTab) {
        moveToggle(initialActiveTab);
    }

    let isDragging = false;
    tabsNav.addEventListener("click", (e) => {
        if (isDragging) return;
        const clickedTab = e.target.closest(".tab-btn");
        if (!clickedTab) return;

        tabBtns.forEach((btn) => btn.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));

        clickedTab.classList.add("active");
        document.getElementById(clickedTab.dataset.tab).classList.add("active");

        moveToggle(clickedTab);
    });

    // Draggable scrolling functionality
    let isDown = false;
    let startX;
    let scrollLeft;

    tabsNav.addEventListener("mousedown", (e) => {
        isDown = true;
        isDragging = false;
        tabsNav.classList.add("grabbing");
        startX = e.pageX - tabsNav.offsetLeft;
        scrollLeft = tabsNav.scrollLeft;
    });

    tabsNav.addEventListener("mouseleave", () => {
        isDown = false;
        tabsNav.classList.remove("grabbing");
    });

    tabsNav.addEventListener("mouseup", () => {
        isDown = false;
        tabsNav.classList.remove("grabbing");
        setTimeout(() => (isDragging = false), 50);
    });

    tabsNav.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        isDragging = true;
        const x = e.pageX - tabsNav.offsetLeft;
        const walk = (x - startX) * 2.5; // Scroll speed multiplier
        tabsNav.scrollLeft = scrollLeft - walk;
    });

    // Adjust toggle on window resize
    window.addEventListener("resize", () => {
        const activeTab = document.querySelector(".tab-btn.active");
        if (activeTab) {
            tabToggleBg.style.transition = "none";
            moveToggle(activeTab);
            setTimeout(() => {
                tabToggleBg.style.transition =
                    "transform 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55), width 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)";
            }, 50);
        }
    });
});

//-----------------------------Social Media-------------------------------//

// Canonical share endpoints (where supported)
const pageUrl = encodeURIComponent(location.href);
const pageTitle = encodeURIComponent(document.title || "");
const socialLinks = {
    facebook: {
        icon: "bi-facebook",
        url: `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`,
    },
    instagram: { icon: "bi-instagram", url: "https://www.instagram.com/" }, // no public web share
    twitter: {
        icon: "bi-twitter-x",
        url: `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`,
    },
    whatsapp: {
        icon: "bi-whatsapp",
        url: `https://api.whatsapp.com/send?text=${pageTitle}%20${pageUrl}`,
    },
    youtube: { icon: "bi-youtube", url: "https://www.youtube.com/" }, // no public web share
    tiktok: { icon: "bi-tiktok", url: "https://www.tiktok.com/" }, // no public web share
    linkedin: {
        icon: "bi-linkedin",
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`,
    },
    snapchat: { icon: "bi-snapchat", url: "https://www.snapchat.com/" }, // no public web share
    pinterest: {
        icon: "bi-pinterest",
        url: `https://pinterest.com/pin/create/button/?url=${pageUrl}&description=${pageTitle}`,
    },
    reddit: {
        icon: "bi-reddit",
        url: `https://www.reddit.com/submit?url=${pageUrl}&title=${pageTitle}`,
    },
    discord: { icon: "bi-discord", url: "https://discord.com/" }, // share is app-based
    telegram: {
        icon: "bi-telegram",
        url: `https://t.me/share/url?url=${pageUrl}&text=${pageTitle}`,
    },
};

const defaultOrder = [
    "facebook",
    "instagram",
    "twitter",
    "whatsapp",
    "youtube",
    "tiktok",
    "linkedin",
    "snapchat",
    "pinterest",
    "reddit",
    "discord",
    "telegram",
];

function normalizeName(n) {
    const x = n.toLowerCase().trim();
    if (x === "x" || x === "twitter/x") return "twitter";
    return x;
}

// Find the raw placeholder for a specific social share instance
function extractSocialShareConfig(shareElement) {
    const re = /\[socialShare\(\s*([^)]*?)\s*\)\]/i;
    let node = shareElement.previousSibling;
    let platforms = null,
        hideAll = false,
        found = false;

    // Look for a text node immediately before the element
    while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const m = re.exec(node.nodeValue);
            if (m) {
                found = true;
                const args = (m[1] || "").trim().toLowerCase();
                if (args === "none") {
                    hideAll = true;
                } else if (args.length) {
                    platforms = args
                        .split(",")
                        .map((s) => normalizeName(s))
                        .filter(Boolean);
                }
                // Remove ONLY the placeholder substring from this text node
                node.nodeValue = node.nodeValue.replace(m[0], "").trim();
                break; // use the first occurrence
            }
        }
        // If not found in the immediate previous sibling, stop.
        // This prevents accidentally grabbing a config from far away.
        break;
    }
    return { found, platforms, hideAll };
}

(function initSocialShare() {
    // Find all social share containers on the page
    const containers = document.querySelectorAll(".social-share");

    containers.forEach((container) => {
        const iconsContainer = container.querySelector(".social-share-icons");
        if (!iconsContainer) return;

        const {
            found,
            platforms: cfg,
            hideAll,
        } = extractSocialShareConfig(container);

        if (hideAll) {
            container.style.display = "none";
            return;
        }

        let platforms =
            Array.isArray(cfg) && cfg.length
                ? cfg
                : found
                    ? []
                    : defaultOrder.slice(0, 5); // if placeholder existed but empty, show none; if no placeholder, default 5

        // Build icons
        const added = new Set();
        iconsContainer.innerHTML = ""; // Clear any existing icons

        platforms.forEach((name) => {
            const key = normalizeName(name);
            if (!socialLinks[key] || added.has(key)) return;
            added.add(key);

            const wrap = document.createElement("div");
            wrap.className = "social-icon";
            const a = document.createElement("a");
            a.href = socialLinks[key].url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.title = key.charAt(0).toUpperCase() + key.slice(1);
            const i = document.createElement("i");
            i.className = `bi ${socialLinks[key].icon}`;
            a.appendChild(i);
            wrap.appendChild(a);
            iconsContainer.appendChild(wrap);
        });
    });
})();

//------------------Hide All shortcodes from the browser----------------------------//

document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
    .hidden-shortcode {
      display: none !important;
      color: transparent !important;
      font-size: 0 !important;
      visibility: hidden !important;
    }
  `;
    document.head.appendChild(style);
    const shortcodePatterns = [
        /\[variants\d+\([^)]+\)=[^\]]*\]/g,
        /\[data-stock="[^"]*"\]/g,
        /\[data-SKU="[^"]*"\]/g,
        /\[size-guide(?:-default)?=\s*"\{[^"]*\}"\]/g,
        /\[data-short-description="[^"]*"\]/g,
        /\[data-sale="[^"]*"\]/g,
        /\[data-current-price="[^"]*"\]/g,
        /\[data-old-price="[^"]*"\]/g,
        /\[countdown=[^\]]*?\([^\)]*?\)[^\]]*?\]/g,
        /\[data-brand="[^"]*"\]/g,
        /\[data-badge="[^"]*"\]/g,
    ];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                return shortcodePatterns.some((regex) => regex.test(node.nodeValue))
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP;
            },
        }
    );
    const toProcess = [];
    while (walker.nextNode()) {
        toProcess.push(walker.currentNode);
    }
    toProcess.forEach((textNode) => {
        const parent = textNode.parentNode;
        let cleaned = textNode.nodeValue;
        shortcodePatterns.forEach((regex) => {
            cleaned = cleaned.replace(regex, "");
        });
        if (cleaned.trim()) {
            const span = document.createElement("span");
            span.textContent = cleaned;
            parent.replaceChild(span, textNode);
        } else {
            const hiddenSpan = document.createElement("span");
            hiddenSpan.className = "hidden-shortcode";
            hiddenSpan.textContent = "\u200B";
            parent.replaceChild(hiddenSpan, textNode);
        }
    });
});

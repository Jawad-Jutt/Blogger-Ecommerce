//-----------------------Header JavaScript-------------------------------//

document.addEventListener("DOMContentLoaded", function () {
    const fontAwesome = document.createElement("link");
    fontAwesome.rel = "stylesheet";
    fontAwesome.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(fontAwesome);

    const alertMessage = document.getElementById("AlertMessage");
    if (alertMessage) {
        const closeBtn = document.createElement("button");
        closeBtn.className = "close-btn";
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", function () {
            alertMessage.style.display = "none";
        });
        alertMessage.appendChild(closeBtn);
    }

    // Create separate overlay for LinkList1 with unique class
    const linkListOverlay = document.createElement("div");
    linkListOverlay.className = "linklist-overlay"; // Changed to unique class
    document.body.appendChild(linkListOverlay);

    const linkList1 = document.getElementById("LinkList1");
    const mainMenu = document.getElementById("MainMenu");

    if (linkList1 && mainMenu) {
        const toggleBtn = document.createElement("button");
        toggleBtn.className = "menu-toggle";
        toggleBtn.innerHTML = '<i class="fa-solid fa-ellipsis-v"></i>';
        const header1 = document.getElementById("Header1");
        mainMenu.insertBefore(toggleBtn, header1);

        toggleBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            linkList1.classList.add("active");
            linkListOverlay.classList.add("active"); // Use the specific overlay
            document.body.style.overflow = "hidden";
        });
    }

    // Add event listener to the specific LinkList overlay
    linkListOverlay.addEventListener("click", function () {
        const linkList1 = document.getElementById("LinkList1");
        if (linkList1) {
            linkList1.classList.remove("active");
        }
        linkListOverlay.classList.remove("active");
        document.body.style.overflow = "";
    });
});

document.addEventListener("DOMContentLoaded", function () {
    function createHierarchicalDropdown() {
        const linkList = document.getElementById("LinkList1");
        if (!linkList) return;
        const ul = linkList.querySelector("ul");
        if (!ul) return;
        const items = Array.from(ul.querySelectorAll("li"));
        const newUl = document.createElement("ul");
        let parentStack = [];
        let lastLevel = 0;
        const currentOpenDropdowns = {};

        items.forEach((item) => {
            const link = item.querySelector("a");
            const text = link.textContent.trim();
            const level = (text.match(/^\/+/g) || [""])[0].length;
            const cleanText = text.replace(/^\/+/g, "");
            link.textContent = cleanText;
            const newLi = document.createElement("li");
            newLi.innerHTML = item.innerHTML;

            if (level === 0) {
                parentStack = [{ element: newLi, container: null, level: 0 }];
                newUl.appendChild(newLi);
                lastLevel = 0;
            } else {
                while (
                    parentStack.length > 0 &&
                    parentStack[parentStack.length - 1].level >= level
                ) {
                    parentStack.pop();
                }
                if (parentStack.length === 0) {
                    parentStack = [{ element: newLi, container: null, level: 0 }];
                    newUl.appendChild(newLi);
                    lastLevel = 0;
                    return;
                }
                const parent = parentStack[parentStack.length - 1];
                if (!parent.container) {
                    const container = document.createElement("div");
                    container.className = "dropdown-container";
                    container.dataset.level = level;
                    const parentLink = parent.element.querySelector("a");
                    const icon = document.createElement("i");
                    icon.className = "fa-solid fa-plus dropdown-icon";
                    parentLink.appendChild(icon);
                    const dropdownUl = document.createElement("ul");
                    dropdownUl.className = "dropdown-menu";
                    container.appendChild(dropdownUl);
                    parent.element.appendChild(container);
                    parent.container = container;
                }
                parent.container.querySelector("ul").appendChild(newLi);
                parentStack.push({
                    element: newLi,
                    container: null,
                    level: level,
                });
                lastLevel = level;
            }
        });

        ul.replaceWith(newUl);

        document
            .querySelectorAll(".dropdown-container")
            .forEach((container) => {
                const parentLink = container.parentElement.querySelector("a");
                if (parentLink) {
                    parentLink.addEventListener("click", function (e) {
                        if (this.querySelector(".dropdown-icon")) {
                            e.preventDefault();
                            const icon = this.querySelector(".dropdown-icon");
                            const dropdown = container.querySelector("ul");
                            const level = container.dataset.level;

                            if (container.classList.contains("open")) {
                                dropdown.style.maxHeight = dropdown.scrollHeight + "px";
                                setTimeout(() => {
                                    dropdown.style.maxHeight = "0";
                                }, 10);
                                setTimeout(() => {
                                    container.classList.remove("open");
                                    icon.classList.replace("fa-minus", "fa-plus");
                                    dropdown.style.maxHeight = "";
                                    delete currentOpenDropdowns[level];
                                }, 300);
                            } else {
                                if (
                                    currentOpenDropdowns[level] &&
                                    currentOpenDropdowns[level] !== container
                                ) {
                                    const prevContainer = currentOpenDropdowns[level];
                                    const prevIcon =
                                        prevContainer.parentElement.querySelector(
                                            ".dropdown-icon"
                                        );
                                    const prevDropdown = prevContainer.querySelector("ul");
                                    prevDropdown.style.maxHeight =
                                        prevDropdown.scrollHeight + "px";
                                    setTimeout(() => {
                                        prevDropdown.style.maxHeight = "0";
                                    }, 10);
                                    setTimeout(() => {
                                        prevContainer.classList.remove("open");
                                        prevIcon.classList.replace("fa-minus", "fa-plus");
                                        prevDropdown.style.maxHeight = "";
                                    }, 300);
                                }
                                container.classList.add("open");
                                icon.classList.replace("fa-plus", "fa-minus");
                                dropdown.style.maxHeight = "0";
                                setTimeout(() => {
                                    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
                                }, 10);
                                setTimeout(() => {
                                    dropdown.style.maxHeight = "";
                                    currentOpenDropdowns[level] = container;
                                }, 300);
                            }
                        }
                    });
                }
            });

        function resetAllDropdowns() {
            document
                .querySelectorAll(".dropdown-container.open")
                .forEach((container) => {
                    const icon =
                        container.parentElement.querySelector(".dropdown-icon");
                    const dropdown = container.querySelector("ul");
                    dropdown.style.maxHeight = dropdown.scrollHeight + "px";
                    setTimeout(() => {
                        dropdown.style.maxHeight = "0";
                    }, 10);
                    setTimeout(() => {
                        container.classList.remove("open");
                        icon.classList.replace("fa-minus", "fa-plus");
                        dropdown.style.maxHeight = "";
                    }, 300);
                });
            Object.keys(currentOpenDropdowns).forEach((level) => {
                delete currentOpenDropdowns[level];
            });
        }

        const menuElement = document.getElementById("LinkList1");
        if (menuElement) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (
                        mutation.attributeName === "style" ||
                        mutation.attributeName === "class"
                    ) {
                        const isHidden =
                            menuElement.offsetParent === null ||
                            window.getComputedStyle(menuElement).display === "none";
                        if (isHidden) {
                            resetAllDropdowns();
                        }
                    }
                });
            });
            observer.observe(menuElement, { attributes: !0 });
        }
    }

    const fontAwesome = document.createElement("link");
    fontAwesome.rel = "stylesheet";
    fontAwesome.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(fontAwesome);
    createHierarchicalDropdown();
});

document.addEventListener("DOMContentLoaded", function () {
    const linkList = document.getElementById("LinkList1");
    if (!linkList) return;
    const topLevelItems = linkList.querySelectorAll("ul > li");
    let visibleIndex = 0;

    topLevelItems.forEach((item) => {
        const link = item.querySelector("a");
        if (link) {
            const text = link.textContent.trim();
            if (!/^_+/.test(text)) {
                const delay = 0.2 + visibleIndex * 0.1;
                item.style.transitionDelay = `${delay}s`;
                visibleIndex++;
            }
        }
    });
});

const list = document.getElementById("draggable-list");
let isDown = !1;
let startX;
let scrollLeft;

list.addEventListener("mousedown", (e) => {
    isDown = !0;
    list.classList.add("dragging");
    startX = e.pageX - list.offsetLeft;
    scrollLeft = list.scrollLeft;
});

list.addEventListener("mouseleave", () => {
    isDown = !1;
    list.classList.remove("dragging");
});

list.addEventListener("mouseup", () => {
    isDown = !1;
    list.classList.remove("dragging");
});

list.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - list.offsetLeft;
    const walk = (x - startX) * 2;
    list.scrollLeft = scrollLeft - walk;
});

document.querySelectorAll("#draggable-list li").forEach((item) => {
    item.addEventListener("dragstart", (e) => {
        e.preventDefault();
    });
});

const observer = new MutationObserver((mutations, obs) => {
    const searchInput = document.querySelector(".gsc-input input");
    if (searchInput) {
        searchInput.placeholder = "Search here......";
        obs.disconnect();
    }
});

observer.observe(document.body, { childList: !0, subtree: !0 });

// Close Button for LinkList1 with separate overlay
function addSidebarCloseIcon() {
    const linkList1 = document.getElementById('LinkList1');

    if (linkList1) {
        // Create close button using existing .close-panel style
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-panel';
        closeBtn.title = 'Close';
        closeBtn.innerHTML = '<i class="bi bi-x"></i>';

        // Add click event to close the sidebar
        closeBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            linkList1.classList.remove('active');

            // Hide the specific LinkList overlay
            const linkListOverlay = document.querySelector('.linklist-overlay');
            if (linkListOverlay) {
                linkListOverlay.classList.remove('active');
            }

            document.body.style.overflow = '';
        });

        // Add close button to the sidebar
        const widgetContent = linkList1.querySelector('.widget-content');
        if (widgetContent) {
            // Create a header for the close button
            const panelHeader = document.createElement('div');
            panelHeader.className = 'panel-header';
            panelHeader.style.marginBottom = '20px';
            panelHeader.style.paddingBottom = '20px';
            panelHeader.style.borderBottom = '1px solid var(--border-color)';

            // Add title
            const title = document.createElement('h3');
            title.textContent = 'Menu';
            panelHeader.appendChild(title);

            // Add close button
            panelHeader.appendChild(closeBtn);

            // Insert the header at the top
            widgetContent.insertBefore(panelHeader, widgetContent.firstChild);
        }
    }
}

// Call the function when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    addSidebarCloseIcon();
});
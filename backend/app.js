// =====================================
// CONFIGURATION LAYER
// =====================================

const API_BASE = "";

// Feature toggles (expanded system)
const CONFIG = {
    retryCount: 2,
    debounceDelay: 300,
    enableCache: true,
    debugMode: true,
    enableCopyFeature: true,
    enableImageCopy: true,
    enableTextCopy: true,
    enableKeyboardShortcuts: true,
    enableDrawer: true,
    enableTabs: true,
    enableLiveSearch: true
};

// =====================================
// DEBUG LOGGER SYSTEM (EXPANDED)
// =====================================

function log(...args) {
    if (CONFIG.debugMode) {
        console.log("[DEBUG]", new Date().toISOString(), ...args);
    }
}

function warn(...args) {
    console.warn("[WARN]", new Date().toISOString(), ...args);
}

function errorLog(...args) {
    console.error("[ERROR]", new Date().toISOString(), ...args);
}

// =====================================
// DOM CACHE SYSTEM (SAFE ACCESS LAYER)
// =====================================

const DOM = {

    companyTab: document.getElementById("companyTab"),
    pincodeTab: document.getElementById("pincodeTab"),

    searchInput: document.getElementById("searchInput"),
    searchBtn: document.getElementById("searchBtn"),

    results: document.getElementById("results"),
    resultCount: document.getElementById("resultCount"),

    emptyState: document.getElementById("emptyState"),
    noResults: document.getElementById("noResults"),

    searchStatus: document.getElementById("searchStatus"),

    drawer: document.getElementById("detailDrawer"),
    drawerTitle: document.getElementById("drawerTitle"),
    drawerSubtitle: document.getElementById("drawerSubtitle"),
    drawerContent: document.getElementById("drawerContent"),

    drawerOverlay: document.getElementById("drawerOverlay"),
    closeDrawer: document.getElementById("closeDrawer")
};

// Safe DOM checker
function isValid(el) {
    return el !== null && el !== undefined;
}

// =====================================
// APPLICATION STATE (EXTENDED)
// =====================================

const STATE = {
    mode: "company",
    currentData: [],
    cache: new Map(),
    loading: false,
    lastQuery: "",
    hasSearched: false,
    lastRenderTime: 0,
    lastClickIndex: null,
    renderCount: 0
};

// =====================================
// UI CONTROLLER (EXPANDED)
// =====================================

const UI = {

    setLoading(value) {
        STATE.loading = value;
        if (isValid(DOM.searchStatus)) {
            DOM.searchStatus.textContent = value ? "Loading..." : "";
        }
    },

    showEmpty() {
        if (isValid(DOM.emptyState)) DOM.emptyState.style.display = "block";
        if (isValid(DOM.noResults)) DOM.noResults.style.display = "none";
    },

    showNoResults() {
        if (isValid(DOM.emptyState)) DOM.emptyState.style.display = "none";
        if (isValid(DOM.noResults)) DOM.noResults.style.display = "block";
    },

    showResults() {
        if (isValid(DOM.emptyState)) DOM.emptyState.style.display = "none";
        if (isValid(DOM.noResults)) DOM.noResults.style.display = "none";
    }
};

// =====================================
// BADGE SYSTEM (UNCHANGED)
// =====================================

function badgeClass(value = "") {

    value = value.toUpperCase();

    if (value.includes("ELITE")) return "badge badge-a";
    if (value.includes("ACE")) return "badge badge-b";
    if (value.includes("PRIME")) return "badge badge-c";

    return "badge badge-d";
}

// =====================================
// COPY SYSTEM (NEW FEATURE CORE)
// =====================================

// TEXT COPY ENGINE
function copyText(data) {

    let text = "";

    if (STATE.mode === "company") {

        text += `Company: ${data.company_name}\n`;
        text += `Banks: ${data.listings.length}\n\n`;

        data.listings.forEach(l => {
            text += `${l.bank} → ${l.listing}\n`;
        });

    } else {

        text += `Pincode: ${data.pincode}\n`;
        text += `Location: ${data.location}\n`;
        text += `State: ${data.state}\n`;
        text += `Banks: ${data.banks.join(", ")}\n`;
    }

    navigator.clipboard.writeText(text);
    DOM.searchStatus.textContent = "Copied Text";
}

// IMAGE COPY ENGINE
async function copyImage(card) {

    try {

        const index = Number(card.dataset.index);
        const data = STATE.currentData[index];

        // Create fixed export container
        const exportCard = document.createElement("div");
        exportCard.style.width = "380px";               // 👈 KEY FIX (prevents wide zoom)
        exportCard.style.padding = "16px";
        exportCard.style.background = "#0b0f1a";
        exportCard.style.color = "#fff";
        exportCard.style.fontFamily = "Arial, sans-serif";
        exportCard.style.borderRadius = "12px";

        let contentHTML = "";

        if (STATE.mode === "company") {

            contentHTML += `
                <div style="font-size:18px;font-weight:700;margin-bottom:8px;">
                    ${data.company_name}
                </div>

                <div style="opacity:0.7;margin-bottom:12px;">
                    ${data.listings.length} Bank Listings
                </div>
            `;

            data.listings.forEach(item => {
                contentHTML += `
                    <div style="display:flex;justify-content:space-between;
                                padding:6px 0;border-bottom:1px solid #222;">
                        <span>${item.bank}</span>
                        <span>${item.listing}</span>
                    </div>
                `;
            });

        } else {

            contentHTML += `
                <div style="font-size:18px;font-weight:700;margin-bottom:8px;">
                    ${data.pincode}
                </div>

                <div style="opacity:0.7;margin-bottom:12px;">
                    ${data.location}
                </div>
            `;

            data.banks.forEach(b => {
                contentHTML += `
                    <div style="padding:6px 0;border-bottom:1px solid #222;">
                        ${b}
                    </div>
                `;
            });
        }

        exportCard.innerHTML = contentHTML;

        // IMPORTANT: add off-screen (prevents UI shift)
        exportCard.style.position = "absolute";
        exportCard.style.left = "-9999px";
        exportCard.style.top = "0";

        document.body.appendChild(exportCard);

        const canvas = await html2canvas(exportCard, {
            scale: 2,
            backgroundColor: "#0b0f1a",
            windowWidth: 380   // 👈 locks aspect ratio (prevents zoom stretch)
        });

        document.body.removeChild(exportCard);

        canvas.toBlob(blob => {

            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]);

            DOM.searchStatus.textContent = "Clean Vertical Card Copied";
        });

    } catch (err) {
        errorLog("Image copy failed", err);
    }
}


const masterBtn = document.createElement("button");
masterBtn.className = "copy-pill";
masterBtn.textContent = "Master Export";
masterBtn.onclick = exportAllCardsImage;

const masterTextBtn = document.createElement("button");
masterTextBtn.className = "copy-pill";
masterTextBtn.textContent = "Master Text";
masterTextBtn.onclick = exportAllCardsText;

const masterActions = document.createElement("div");
masterActions.id = "masterActions";

masterActions.appendChild(masterBtn);
masterActions.appendChild(masterTextBtn);

document
    .querySelector(".search-row")
    .after(masterActions);


async function exportAllCardsImage() {
    try {
        const data = STATE.currentData;
        if (!data.length) return;

        // CREATE EXPORT WRAPPER (OFFSCREEN)
        const wrapper = document.createElement("div");

        // KEY FIX: CONTROL WIDTH + MULTI COLUMN COMPRESSION
        wrapper.style.width = "520px";
        wrapper.style.gap = "12px";
        wrapper.style.height = "auto";
        wrapper.style.overflow = "visible";
        wrapper.style.padding = "20px";
        wrapper.style.background = "#0b0f1a";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.gap = "12px";
        wrapper.style.position = "absolute";
        wrapper.style.left = "-99999px";
        wrapper.style.top = "0";

        // BUILD COMPACT CARDS
        wrapper.innerHTML = data.map(item => {
            const banks =
                STATE.mode === "company"
                    ? item.listings.map(l =>
                        `<div style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            flex-wrap:wrap;
                            font-size:12px;
                            padding:4px 0;
                        ">
                            <span style="color:#cbd5e1;">
                                ${l.bank}
                            </span>

                            <span style="
                                border:1px solid rgba(255,255,255,.18);
                                border-radius:999px;
                                padding:2px 8px;
                                font-size:11px;
                                color:#fff;
                                background:rgba(255,255,255,.04);
                            ">
                                ${l.listing}
                            </span>
                        </div>`
                    ).join("")
                    : item.banks.map(b =>
                        `<div style="font-size:12px;color:#cbd5e1;padding:2px 0">${b}</div>`
                    ).join("");

            return `
                <div style="
                    background:rgba(255,255,255,0.03);
                    border:1px solid rgba(255,255,255,0.06);
                    border-radius:12px;
                    padding:14px;
                    overflow:hidden;
                ">
                    <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:4px;">
                        ${STATE.mode === "company" ? item.company_name : item.pincode}
                    </div>

                    <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">
                        ${STATE.mode === "company"
                    ? item.listings.length + " banks"
                    : item.location}
                    </div>

                    ${banks}
                </div>
            `;
        }).join("");

        document.body.appendChild(wrapper);

        const canvas = await html2canvas(wrapper, {
            scale: 2,
            backgroundColor: "#0b0f1a",

            width: wrapper.scrollWidth,
            height: wrapper.scrollHeight,

            windowWidth: wrapper.scrollWidth,
            windowHeight: wrapper.scrollHeight
        });

        document.body.removeChild(wrapper);

        canvas.toBlob(blob => {
            navigator.clipboard.write([
                new ClipboardItem({ "image/png": blob })
            ]);

            DOM.searchStatus.textContent = "Master Export Copied";
        });

    } catch (err) {
        errorLog(err);
    }
}

function exportAllCardsText() {
    const data = STATE.currentData;
    if (!data.length) return;

    let text = "";

    data.forEach(item => {
        text += STATE.mode === "company"
            ? `\n${item.company_name} (${item.listings.length})\n` +
            item.listings
                .map(l => `- ${l.bank}: ${l.listing}`)
                .join("\n")
            : `\n${item.pincode} - ${item.location}\n` +
            item.banks.map(b => `- ${b}`).join("\n");

        text += "\n----------------------\n";
    });

    navigator.clipboard.writeText(text);
    DOM.searchStatus.textContent = "Master Text Copied";
}

// =====================================
// CARD BUILDERS (EXTENDED WITH COPY UI)
// =====================================

function createCompanyCard(company) {

    const preview = company.listings
        .slice(0, 3)
        .map(item => `
            <div class="card-row">
                <span>${item.bank}</span>
                <span class="${badgeClass(item.listing)}">
                    ${item.listing}
                </span>
            </div>
        `).join("");

    return `
        <div class="glass-card company-card" data-index="${company.index}">

            <div class="copy-bar">
                <button class="copy-text-btn">Copy Text</button>
                <button class="copy-img-btn">Copy Img</button>
            </div>

            <div class="card-title">${company.company_name}</div>
            <div class="card-subtitle">${company.listings.length} Bank Listings</div>

            ${preview}

            <div class="more">
                ${company.listings.length > 3
            ? "+" + (company.listings.length - 3) + " More"
            : ""
        }
            </div>
        </div>
    `;
}

function createPincodeCard(item) {

    return `
        <div class="glass-card pincode-card" data-index="${item.index}">

            <div class="copy-bar">
                <button class="copy-text-btn">Copy Text</button>
                <button class="copy-img-btn">Copy Img</button>
            </div>

            <div class="card-title">${item.pincode}</div>
            <div class="card-subtitle">${item.location}</div>

            <div class="card-row">
                <span>${item.state}</span>
                <span>${item.banks.length} Banks</span>
            </div>
        </div>
    `;
}

// =====================================
// CACHE SYSTEM (UNCHANGED)
// =====================================

function getCacheKey(query, mode) {
    return `${mode}:${query}`;
}

function setCache(key, data) {
    if (CONFIG.enableCache) STATE.cache.set(key, data);
}

function getCache(key) {
    return CONFIG.enableCache ? STATE.cache.get(key) : null;
}

// =====================================
// FETCH WITH RETRY (UNCHANGED)
// =====================================

async function fetchWithRetry(url, retries = CONFIG.retryCount) {

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network error");
        return await res.json();
    } catch (err) {
        if (retries > 0) return fetchWithRetry(url, retries - 1);
        throw err;
    }
}

// =====================================
// SEARCH ENGINE (UNCHANGED CORE)
// =====================================

async function searchData(query = "") {

    query = query.trim();
    STATE.hasSearched = true;
    STATE.lastQuery = query;

    UI.setLoading(true);

    DOM.results.innerHTML = `<div class="loading">Searching...</div>`;

    if (!query) {
        STATE.currentData = [];
        renderResults();
        UI.setLoading(false);
        return;
    }

    const cacheKey = getCacheKey(query, STATE.mode);
    const cached = getCache(cacheKey);

    if (cached) {
        STATE.currentData = cached;
        renderResults();
        UI.setLoading(false);
        return;
    }

    try {

        let endpoint = "";

        if (STATE.mode === "company") {
            endpoint = `${API_BASE}/companies/search?q=${encodeURIComponent(query)}`;
        } else {
            endpoint = `${API_BASE}/pincodes/search?q=${encodeURIComponent(query)}`;
        }

        const data = await fetchWithRetry(endpoint);

        STATE.currentData = data.map((item, index) => ({
            ...item,
            index
        }));

        setCache(cacheKey, STATE.currentData);

        renderResults();

    } catch (err) {

        errorLog(err);
        STATE.currentData = [];
        renderResults();

    } finally {
        UI.setLoading(false);
    }
}

// =====================================
// RENDER SYSTEM (UNCHANGED CORE)
// =====================================

function renderResults() {

    DOM.results.innerHTML = "";

    if (!STATE.hasSearched) {
        DOM.resultCount.textContent = "Ready to Search";
    }
    else {
        DOM.resultCount.textContent =
            `${STATE.currentData.length} Results`;
    }

    if (STATE.currentData.length === 0) {

        if (STATE.hasSearched) {
            UI.showNoResults();
        } else {
            UI.showEmpty();
        }

        return;
    }

    UI.showResults();

    DOM.results.innerHTML =
        STATE.mode === "company"
            ? STATE.currentData.map(createCompanyCard).join("")
            : STATE.currentData.map(createPincodeCard).join("");

    attachEvents();

    STATE.renderCount++;
    STATE.lastRenderTime = Date.now();

    DOM.searchInput.focus();
}

// =====================================
// EVENT ATTACHMENT (EXPANDED + COPY SAFE)
// =====================================

function attachEvents() {

    document.querySelectorAll(".glass-card").forEach(card => {

        const index = Number(card.dataset.index);
        const data = STATE.currentData[index];

        const textBtn = card.querySelector(".copy-text-btn");
        const imgBtn = card.querySelector(".copy-img-btn");

        if (textBtn) {
            textBtn.onclick = (e) => {
                e.stopPropagation();
                copyText(data);
            };
        }

        if (imgBtn) {
            imgBtn.onclick = async (e) => {
                e.stopPropagation();
                await copyImage(card);
            };
        }

        card.onclick = () => {

            if (STATE.mode === "company") {
                openCompany(data);
            } else {
                openPincode(data);
            }
        };
    });
}

// =====================================
// DRAWER SYSTEM (UNCHANGED)
// =====================================

function openCompany(company) {

    DOM.drawerTitle.textContent = company.company_name;
    DOM.drawerSubtitle.textContent = `${company.listings.length} Banks`;

    DOM.drawerContent.innerHTML = company.listings.map(item => `
        <div class="card-row">
            <span>${item.bank}</span>
            <span class="${badgeClass(item.listing)}">${item.listing}</span>
        </div>
    `).join("");

    DOM.drawer.classList.add("open");
    DOM.drawerOverlay.classList.add("open");
}

function openPincode(item) {

    DOM.drawerTitle.textContent = item.pincode;
    DOM.drawerSubtitle.textContent = item.location;

    DOM.drawerContent.innerHTML = `
        <div>${item.state}</div>
        ${item.banks.map(b => `<div class="card-row">${b}</div>`).join("")}
    `;

    DOM.drawer.classList.add("open");
    DOM.drawerOverlay.classList.add("open");
}

function closeDrawerFn() {
    DOM.drawer.classList.remove("open");
    DOM.drawerOverlay.classList.remove("open");
}

// =====================================
// INPUT SYSTEM (UNCHANGED)
// =====================================

let debounceTimer = null;

DOM.searchBtn.addEventListener("click", () => {
    searchData(DOM.searchInput.value);
});

DOM.searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        searchData(DOM.searchInput.value);
    }
});

DOM.searchInput.addEventListener("input", (e) => {

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
        searchData(e.target.value);
    }, CONFIG.debounceDelay);
});

// =====================================
// TAB SYSTEM (UNCHANGED)
// =====================================

DOM.companyTab.addEventListener("click", () => {

    closeDrawerFn();

    STATE.mode = "company";

    DOM.companyTab.classList.add("active");
    DOM.pincodeTab.classList.remove("active");

    DOM.searchInput.placeholder = "Search company name...";
    DOM.searchInput.value = "";

    STATE.currentData = [];

    renderResults();

    setTimeout(() => {
        DOM.searchInput.focus();
    }, 50);

});

DOM.pincodeTab.addEventListener("click", () => {

    closeDrawerFn();

    STATE.mode = "pincode";

    DOM.pincodeTab.classList.add("active");
    DOM.companyTab.classList.remove("active");

    DOM.searchInput.placeholder = "Search pincode...";
    DOM.searchInput.value = "";

    STATE.currentData = [];

    renderResults();

    setTimeout(() => {
        DOM.searchInput.focus();
    }, 50);

});

// =====================================
// DRAWER EVENTS
// =====================================

DOM.closeDrawer.addEventListener("click", closeDrawerFn);
DOM.drawerOverlay.addEventListener("click", closeDrawerFn);

// =====================================
// KEYBOARD SHORTCUTS (UNCHANGED)
// =====================================

document.addEventListener("click", (e) => {

    const clickedInsideDrawer =
        DOM.drawer.contains(e.target);

    const clickedCard =
        e.target.closest(".glass-card");

    if (
        DOM.drawer.classList.contains("open") &&
        !clickedInsideDrawer &&
        !clickedCard
    ) {
        closeDrawerFn();
    }
});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
        closeDrawerFn();
    }

    if (e.ctrlKey && e.key === "k") {
        e.preventDefault();
        DOM.searchInput.focus();
    }
});

// =====================================
// INIT
// =====================================

(function init() {

    log("App initialized");

    UI.showEmpty();
    DOM.searchInput.focus();

})();

// =====================================
// PWA INSTALL
// =====================================

let deferredPrompt;

const installBtn =
    document.getElementById("installBtn");

window.addEventListener(
    "beforeinstallprompt",
    (e) => {

        e.preventDefault();

        deferredPrompt = e;

        if (installBtn) {
            installBtn.style.display = "block";
        }
    }
);

installBtn?.addEventListener(
    "click",
    async () => {

        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        await deferredPrompt.userChoice;

        deferredPrompt = null;

        installBtn.style.display = "none";
    }
);

window.addEventListener(
    "appinstalled",
    () => {

        DOM.searchStatus.textContent =
            "CogitoLex Installed";
    }
);

/* -------------------------------------------------------------------------- */
/*                                   Colors                                   */
/* -------------------------------------------------------------------------- */
class Colors {
    constructor(color) {
        this._base = w3color(color);

        // Calculate other colors
        this.foreground_darken = (this.luma(this._base) >= 165);
        this.background_darken = (this.luma(this._base) >= 120);

        this.foreground = `#${(this.foreground_darken) ? '000' : 'fff'}`;
        this.background = color;

        this.hover = this.RGB_Log_Shade( 0.2 * (this.background_darken ? -1 : 1) - (this.background_darken ? 0 : 0.1), this._base);
        this.active = this.RGB_Log_Shade( 0.3 * (this.background_darken ? -1 : 1) - (this.background_darken ? 0 : 0.1), this._base);

        this.toolbar_field = this.hover;
        this.toolbar_field_text = `#${(this.luma(w3color(this.toolbar_field)) >= 165) ? '000' : 'fff'}`;
    }

    /**
     * Luma is a weighted sum of the R, G, and B values, adjusted for human perception of relative brightness
     * https://stackoverflow.com/a/6511606/13853046
     * @param {w3color} color - A w3color object
     * @returns {boolean} Weighted sum of the R, G, and B values
     */
    luma(color) {
        return (0.2126 * color.red) + (0.7152 * color.green) + (0.0722 * color.blue); // SMPTE C, Rec. 709 weightings
    }

    /**
     * https://stackoverflow.com/a/13542669/13853046
     * @param {number} p - 
     * @param {w3color} color - A w3color object
     * @returns {string} RGB string
     */
    RGB_Log_Shade(p, color) {
        var i=parseInt,r=Math.round,[a,b,c]=[color.red,color.green,color.blue],P=p<0,t=P?0:p*255**2,P=P?1+p:1-p;
        return"rgb("+r((P*i(a)**2+t)**0.5)+","+r((P*i(b)**2+t)**0.5)+","+r((P*i(c)**2+t)**0.5)+")";
    }
}

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */
let defaultTheme = {}, oldTheme = {}, currentTabId, currentWindowId, tabColors = {}, disabledSites = [], fullAdapt = false;

// --- Functions --- //
function browserUpdateTheme(windowId, theme) {
    theme.themeColorExtension = true;

    try {
        browser.theme.update(windowId, theme);
    } catch (error) {
        defaultTheme = oldTheme;
        browser.theme.update(windowId, defaultTheme);
        browser.storage.local.set({ defaultTheme });
    }
}

function setDefaultTheme(theme) {
    oldTheme = structuredClone(defaultTheme);
    defaultTheme = theme;
    browser.storage.local.set({ defaultTheme });
}

function updateTheme(themeColor) {
    let colors = new Colors(themeColor);
    let currentTheme;

    // TODO: Maybe add frame_inactive color

    if (fullAdapt) {
        currentTheme = {
            images: {},
            properties: {},
            colors: {
                toolbar: colors.background,
                toolbar_text: colors.foreground,
                frame: colors.toolbar_field, // TODO: Lighter or darker background color; maybe something else than toolbar_field
                tab_background_text: colors.toolbar_field_text,
                toolbar_field: colors.toolbar_field,
                toolbar_field_text: colors.toolbar_field_text,
                toolbar_top_separator: colors.background,
                toolbar_bottom_separator: colors.background,
                tab_line: colors.foreground,
                popup: colors.background,
                popup_text: colors.foreground,
                tab_loading: colors.foreground
            }
        }
    }
    else {
        currentTheme = structuredClone(defaultTheme);
        if (!currentTheme.colors) currentTheme.colors = {};
        
        currentTheme.colors.bookmark_text = colors.foreground;
        currentTheme.colors.button_background_active = colors.active;
        currentTheme.colors.button_background_hover = colors.hover;
        // currentTheme.colors.icons = colors.foreground; // Can't use this property because it sets the color for the icons in the tab bar and the toolbar. See note below
        currentTheme.colors.tab_background_separator = null;
        currentTheme.colors.tab_line = colors.background;
        currentTheme.colors.tab_selected = null;
        currentTheme.colors.tab_text = colors.foreground;
        currentTheme.colors.tab_background_text = defaultTheme.colors.tab_background_text; // Keep the same color for the icons in the tab bar, because the default theme has a background with already the right color for the icons, and this background can possibly not match with the background of the toolbar
        currentTheme.colors.textcolor = "null";
        currentTheme.colors.toolbar = colors.background;
        currentTheme.colors.toolbar_text = colors.foreground;
        currentTheme.colors.toolbar_bottom_separator = colors.background;
        currentTheme.colors.toolbar_field = colors.toolbar_field;
        currentTheme.colors.toolbar_field_border = null;
        currentTheme.colors.toolbar_field_separator = null;
        currentTheme.colors.toolbar_field_text = colors.toolbar_field_text;
    }

    browserUpdateTheme(currentWindowId, currentTheme);
}

function getThemeColor() {
    browser.tabs.sendMessage(
        currentTabId,
        { command: "get-theme-color" }
    ).then(response => {
        const cssColor = response.colors.used;
        const color = w3color(cssColor).toHexString();

        if (color === "#ffffff" || color === "#000000") {
            tabColors[currentTabId] = color;
            updateTheme(color);
        }
        else {
            tabColors[currentTabId] = color;
            updateTheme(color);
        }
    }).catch(() => {
        browserUpdateTheme(currentWindowId, defaultTheme);
    });
}

function tabUpdate() {
    // Preload the theme/color last used on this tab
    if (tabColors[currentTabId]) updateTheme(tabColors[currentTabId]);

    // Check if this is enabled or not, then get/set new color or remove applied colors
    browser.tabs.get(currentTabId).then(info => {
        if (disabledSites.includes(new URL(info.url).hostname)) {
            browserUpdateTheme(currentWindowId, defaultTheme);
            tabColors[currentTabId] = null;
        }
        else getThemeColor();
    });
}

// --- Event Listener Functions --- //
function onActivatedEvent(info) {
    currentTabId = info.tabId;
    currentWindowId = info.windowId;
    tabUpdate();
}
function onAttachedEvent(tabId, info) {
    currentTabId = tabId;
    currentWindowId = info.newWindowId;
    tabUpdate();
}
function onUpdatedEvent(tabId, _, info) {
    if (!info.active) return; // Skip if a new tab is opened, but not active
    if (info.status === "loading") return; // Skip if page is still loading, without this the color changes rapidly for a few times; disadvantage: A page could already be visible, but still loading, then the color won't change until it's fully loaded, so it looks like the addon has a delay
    currentTabId = tabId;
    currentWindowId = info.windowId;
    tabUpdate();
}

// Listen if the user sets a new theme and not the extension
function onThemeUpdate(info) {
    if (info.theme.themeColorExtension) return;

    if (Object.keys(info.theme) != 0) {
        setDefaultTheme(info.theme);
        browserUpdateTheme(currentWindowId, defaultTheme);
    }
}

// --- Main --- //
function enableExtension() {
    if (Object.keys(defaultTheme) == 0) 
        browser.theme.getCurrent().then(setDefaultTheme); // Get the current applied theme

    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        currentTabId = tabs[0].id;
        currentWindowId = tabs[0].windowId;
        tabUpdate();
    });

    browser.tabs.onActivated.addListener(onActivatedEvent);
    browser.tabs.onAttached.addListener(onAttachedEvent);
    browser.tabs.onUpdated.addListener(onUpdatedEvent);
    browser.theme.onUpdated.addListener(onThemeUpdate);
}

function disableExtension() {
    browser.tabs.onActivated.removeListener(onActivatedEvent);
    browser.tabs.onAttached.removeListener(onAttachedEvent);
    browser.tabs.onUpdated.removeListener(onUpdatedEvent);
    browser.theme.onUpdated.removeListener(onThemeUpdate);

    // Remove all themes set by the extension
    browser.windows.getAll().then(windowInfoArray => {
        for (const windowInfo of windowInfoArray) {
            browserUpdateTheme(windowInfo.id, defaultTheme);
        }
        setDefaultTheme({});
    })
}

browser.storage.local.get().then(items => {
    defaultTheme = items.defaultTheme || {};
    disabledSites = items.disabledSites || [];
    fullAdapt = items.fullAdapt || false;

    if (items.enabled !== false) enableExtension(); // Check if not false, because if it's the first time loading, items will be empty and the extension should be on
});

browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;

    for (const key of Object.keys(changes)) {
        if (key === "enabled") {
            if (changes[key].newValue === true) enableExtension();
            else disableExtension();
        }
        else if (key === "disabledSites") {
            disabledSites = changes[key].newValue;

            browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
                currentTabId = tabs[0].id;
                currentWindowId = tabs[0].windowId;
                tabUpdate();
            });
        }
        else if (key === "fullAdapt") {
            fullAdapt = changes[key].newValue;
            updateTheme(tabColors[currentTabId]);
        }
    }
});

browser.runtime.onInstalled.addListener(async ({ reason, temporary }) => {
    if (temporary) return;
    switch (reason) {
        case "install":
            const url = browser.runtime.getURL("views/installed.html");
            await browser.tabs.create({ url });
            break;
    }
});
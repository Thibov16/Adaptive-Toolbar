browser.runtime.onMessage.addListener(request => {
    if (request.command === "get-theme-color") {
        const metaTags = document.head.querySelectorAll("meta[name=\"theme-color\"][content]");
        const colors = {};

        for (const tag of metaTags) {
            const color = tag.getAttribute("content");
            const mediaQuery = tag.getAttribute("media");

            if (mediaQuery === "(prefers-color-scheme: light)") colors["light"] = color;
            else if (mediaQuery === "(prefers-color-scheme: dark)") colors["dark"] = color;
            else colors["default"] = color;
        }

        if (colors["dark"] && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            colors["used"] = colors["dark"];
        }
        else if (colors["light"] && window.matchMedia('(prefers-color-scheme: light)').matches) {
            colors["used"] = colors["light"];
        }
        else if (colors["default"]) {
            colors["used"] = colors["default"];
        }

        if (metaTags.length == 0) return Promise.reject();
        else return Promise.resolve({ colors });
    } 
    // else if (request.command === "get-element-color") {
    //     const colors = {};
        
    //     if (document.getElementsByTagName('nav')[0])
    //         colors["nav"] = window.getComputedStyle( document.getElementsByTagName('nav')[0] ).background;

    //     if (document.getElementsByTagName('header')[0])
    //         colors["header"] = window.getComputedStyle( document.getElementsByTagName('header')[0] ).background;

    //     if (document.getElementsByTagName('html')[0])
    //         colors["html"] = window.getComputedStyle( document.getElementsByTagName('html')[0] ).background;

    //     return Promise.resolve({ colors });
    // }
});
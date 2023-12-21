const enableBtn = document.querySelector("#enable-extension");
const disableSiteBtn = document.querySelector("#disable-site");
const fullAdaptBtn = document.querySelector("#full-adapt");
const quickSettingsDiv = document.querySelector(".quick-settings-container");

/* -------------------------------------------------------------------------- */
/*                                Main settings                               */
/* -------------------------------------------------------------------------- */
enableBtn.addEventListener("click", (evt) => {
    browser.storage.local.set({ enabled: evt.target.checked });

    if (!evt.target.checked) quickSettingsDiv.style.display = "none";
    else quickSettingsDiv.style.display = "block";
});

disableSiteBtn.addEventListener("click", (evt) => {
    Promise.all([
        browser.tabs.query({active: true, currentWindow: true}),
        browser.storage.local.get("disabledSites")
    ]).then(results => {
        const hostname = new URL(results[0][0].url).hostname;
        let disabledSites = results[1].disabledSites;

        if (!evt.target.checked && disabledSites && disabledSites.includes(hostname)) {
            let index = disabledSites.indexOf(hostname);
            if (index !== -1) disabledSites.splice(index, 1);
        }
        else if (evt.target.checked) {
            if (disabledSites && !disabledSites.includes(hostname))
                disabledSites.push(hostname);
            else if (!disabledSites) 
                disabledSites = [hostname];
        }
        else return;
        
        browser.storage.local.set({ disabledSites });
    });
});

fullAdaptBtn.addEventListener("click", (evt) => {
    browser.storage.local.set({ fullAdapt: evt.target.checked });
});

/* -------------------------------------------------------------------------- */
/*                                 Popup open                                 */
/* -------------------------------------------------------------------------- */
Promise.all([
    browser.storage.local.get(),
    browser.tabs.query({active: true, currentWindow: true})
]).then(results => {
    if (results[0].enabled === false) {
        enableBtn.checked = false;
        quickSettingsDiv.style.display = "none";
    }

    if (results[0].fullAdapt) {
        fullAdaptBtn.checked = true;
    }

    const hostname = new URL(results[1][0].url).hostname;
    if (results[0].disabledSites && results[0].disabledSites.includes(hostname)) {
        disableSiteBtn.checked = true;
    }
});
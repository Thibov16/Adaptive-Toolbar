# Adaptive Toolbar

Adaptive Toolbar is a Firefox extension designed to enhance your browsing experience by dynamically changing the color of the toolbar based on the theme-color property of the current website. Whether you prefer a seamless integration with the website's color scheme or have a custom theme in mind, Adaptive Toolbar gives you the flexibility to tailor your browser's appearance.

## Getting started

- Install from Firefox Add-ons store.
- Modify the theme, and the extension will seamlessly adapt.
- You can access quick settings by clicking the icon in the toolbar.

## Limitations

There's a restriction in Firefox that prevents this extension from accessing images from other extensions or themes. This means you can't use themes with images. 

**There is one exception**: you can use a custom theme with images made in [Firefox Color](https://color.firefox.com/).

## Features

- Adapts to the website's color scheme.
- Set your preferred theme alongside the toolbar color.

## Permissions

| Permission | Why it's needed |
|------------|-----------------|
| theme      | To set the theme of the browser. |
| tabs       | To get the tab url for Firefox versions lower than 86. The tab url is used to save disabled websites. |
| storage    | To store settings, the used theme and disabled sites. |
| <all_urls> | To get the tab url and use content scripts. Content scripts used to get the theme color of the webpage. [1] |

[1]: I can't use the `activeTab` permission instead of `<all_urls>`, because it requires an user interaction, and that's not the case for this addon. See the [documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/permissions#activetab_permission).

Maybe in the future the `unlimitedStorage` permission is needed if the `disabledSites` list is too large or the images stored in a theme are too large. See the [documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/local).

## Version compatibility

| Method / Event            | Firefox minimum version     |
|---------------------------|-----------------------------|
| StorageArea.set()         | 45                          |
| StorageArea.get()         | 45                          |
| ~~StorageArea.onChanged~~ | ~~101~~                     |
| storage.onChanged         | 45                          |
| theme.update()            | 57                          |
| theme.getCurrent()        | 58                          |
| theme.onUpdated           | 58                          |
| tabs.get()                | 45                          |
| tabs.query()              | 45                          |
| tabs.sendMessage()        | 45                          |
| tabs.onUpdated            | 45                          |
| tabs.onAttached           | 45                          |
| tabs.onActivated          | 45                          |
| windows.getAll()          | 45                          |
| runtime.onMessage         | 45                          |

Using `storage.onChanged` instead of `StorageArea.onChanged`, because it has earlier support and the same functionality

# Carbon.FileLoader Package for Neos CMS

Load JavaScript and CSS assets from Neos/Flow packages via Fusion.

Carbon.FileLoader supports two strategies:

- `tags`: render `<script>` / `<link>` tags directly in markup.
- `attributes`: render `data-*` attributes and load assets with the included `Loader.js`.

## Installation

Install the package via Composer:

```bash
composer require carbon/fileloader
```

Fusion auto-include and the Eel helper context are registered automatically via package settings.

## Default Configuration

```yaml
Carbon:
  FileLoader:
    strategy: tags
    hashLength: 8
    debug: false
    removeLocalhost: true
```

### Option Reference

- `strategy`: `tags` or `attributes`.
- `hashLength`: length of the cache-busting hash (`h=...`) appended to generated file URLs. Set `0`, `false` or `null` to disable.
- `debug`: enables verbose browser console output for the `attributes` strategy.
- `removeLocalhost`: rewrites `http://localhost/...` and `https://localhost/...` to `/...`.

## Basic Fusion Usage

Use the high-level component:

```fusion
assets = Carbon.FileLoader:Component {
    package = 'Vendor.Site'
    css = 'Main.css'
    js = 'App.js'
    mjs = 'Hydration.js'
}
```

### Available Properties (`Carbon.FileLoader:Component`)

- `strategy`: `tags` or `attributes` (defaults to `Carbon.FileLoader.strategy`).
- `inline`: inline content instead of external URLs. Forces `tags` strategy.
- `package`: package key (required unless absolute/resource URL is provided in filenames).
- `js`, `css`, `mjs`: string, comma-separated string, or array.
- `neverIncludeJS`, `neverIncludeCSS`, `neverIncludeMJS`: disable one asset type.
- `jsFolder`, `cssFolder`, `mjsFolder`: relative folder in `Public/`.
- `scriptExecution`: `defer`, `async`, or `null`.
- `eventOnLoad`: custom event name (attributes strategy only).
- `useCache`: loader cache for runtime loading (attributes strategy only).
- `debug`: runtime console debug output (attributes strategy only).
- `slipstream`, `slipstreamPrepend`: optional Sitegeist.Slipstream integration (tags strategy).

## Strategy: `tags`

Renders final HTML tags directly.

```fusion
assets = Carbon.FileLoader:Strategy.Tags {
    package = 'Vendor.Site'
    css = ['Main.css', 'Print.css']
    js = ['Vendor.js', 'App.js']
    mjs = 'Hydration.js'
    scriptExecution = 'defer'
}
```

Use this strategy if you want classic server-rendered asset tags.

## Strategy: `attributes`

Renders `data-*` attributes that are interpreted by `Loader.js` in the browser.

```fusion
assets = Carbon.FileLoader:Strategy.Attributes {
    package = 'Vendor.Site'
    css = 'Main.css'
    js = 'App.js'
    mjs = 'Hydration.js'
    scriptExecution = 'defer'
    eventOnLoad = 'assets:loaded'
    useCache = true
}
```

When using this strategy, include and execute the client-side loader:

```html
<script type="module">
  import { initLoader } from "/_Resources/Static/Packages/Carbon.FileLoader/Modules/Loader.min.js";
  initLoader();
</script>
```

You can call `initLoader({ rootElement })` again after replacing or appending dynamic markup.

## Helper Prototypes

### `Carbon.FileLoader:Helper.File`

Resolve one file:

```fusion
singleFile = Carbon.FileLoader:Helper.File {
    package = 'Vendor.Site'
    folder = 'Scripts/'
    file = 'App.js'
}
```

### `Carbon.FileLoader:Helper.FileItems`

Resolve multiple files:

```fusion
multipleFiles = Carbon.FileLoader:Helper.FileItems {
    package = 'Vendor.Site'
    folder = 'Styles/'
    items = ['Main.css', 'Print.css']
}
```

## Eel Helper API (`Carbon.FileLoader.*`)

Registered in Fusion default context as `Carbon.FileLoader`.

- `filter(value)`: normalize string/array input into a cleaned array.
- `uri(uri, inline = false, package = null, folder = null, hashLength = null)`: resolve one URL or inline content.
- `uris(arrayOrString)`: resolve many URLs and join them with commas.
- `encodeUrl(string)`: Base64 URL-safe encoding (used by attributes strategy).

## Path Resolution Rules

- If `file` contains `//` (for example `https://...` or `resource://...`), it is used as-is.
- Otherwise, the file is resolved via:

```text
resource://<Package>/Public/<Folder><File>
```

- For external files, only URL generation is used.
- For inline mode, file content is loaded directly.

## JavaScript Utilities

The package ships ready-to-use browser modules in `Resources/Public/Modules/`:

- `Loader.js` / `Loader.min.js`
- `EventDispatcher.js` / `EventDispatcher.min.js`
- `EventListener.js` / `EventListener.min.js`

## Development

Install dependencies:

```bash
pnpm install
```

Build assets:

```bash
pnpm build
```

Watch mode:

```bash
pnpm watch
```

Alternative via Makefile:

```bash
make production
```

# vkm-js | Alpine.js Plugins Monorepo

Welcome to **vkm-js**, a high-performance monorepo featuring lightweight, robust, and accessible UI plugins. Built specifically to work with **Alpine.js** and styled gracefully using **Tailwind CSS** or custom CSS, these plugins provide immediate interactive functionality to your applications.

This documentation serves as a guide for integrating `vkm-js` into your codebase, using its core plugins, understanding available directives/modifiers, and managing the development workflow.

---

## 📋 Table of Contents
1. [General Setup](#-general-setup)
   - [Integration via NPM (ES Modules)](#integration-via-npm-es-modules)
   - [Integration via CDN](#integration-via-cdn)
2. [Core Plugins Documentation](#-core-plugins-documentation)
   - [1. Animate (`@vkm-js/animate`)](#1-animate-vkm-jsanimate)
   - [2. Closeable (`@vkm-js/closeable`)](#2-closeable-vkm-jscloseable)
   - [3. DatePicker (`@vkm-js/datepicker`)](#3-datepicker-vkm-jsdatepicker)
   - [4. Dropdown (`@vkm-js/dropdown`)](#4-dropdown-vkm-jsdropdown)
   - [5. Editor (`@vkm-js/editor`)](#5-editor-vkm-jseditor)
   - [6. Modal (`@vkm-js/modal`)](#6-modal-vkm-jsmodal)
   - [7. Money (`@vkm-js/money`)](#7-money-vkm-jsmoney)
   - [8. Popover (`@vkm-js/popover`)](#8-popover-vkm-jspopover)
   - [9. Tooltip (`@vkm-js/tooltip`)](#9-tooltip-vkm-jstooltip)
   - [10. Validation (`@vkm-js/validation`)](#10-validation-vkm-jsvalidation)
3. [🛠️ Development & Building](#️-development--building)
   - [Scripts](#scripts)
   - [Adding / Customizing Packages](#adding--customizing-packages)
   - [Releasing a New Version](#releasing-a-new-version)

---

## 🚀 General Setup

Every plugin in this repository is published individually as a scoped package under the `@vkm-js/` namespace. You can choose to install only the plugins you need.

### Integration via NPM (ES Modules)

Install the desired plugin using your package manager:

```bash
npm install @vkm-js/animate @vkm-js/modal
# or
yarn add @vkm-js/animate @vkm-js/modal
```

Then, register them with your Alpine.js instance:

```javascript
import Alpine from 'alpinejs';
import animate from '@vkm-js/animate';
import modal from '@vkm-js/modal';

// Register plugins
Alpine.plugin(animate);
Alpine.plugin(modal);

// Start Alpine
window.Alpine = Alpine;
Alpine.start();
```

### Integration via CDN

If you prefer using scripts directly in the browser, each package builds a CDN-compatible bundle that auto-registers itself when Alpine is initialized.

Include the stylesheet if needed, then import the script *after* Alpine's core:

```html
<!-- Alpine.js Core -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- vkm-js Plugins -->
<script defer src="https://unpkg.com/@vkm-js/animate/dist/cdn.min.js"></script>
<script defer src="https://unpkg.com/@vkm-js/modal/dist/cdn.min.js"></script>
```

---

## 🔌 Core Plugins Documentation

---

### 1. Animate (`@vkm-js/animate`)

Animate elements seamlessly as they scroll into the viewport. This plugin leverages `IntersectionObserver` for efficient scroll-triggered transitions.

#### Installation
```bash
npm install @vkm-js/animate
```

#### Usage
Add the `x-animate` directive to any element you wish to animate on scroll:

```html
<!-- Simple Fade Animation -->
<div x-animate class="p-6 bg-white shadow-md">
    I will fade in when visible!
</div>

<!-- Slide Up Animation with 800ms duration -->
<div x-animate.up.800 class="p-6 bg-white shadow-md">
    I will slide up and fade in!
</div>

<!-- Zoom Animation with custom duration defined by directive expression -->
<div x-animate.zoom="1500" class="p-6 bg-white shadow-md">
    I will zoom in slowly!
</div>
```

#### Modifiers & Attributes
* **Animation Type Modifier**: Choose from `fade` (default), `zoom`, `up`, or `down`.
* **Duration Modifier**: A numerical value representing milliseconds (e.g., `.500` or `.1000`). If omitted, it checks the directive's expression value, falling back to a default of `1000`ms.

---

### 2. Closeable (`@vkm-js/closeable`)

Dynamically add a close/dismiss button to warnings, alerts, notifications, or card elements.

#### Installation
```bash
npm install @vkm-js/closeable
```

#### Usage
Attach `x-closeable` to any element. It will automatically insert a close button styled to match its parent context.

```html
<!-- Default behavior: Removes the alert from the DOM on click -->
<div x-closeable class="relative p-4 text-red-700 bg-red-100 rounded-md">
    <strong>Warning!</strong> Something went wrong.
</div>

<!-- With confirmation dialog and custom icon class -->
<div x-closeable.confirm.icon="ti ti-trash" class="relative p-4 bg-yellow-100">
    Confirm before closing this card.
</div>

<!-- Class removal behavior: removes '.show' class on close -->
<div x-closeable.remove.show class="alert alert-dismissible show">
    Removes the 'show' class instead of purging from the DOM.
</div>

<!-- Hiding behaviors -->
<div x-closeable.none class="...">Sets display to none</div>
<div x-closeable.hidden class="...">Sets visibility to hidden</div>
```

#### Modifiers & Attributes
* `.icon`: Replaces the default SVG close icon. Use the directive expression to specify icon classes (e.g., `x-closeable.icon="fa-solid fa-xmark"`).
* `.confirm`: Shows a browser confirmation dialog (`You are about to close this window!`) before dismissing.
* `.remove`: Removes the class specified as the next modifier (e.g., `.remove.active` removes the class `active`).
* `.none`: Applies `style.display = 'none'` instead of destroying the element.
* `.hidden`: Applies `style.visibility = 'hidden'` instead of destroying the element.

---

### 3. DatePicker (`@vkm-js/datepicker`)

A lightweight, powerful datepicker featuring locale configurations, custom styling injection, Livewire synchronization, and date range locking.

#### Installation
```bash
npm install @vkm-js/datepicker
```

#### Usage
Use `x-datepicker` on standard text inputs. It will automatically mask user typing to `YYYY/MM/DD` format and show a custom dropdown calendar.

```html
<!-- Single Date Selection -->
<input type="text" x-datepicker placeholder="Select a date" />

<!-- Synchronized with Livewire -->
<input type="text" x-datepicker data-model="selectedDate" />

<!-- Connected to a hidden form input -->
<div>
    <input type="text" x-datepicker data-name="due_date" />
    <!-- Automatically creates or updates: <input type="hidden" name="due_date"> -->
</div>

<!-- Date Range Setup with local language setting (Greek) -->
<div class="flex gap-4">
    <input type="text" 
           x-datepicker.range.start.el 
           data-range-group="trip" 
           data-model="bookingDates" 
           placeholder="Start Date" />
           
    <input type="text" 
           x-datepicker.range.end.el 
           data-range-group="trip" 
           data-model="bookingDates" 
           placeholder="End Date" />
</div>
```

#### Config Attributes
* `data-model`: Binds the input value to a Livewire model property. If using `.range`, Livewire updates as an array: `[start_date, end_date]`.
* `data-name`: Maps the input value to a hidden input field of the given name.
* `data-range-group`: Associates two datepicker inputs together. The `.end` datepicker will disable all selection dates prior to the chosen `.start` date.

#### Modifiers
* `.range`: Declares that this datepicker is part of a range.
* `.start` / `.end`: Specifies the role in the range setup.
* **Locale Modifier**: Specify any language code to localize calendar labels (e.g., `.el`, `.fr`, `.de`, `.es`). Defaults to `.en`.

---

### 4. Dropdown (`@vkm-js/dropdown`)

Keyboard-accessible dropdown navigation. Automatically handles key trapping, focus wrapping, transition animations, and ARIA markup.

#### Installation
```bash
npm install @vkm-js/dropdown
```

#### Usage
Add `x-dropdown` to your container, marking trigger elements with `data-trigger` and panel containers with `data-dropdown`.

```html
<!-- Default Click Dropdown -->
<div x-dropdown.bottom-end>
    <button data-trigger class="px-4 py-2 bg-blue-600 text-white rounded">
        Options
    </button>
    
    <div data-dropdown>
        <a href="#" role="menuitem" class="px-4 py-2 hover:bg-gray-100">Account Settings</a>
        <a href="#" role="menuitem" class="px-4 py-2 hover:bg-gray-100">Support</a>
        <hr class="my-1 border-gray-200">
        <a href="#" role="menuitem" class="px-4 py-2 text-red-600 hover:bg-red-50">Logout</a>
    </div>
</div>

<!-- Hover Trigger with Auto-Close on Item Click -->
<div x-dropdown.hover.select>
    <span data-trigger class="cursor-pointer">Hover over me</span>
    <div data-dropdown>
        <p class="p-3">Hovering keeps this menu open. Selecting an option closes it!</p>
    </div>
</div>
```

#### Modifiers
* **Placement Modifiers**: Align your dropdown using: `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`. Defaults to `bottom-start`.
* `.hover`: Opens the dropdown on hover instead of click.
* `.select`: Closes the panel immediately when an item inside is clicked.
* `.custom`: Bypasses the default style class injection, allowing you to style the container entirely with custom CSS.

---

### 5. Editor (`@vkm-js/editor`)

A custom WYSIWYG editor containing components for text alignment, format controls, links, colors, and a rich modal manager for tables.

#### Installation
```bash
npm install @vkm-js/editor
```

#### Usage
First, mount the shared Table Modal component *once* in your application template layout:

```html
<!-- In your master layout blade/HTML file -->
<div x-data="editorTableModal" x-show="showModal" class="fixed inset-0 z-9999" x-cloak>
    <!-- Modal overlay & table settings UI -->
</div>
```

Then, initialize your editor instance:

```html
<div x-data="editor('unique-editor-id', 'post.content', $wire)" class="border rounded-md">
    <!-- Toolbar Actions -->
    <div class="flex gap-2 p-2 border-b bg-gray-50">
        <button type="button" @click="action.bold()" :class="{ 'bg-gray-200': action.isBold }">B</button>
        <button type="button" @click="action.italic()" :class="{ 'bg-gray-200': action.isItalic }">I</button>
        <button type="button" @click="color.open()">Color</button>
        <button type="button" @click="table.openModal()">Insert Table</button>
    </div>

    <!-- Content Editable Body -->
    <div contenteditable="true" 
         x-ref="editor" 
         @paste.prevent="handlePaste"
         class="p-4 min-h-[200px] outline-none">
    </div>
</div>
```

#### Initialization Arguments
`editor(id, model, $wire, watchFor = null)`
* `id`: Unique DOM identifier.
* `model`: The Livewire data model string to bind content (e.g., `'post.body'`).
* `$wire`: References Livewire's Javascript controller object.
* `watchFor`: (Optional) Reactive watcher for dynamic multi-model bindings.

---

### 6. Modal (`@vkm-js/modal`)

A clean modal overlay manager that automatically injects background layers, manages body scroll locks, and offers micro-animations.

#### Installation
```bash
npm install @vkm-js/modal
```

#### Usage
Wrap your trigger and dialogue. The plugin takes care of managing the dynamic `<backdrop>` sibling element.

```html
<!-- Large modal with scroll prevention -->
<div x-modal.lg.overflow>
    <!-- Click trigger -->
    <button data-trigger class="btn">Open Details</button>
    
    <!-- Modal panel -->
    <div data-modal>
        <div class="modal-header">
            <h2>Detailed View</h2>
        </div>
        <div class="modal-body">
            This modal locks the background scrolling.
        </div>
        <!-- Close trigger (if omitted, a default top-right close button is injected) -->
        <button data-close class="btn-close">Close Modal</button>
    </div>
</div>
```

#### Modifiers
* **Size Modifiers**: `sm`, `md`, `lg`, `xl`, `xxl`, `fullscreen`.
* **Position Modifiers**: `top` (aligns modal to top of viewport) or `bottom`.
* `.show`: Keeps the modal open by default on page load.
* `.overflow`: Restricts page body scrolling (`overflow: hidden`) when the modal is open.
* `.no-close`: Disables closing the modal when clicking outside on the backdrop.
* **Transition Expression**: Define custom transition suffixes as the directive expression (e.g., `x-modal="fade"` or `x-modal="slide"`). Will search for CSS classes: `modal-{suffix}-show` and `modal-{suffix}-hide`.

---

### 7. Money (`@vkm-js/money`)

A simple utility to format static raw numbers into local currency representations using the browser's native `Intl.NumberFormat`.

#### Installation
```bash
npm install @vkm-js/money
```

#### Usage
Apply `x-money` to any text element holding a raw number.

```html
<!-- Output format: $12,345.68 (US English Locale, USD, 2 decimals) -->
<span x-money.USD.en.2>12345.678</span>

<!-- Output format: 12.345,68 € (German Locale, EUR, 2 decimals) -->
<span x-money.EUR.de.2>12345.678</span>

<!-- Output format: ¥12,346 (Japanese Yen, no decimals) -->
<span x-money.JPY.ja.0>12345.678</span>

<!-- Output format: USD 100.00 (Using 'code' as the display option) -->
<span x-money.USD.en.2="code">100</span>
```

#### Modifiers & Expression
* **Currency Modifier (3 Letters)**: Identifies the currency standard (e.g., `.USD`, `.EUR`, `.JPY`, `.GBP`, `.ZAR`). Defaults to `EUR`.
* **Locale Modifier**: Declares localized formatting standard (e.g., `.en`, `.de`, `.fr`, `.ja`). Defaults to `en`.
* **Decimal Modifier (Number)**: Limits the fractional digits shown.
* **Directive Expression**: Configures `currencyDisplay`. Accepts `'symbol'` (default), `'narrowSymbol'`, `'code'`, or `'name'`.

---

### 8. Popover (`@vkm-js/popover`)

Rich contextual tooltips and popovers featuring customizable directions, themes, and automated safety sanitization for html imports.

#### Installation
```bash
npm install @vkm-js/popover
```

#### Usage
Prepare popover triggers and contents. The library positions elements and automatically draws connection arrows aligned with your selected orientation.

```html
<!-- Popover triggered on Click with auto-generated arrow -->
<div x-popover.top.info>
    <button data-trigger class="btn">Info Popover</button>
    <div data-popover class="p-3">
        <h4 class="font-bold">Did you know?</h4>
        <p>This popover is styled with theme colors and positioned above the trigger.</p>
    </div>
</div>

<!-- Hover-triggered Danger warning popover -->
<div x-popover.right.hover.danger>
    <span data-trigger class="text-red-600">Hover for Warning</span>
    <div data-popover class="p-2">
        Critical data warning!
    </div>
</div>

<!-- Inline HTML Popover with built-in XSS Sanitization -->
<div x-popover.bottom="<p>Click <a href='javascript:alert(1)'>here</a> (Dangerous elements like scripts or JS-URLs are automatically sanitized)</p>">
    <button data-trigger class="btn">Sanitized Popover</button>
    <div data-popover class="p-2"></div>
</div>
```

#### Modifiers
* **Placements**: `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end`. Defaults to `bottom`.
* `.hover`: Activates popup on mouseenter and dismisses it on mouseleave (rather than click).
* **Animations**: `animate-fade` (default), `animate-drop`, or `animate-none`.
* **Themes**: Add custom coloring modifier matching your alert guidelines: `.primary`, `.secondary`, `.success`, `.danger`, `.warning`, `.info`, `.light`, `.dark`.

---

### 9. Tooltip (`@vkm-js/tooltip`)

A featherweight hover tooltip generator that constructs and positions small text labels dynamically at the document body root.

#### Installation
```bash
npm install @vkm-js/tooltip
```

#### Usage
Attach `x-tooltip` to any element. The tooltip content can be specified in the attribute value or expression.

```html
<!-- Simple Top Tooltip -->
<button x-tooltip="Add to cart">Add</button>

<!-- Placed on the bottom with Success green styling -->
<button x-tooltip.bottom.success="Item saved!">Save</button>

<!-- Left placement with danger styling -->
<button x-tooltip.left.danger="Delete permanently">Delete</button>
```

#### Modifiers
* **Placement**: `.top` (default), `.bottom`, `.left`, `.right`.
* **Themes**: `.dark` (default), `.light`, `.info`, `.success`, `.danger`, `.warning`.

---

### 10. Validation (`@vkm-js/validation`)

A flexible form validator supporting Laravel-like rule declarations. Blocks submit buttons during check routines and highlights invalid fields.

#### Installation
```bash
npm install @vkm-js/validation
```

#### Usage
Wrap your form in the `validation` component, specifying rules and error output formats.

```html
<form x-data="validation({
    email: ['required', 'email'],
    username: ['required', 'alpha_num', 'min:3'],
    age: ['nullable', 'integer', 'between:18,99']
}, false)" @submit.prevent="validateAllAndSubmit">

    <div class="mb-4">
        <label>Email</label>
        <input type="email" name="email" id="user_email" @input="validate" class="border p-2">
    </div>

    <div class="mb-4">
        <label>Username</label>
        <input type="text" name="username" id="user_username" @input="validate" class="border p-2">
    </div>

    <button type="submit" class="btn">Submit Form</button>
</form>
```

#### Validation Rules Available
* `required`: Field must not be empty.
* `numeric`: Value must be a valid number.
* `integer`: Value must be a whole number.
* `email`: Value must match standard email expressions.
* `alpha`: Letters only.
* `alpha_dash`: Letters, numbers, hyphens, and underscores.
* `alpha_num`: Alphanumerical input only.
* `nullable`: Skips validation if the field is left empty or set to 0.
* `min:val`: Minimum characters (or minimum number value if numeric rule is present).
* `max:val`: Maximum characters (or maximum number value if numeric rule is present).
* `between:min,max`: Limits values/characters between ranges.
* `gt:val` / `gte:val`: Greater than (or equal).
* `lt:val` / `lte:val`: Less than (or equal).

#### Component Arguments
`validation(rules = {}, showAsTooltip = true)`
* `rules`: JSON string or object mapping input `name` or `model` attributes to array lists of rules.
* `showAsTooltip`: If `true` (default), validation failures appear as red floating tooltips directly connected to inputs. If `false`, it appends `<div class="invalid-feedback">` text elements after the invalid input field.

---

## 🛠️ Development & Building

This repository uses **npm workspaces** to manage packages under a single private root structure.

### Scripts
In the root directory of the `vkm-js` project, run:

* **Build all packages**:
  ```bash
  npm run build
  ```
  Runs the esbuild configuration defined in `scripts/build.js`, publishing ESM, CommonJS, and CDN production bundles inside each package's `./dist` folder.

* **Development mode (File Watcher)**:
  ```bash
  npm run watch
  ```
  Starts esbuild in watch mode. Any edits to source code files under `packages/*/src` will trigger automated incremental compilations.

### Adding / Customizing Packages
To add a new AlpineJS plugin:
1. Create a subfolder inside `packages/` (e.g. `packages/newplugin`).
2. Add a `package.json` with a name prefix like `@vkm-js/newplugin`.
3. Create entry point files:
   - `builds/cdn.js`: Configured to auto-register plugin inside browser `'alpine:init'` event.
   - `builds/module.js`: Entry point exports default function.
4. Run `npm run build` to verify bundles are compiled in `dist/`.

### Releasing a New Version
To release package updates, run:
```bash
npm run release <version-number>
# Example:
npm run release 1.1.8
```

The script `scripts/release.js` will guide you through:
1. Version bumps across all package definitions.
2. Compiling production bundle files.
3. Committing versioned changes and establishing git tags.
4. Pushing changes/tags to GitHub.
5. Drafting public repository releases.
6. Automatically publishing scoped npm packages.

---

## 📄 License
This repository is open-sourced software licensed under the [MIT License](file:///c:/laragon/www/vmphobos/packages/vkm-js/LICENSE.md).

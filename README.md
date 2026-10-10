# vkm-js | Alpine.js Plugins Monorepo

A lightweight, robust, and accessible collection of UI plugins for **Alpine.js**, styled gracefully with **Tailwind CSS**. Built for instant developer productivity, seamless Livewire integration, and clean declarative syntax.

---

## ⚡ Quick Reference

| Package | Type | Directive / Helper | Description |
| :--- | :--- | :--- | :--- |
| [`@vkm-js/animate`](#-1-animate-vkm-jsanimate) | Directive | `x-animate` | Viewport & scroll animations (`fade`, `zoom`, `up`, `down`) |
| [`@vkm-js/closeable`](#-2-closeable-vkm-jscloseable) | Directive | `x-closeable` | Dynamic dismiss button with DOM removal, confirm dialog, or class toggle |
| [`@vkm-js/datepicker`](#-3-datepicker-vkm-jsdatepicker) | Directive | `x-datepicker` | Masked date & datetime picker with time selection, range locking, and Livewire sync |
| [`@vkm-js/dropdown`](#-4-dropdown-vkm-jsdropdown) | Directive | `x-dropdown` | Accessible floating dropdown with keyboard trap, arrow navigation, and teleport |
| [`@vkm-js/editor`](#-5-editor-vkm-jseditor) | Component | `x-data="editor(...)"` | Rich WYSIWYG editor with debounced Livewire sync & table builder modal |
| [`@vkm-js/modal`](#-6-modal-vkm-jsmodal) | Directive | `x-modal` | Accessible modal dialog with body scroll lock & automated backdrop management |
| [`@vkm-js/money`](#-7-money-vkm-jsmoney) | Directive | `x-money` | Formats raw numbers into localized currency representations using `Intl` |
| [`@vkm-js/tooltip`](#-8-tooltip-vkm-jstooltip) | Directive | `x-tooltip` | Floating tooltips & popovers powered by Floating UI with rich HTML templates |
| [`@vkm-js/validation`](#-9-validation-vkm-jsvalidation) | Component | `x-data="validation(...)"` | Laravel-style form validator with floating tooltips or inline feedback |
| [`@vkm-js/alert`](#-10-alert-vkm-jsalert) | Magic | `$toast`, `$alert` | SweetAlert alternative for toast notifications and confirm modal dialogs |

---

## 🚀 Installation & Setup

Every plugin is published individually as a scoped package under the `@vkm-js/` namespace so you can install only what you need.

### 1. Via NPM (ES Modules)

Install the desired plugin(s):

```bash
npm install @vkm-js/tooltip @vkm-js/modal
# or
yarn add @vkm-js/tooltip @vkm-js/modal
```

Register plugins in your JavaScript entry file (e.g., `app.js`):

```javascript
import Alpine from 'alpinejs';
import tooltip from '@vkm-js/tooltip';
import modal from '@vkm-js/modal';

// Register plugins
Alpine.plugin(tooltip);
Alpine.plugin(modal);

// Start Alpine
window.Alpine = Alpine;
Alpine.start();
```

> 💡 **Styling Note:** Most plugins (`tooltip`, `datepicker`, `alert`, `dropdown`, `closeable`) self-inject their required CSS or use standard Tailwind classes. For `@vkm-js/modal`, you can optionally import its CSS stylesheet into your application stylesheet:
> ```css
> @import "@vkm-js/modal/src/modal.css";
> ```

### 2. Via CDN

Each package provides a CDN-ready bundle that automatically registers itself when Alpine initializes:

```html
<!-- Alpine.js Core -->
<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>

<!-- vkm-js Plugins -->
<script defer src="https://unpkg.com/@vkm-js/tooltip/dist/cdn.min.js"></script>
<script defer src="https://unpkg.com/@vkm-js/modal/dist/cdn.min.js"></script>
```

---

## 🔌 Core Plugins Documentation

---

### 1. Animate (`@vkm-js/animate`)

Animate elements seamlessly as they enter the visible viewport using `IntersectionObserver`. Includes instant paint detection so elements already scrolled past on page reload appear immediately without transition lag.

#### Installation
```bash
npm install @vkm-js/animate
```

#### Quick Start
```html
<div x-animate class="p-6 bg-white shadow rounded">
    Fades in smoothly when scrolled into view.
</div>
```

#### Modifiers & Syntax
| Modifier / Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `.fade` | Animation | Default | Fades opacity from 0 to 1 |
| `.up` | Animation | — | Slides up from `translateY(20px)` |
| `.down` | Animation | — | Slides down from `translateY(-50px)` |
| `.zoom` | Animation | — | Scales up from `scale(0.8)` |
| `.{number}` or `="number"` | Duration | `1000` | Transition duration in milliseconds (e.g. `.800` or `="1500"`) |

#### Examples
```html
<!-- Slide up with 800ms duration -->
<div x-animate.up.800>Slide Up (800ms)</div>

<!-- Zoom in with custom expression duration -->
<div x-animate.zoom="1500">Zoom In (1500ms)</div>

<!-- Slide down -->
<div x-animate.down.500>Slide Down (500ms)</div>
```

---

### 2. Closeable (`@vkm-js/closeable`)

Dynamically appends a dismissal close button to alerts, banners, cards, or notifications. The close button is positioned at `absolute top-3 right-1.5` (ensure parent has `relative` positioning).

#### Installation
```bash
npm install @vkm-js/closeable
```

#### Quick Start
```html
<div x-closeable class="relative p-4 bg-red-100 text-red-800 rounded">
    <strong>Alert!</strong> Something went wrong.
</div>
```

#### Modifiers & Syntax
| Modifier / Syntax | Description |
| :--- | :--- |
| *(None)* | **Default:** Removes the element from the DOM (`el.remove()`) |
| `.confirm` | Prompts `window.confirm('You are about to close this window!')` before removing |
| `.remove.{class}` | Removes the specified CSS class instead of removing the element (default: `show`) |
| `.none` | Sets `style.display = 'none'` instead of destroying the element |
| `.hidden` | Sets `style.visibility = 'hidden'` instead of destroying the element |
| `.icon="class"` | Replaces the default SVG with an icon class (e.g. `x-closeable.icon="ti ti-x"`) |

#### Examples
```html
<!-- Ask confirmation before removing -->
<div x-closeable.confirm class="relative p-4 bg-yellow-50">
    Confirm before closing.
</div>

<!-- Remove the 'show' class instead of destroying element -->
<div x-closeable.remove.show class="alert show">
    Removes class 'show'.
</div>

<!-- Custom icon with hide display -->
<div x-closeable.none.icon="ti ti-trash" class="relative p-4 bg-blue-50">
    Hides with display:none and uses Tabler trash icon.
</div>
```

---

### 3. DatePicker (`@vkm-js/datepicker`)

A date and datetime picker featuring automated input masking (`YYYY/MM/DD` or `YYYY/MM/DD HH:mm`), month/year jumpers, date range locking, Livewire synchronization, and dark mode support. Required styles are automatically injected into `<head>` (`#vkm-dp-styles`).

#### Installation
```bash
npm install @vkm-js/datepicker
```

#### Quick Start
```html
<input type="text" x-datepicker placeholder="Select date" />
```

#### Modifiers & Data Attributes
| Modifier / Attribute | Type | Description |
| :--- | :--- | :--- |
| `.time` | Modifier | Enables datetime mode (`YYYY/MM/DD HH:mm`) with an interactive time footer (hour/minute steppers, wheel support, "Now", and "Done" buttons) |
| `.range` | Modifier | Marks the picker as part of a date range |
| `.start` / `.end` | Modifier | Defines role in a range pair. When `.end` is picked, dates prior to `.start` are disabled automatically |
| `.live` | Modifier | Immediately triggers Livewire sync upon selection |
| `.{locale}` | Modifier | Language code for month/weekday localization (e.g., `.el`, `.fr`, `.de`, `.es`, `.it`). Default: `.en` |
| `data-model="property"` | Attribute | Binds to a Livewire property (in range mode, syncs as `[startDate, endDate]`) |
| `data-name="field_name"` | Attribute | Automatically populates a hidden input `<input type="hidden" name="field_name">` |
| `data-range-group="name"` | Attribute | Connects `.start` and `.end` datepicker inputs belonging to the same range |

#### Examples
```html
<!-- Single Date with Livewire sync -->
<input type="text" x-datepicker.live data-model="publishDate" />

<!-- Date & Time Picker (mask: YYYY/MM/DD HH:mm, ISO: YYYY-MM-DD HH:mm:00) -->
<input type="text" x-datepicker.time.el placeholder="Select date & time" />

<!-- Date Range with Greek locale -->
<div class="flex gap-4">
    <input type="text" 
           x-datepicker.range.start.el 
           data-range-group="booking" 
           data-model="bookingDates" 
           placeholder="Check-in" />

    <input type="text" 
           x-datepicker.range.end.el 
           data-range-group="booking" 
           data-model="bookingDates" 
           placeholder="Check-out" />
</div>
```

---

### 4. Dropdown (`@vkm-js/dropdown`)

Accessible floating dropdown menu. Teleports the panel to `<body>`, positions via `@alpinejs/anchor`, traps focus, enables arrow key navigation, and handles outside clicks and the `Escape` key.

> ⚠️ **Peer Requirements:** Requires `@alpinejs/anchor` and `@alpinejs/focus` registered in your Alpine instance.

#### Installation
```bash
npm install @vkm-js/dropdown @alpinejs/anchor @alpinejs/focus
```

#### Quick Start
```html
<div x-dropdown.bottom-start>
    <button data-trigger class="px-4 py-2 bg-blue-600 text-white rounded">Options</button>
    
    <div data-dropdown>
        <a href="#profile" role="menuitem" class="block px-4 py-2 hover:bg-gray-100">Profile</a>
        <a href="#settings" role="menuitem" class="block px-4 py-2 hover:bg-gray-100">Settings</a>
    </div>
</div>
```

#### Structure & Data Attributes
* `data-trigger`: The button or clickable trigger element.
* `data-dropdown`: The panel element. Can be a `<div>` or `<template data-dropdown>` (automatically teleported to `body`).

#### Modifiers
| Modifier | Description |
| :--- | :--- |
| **Placement** | `top`, `top-start`, `top-end`, `bottom`, `bottom-start` (default), `bottom-end`, `left`, `left-start`, `left-end`, `right`, `right-start`, `right-end` |
| `.fixed` | Uses fixed anchor positioning (`x-anchor.fixed.{placement}`) for sticky headers or scrolling containers |
| `.hover` | Opens on hover with a 150ms exit bridge buffer |
| `.select` | Closes the panel immediately when any item inside is clicked |
| `.custom` | Disables default styling classes (`shadow-lg`, `bg-white/70`, `min-w-72`, etc.) leaving only `absolute z-1000` |

#### Examples
```html
<!-- Hover trigger with auto-close on item selection -->
<div x-dropdown.bottom-end.hover.select>
    <button data-trigger class="btn">User Menu</button>
    <div data-dropdown>
        <a href="/account" role="menuitem" class="px-4 py-2">Account</a>
        <a href="/logout" role="menuitem" class="px-4 py-2 text-red-600">Logout</a>
    </div>
</div>

<!-- Template wrapper (recommended for Livewire morph stability) -->
<div x-dropdown.bottom-start>
    <button data-trigger class="btn">Actions</button>
    <template data-dropdown>
        <div class="p-2 space-y-1">
            <button role="menuitem" class="w-full text-left">Edit</button>
            <button role="menuitem" class="w-full text-left text-red-500">Delete</button>
        </div>
    </template>
</div>
```

---

### 5. Editor (`@vkm-js/editor`)

A rich WYSIWYG editor designed for Livewire applications. Features 500ms debounced synchronization, plain-text paste sanitation, formatting toolbars, color pickers, and a comprehensive table builder modal.

#### Installation
```bash
npm install @vkm-js/editor
```

#### Quick Start
```html
<!-- 1. Mount the Table Modal singleton once in your application layout -->
<div x-data="editorTableModal" x-show="showModal" class="fixed inset-0 z-9999" x-cloak>
    <!-- Modal overlay & table controls -->
</div>

<!-- 2. Editor Component Instance -->
<div x-data="editor('blog-editor', 'post.content', $wire)" class="border rounded-md">
    <!-- Toolbar -->
    <div class="flex gap-2 p-2 border-b bg-gray-50">
        <button type="button" @click="action.bold()"><b>B</b></button>
        <button type="button" @click="action.italic()"><i>I</i></button>
        <button type="button" @click="table.openModal()">Table</button>
    </div>

    <!-- Contenteditable Area -->
    <div contenteditable="true" 
         x-ref="editor" 
         @input="save()"
         @paste.prevent="handlePaste"
         class="p-4 min-h-[200px] outline-none"></div>
</div>
```

#### Arguments: `editor(id, model, $wire, watchFor = null)`
* `id`: Unique DOM ID for this editor instance.
* `model`: Livewire model path string (e.g., `'post.body'`).
* `$wire`: Reference to the Livewire component JavaScript object.
* `watchFor`: *(Optional)* Name of property to watch for dynamic model switching (e.g., `'activeTab'`).

#### Available Submodules
| Module | Primary Methods |
| :--- | :--- |
| `action` | `bold()`, `italic()`, `underline()`, `strikeThrough()`, `heading(level)`, `align(type)`, `list(type)`, `updateFormattingState()` |
| `color` | `open()`, `apply(colorHex)` |
| `table` | `openModal()` (dispatches table builder modal), context menu commands |
| `link` | `open()`, `insert(url)` |
| `image` | `open()`, selection memory handling |
| `video` | Video embed insertion |
| `cleanup` | Strips formatting and sanitizes elements |

---

### 6. Modal (`@vkm-js/modal`)

Accessible modal dialog manager that auto-injects backdrop overlays, restricts background scrolling, and supports customizable transitions.

#### Installation
```bash
npm install @vkm-js/modal
```

#### Quick Start
```html
<div x-modal.lg.overflow>
    <!-- Trigger -->
    <button data-trigger class="btn btn-primary">Open Modal</button>

    <!-- Dialog -->
    <div data-modal>
        <div class="modal-header">
            <h3>Modal Title</h3>
        </div>
        <div class="modal-body">
            Modal body content.
        </div>
        <!-- Close button (auto-injected if omitted) -->
        <button data-close class="btn">Close</button>
    </div>
</div>
```

#### Modifiers & Expression
| Modifier / Expression | Description |
| :--- | :--- |
| **Sizes** | `.sm`, `.md`, `.lg`, `.xl`, `.xxl`, `.fullscreen` |
| **Position** | `.top` (aligns to viewport top), `.bottom` (aligns to viewport bottom) |
| `.overflow` | Locks body scrolling (`overflow: hidden`) when modal is open |
| `.show` | Opens the modal by default on initial page load |
| `.no-close` | Disables closing when clicking on the outside backdrop |
| `x-modal="transition"` | Transition animation suffix (`fade` [default], `scale`, `slide-in`, `slide-bottom`, `fall`, `360`) |

#### Programmatic Control
Close any currently open modal from anywhere via JavaScript:
```javascript
window.dispatchEvent(new CustomEvent('close-modal'));
```

---

### 7. Money (`@vkm-js/money`)

Formats raw numbers into localized currency representations using browser-native `Intl.NumberFormat`, with built-in currency symbol fallback overrides (JPY, AUD, CNY, INR, RUB, ZAR, etc.).

#### Installation
```bash
npm install @vkm-js/money
```

#### Quick Start
```html
<!-- Outputs: $12,345.68 (US Dollar, English locale, 2 decimals) -->
<span x-money.USD.en.2>12345.678</span>
```

#### Modifiers & Expression
Modifiers are order-independent:
* **Currency (3 Letters):** ISO currency code (e.g. `.EUR` [default], `.USD`, `.GBP`, `.JPY`, `.AUD`, `.CAD`, `.CHF`).
* **Locale:** Language/country code (e.g. `.en` [default], `.de`, `.fr`, `.ja`, `.el`).
* **Decimals (Number):** Fraction digits (e.g. `.0`, `.2`, `.4`).
* **Directive Expression (`currencyDisplay`):** Configures display format. Options: `'symbol'` (default), `'narrowSymbol'`, `'code'`, `'name'`.

#### Examples
```html
<!-- German Euro: 12.345,68 € -->
<span x-money.EUR.de.2>12345.678</span>

<!-- Japanese Yen (no decimals): ¥12,346 -->
<span x-money.JPY.ja.0>12345.678</span>

<!-- Currency code display: USD 100.00 -->
<span x-money.USD.en.2="code">100</span>
```

---

### 8. Tooltip & Popover (`@vkm-js/tooltip`)

Unified tooltip and popover engine built on `@floating-ui/dom` and styled for Tailwind CSS. Supports unquoted text, reactive Alpine bindings, rotating diamond arrows, interactive hover bridges (150ms buffer), and rich HTML templates.

#### Installation
```bash
npm install @vkm-js/tooltip
```

#### Quick Start
```html
<!-- Simple text (no quotes needed) -->
<button x-tooltip="Add to cart">Add</button>

<!-- Reactive property -->
<button x-tooltip="statusText">Profile</button>
```

#### Modifiers
| Category | Modifiers |
| :--- | :--- |
| **Placements** | `.top` (default), `.top-start`, `.top-end`, `.bottom`, `.bottom-start`, `.bottom-end`, `.left`, `.left-start`, `.left-end`, `.right`, `.right-start`, `.right-end` |
| **Triggers** | `.click` or `.popover` (toggles on click; dismisses on outside click or `Escape`). Default is `hover` + `focus` |
| **Themes** | `.dark` (default), `.light`, `.danger` (`.red`), `.success` (`.green`, `.emerald`), `.warning` (`.yellow`, `.amber`), `.info` (`.blue`, `.sky`) |
| **Options** | `.interactive` (enables hover gap bridge), `.no-arrow` (hides arrow), `.html` / `.raw` (sanitizes & renders HTML string) |

#### Examples

##### 1. Click Popover with Theme
```html
<button x-tooltip.click.bottom.danger="Are you sure? This cannot be undone.">
    Delete Account
</button>
```

##### 2. Rich HTML Popover (`<template data-html>`)
The interactive hover bridge automatically allows moving the cursor inside the popup without closing it:
```html
<div x-tooltip.click.bottom-start>
    <button data-trigger class="px-3 py-1.5 bg-zinc-800 text-white rounded">
        Account Actions
    </button>
    <template data-html>
        <div class="w-64 p-2 space-y-2">
            <h4 class="font-semibold text-sm">Quick Settings</h4>
            <p class="text-xs text-zinc-500">Manage billing and subscription.</p>
            <button class="w-full text-xs bg-indigo-600 text-white py-1 rounded">Upgrade</button>
        </div>
    </template>
</div>
```

---

### 9. Validation (`@vkm-js/validation`)

Form validation component providing Laravel-inspired rule declarations, array wildcard field matching (`items.*.name`), live error tooltips or inline feedback, and automated submit button locking during validation checks.

#### Installation
```bash
npm install @vkm-js/validation
```

#### Quick Start
```html
<form x-data="validation({
    name: ['required', 'min:3'],
    email: ['required', 'email']
})" @submit="if (!isFormValid) $event.preventDefault()">

    <input type="text" name="name" @input="validate" class="border p-2" />
    <input type="email" name="email" @input="validate" class="border p-2" />

    <button type="submit" class="btn">Save</button>
</form>
```

#### Arguments: `validation(rules = {}, showAsTooltip = true)`
* `rules`: Object or JSON string mapping input `name` or `model` attributes to array lists of rules. Supports wildcard asterisks (e.g., `'items.*.qty': ['required', 'integer']`).
* `showAsTooltip`: If `true` (default), errors display as red floating tooltips. If `false`, appends `<div id="error-{id}" class="invalid-feedback">` below the invalid input (requires an `id` on the input).

#### Available Rules
| Rule | Description |
| :--- | :--- |
| `required` | Value must not be empty |
| `numeric` | Value must be a valid number |
| `integer` | Value must be a whole integer |
| `email` | Must match standard email pattern |
| `alpha` | Letters and spaces only |
| `alpha_dash` | Letters, hyphens, and underscores |
| `alpha_num` | Alphanumeric characters only |
| `nullable` | Skips validation if empty or 0 |
| `min:val` / `max:val` | Minimum / maximum characters (or value if numeric/integer) |
| `between:min,max` | Within character length or numeric value range |
| `gt:val` / `gte:val` | Greater than / greater than or equal to |
| `lt:val` / `lte:val` | Less than / less than or equal to |

#### Methods & State
* `validate()`: Triggers validation on `@input="validate"` or `@blur="validate"`.
* `validateDropdown(name, value, id)`: Programmatically validates a custom dropdown.
* `isFormValid`: Boolean property indicating overall form validity.

---

### 10. Alert (`@vkm-js/alert`)

A lightweight toast notification and dialog management plugin styled with Tailwind CSS. Acts as a modern replacement for SweetAlert2, automatically injecting its own containers and backdrop overlays into the DOM.

#### Installation
```bash
npm install @vkm-js/alert
```

#### Quick Start
```html
<!-- Trigger toast notifications -->
<button @click="$toast.success('Settings saved!')">Save</button>
<button @click="$toast.danger('Transaction failed.', { position: 'top-left' })">Error</button>
```

#### API Methods (`$toast` and `$alert`)
| Method | Description |
| :--- | :--- |
| `$toast.success(message, options?)` | Green success toast |
| `$toast.error(message, options?)` | Red error toast |
| `$toast.danger(message, options?)` | Alias for `$toast.error` |
| `$toast.warning(message, options?)` | Amber warning toast |
| `$toast.info(message, options?)` | Sky blue informational toast |
| `$toast.show(message, options?)` | Neutral / base toast |
| `$toast.confirm(callbackOrText, ...)` | Triggers modal confirmation dialog |
| `$toast.settings(config)` | Globally customize buttons, titles, and defaults |

#### Confirm Dialog Examples

##### 1. Callback Style
```html
<button @click="$toast.confirm(() => $wire.deleteItem(), 'Delete this record?')">
    Delete Record
</button>
```

##### 2. Promise Style
```javascript
const confirmed = await $toast.confirm('Are you sure you want to proceed?');
if (confirmed) {
    // Proceed with action
}
```

#### Toast Options
```javascript
$toast.success('Item added!', {
    position: 'top-right', // 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
    timer: 4000,           // Duration in ms (0 for persistent)
    title: 'Success',      // Optional title header
    customClasses: ''      // Additional Tailwind CSS classes
});
```

#### Global Backwards Compatibility
Exposes global window helpers for compatibility with SweetAlert2-style calls:
```javascript
window.success('Success message');
window.confirm(() => doSomething(), 'Are you sure?');
```

---

## 🛠️ Development & Building

This repository uses **npm workspaces** to manage packages in a monorepo structure.

### Scripts
Run from the root directory:

* **Build all packages:**
  ```bash
  npm run build
  ```
  Compiles ESM, CommonJS, and CDN bundles into each package's `./dist` directory using esbuild.

* **Development mode (File Watcher):**
  ```bash
  npm run watch
  ```
  Rebuilds bundles automatically whenever source files in `packages/*/src` change.

* **Release version:**
  ```bash
  npm run release
  ```

---

## 📄 License
This repository is open-sourced software licensed under the [MIT License](./LICENSE.md).

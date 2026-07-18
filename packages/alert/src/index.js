export default function (Alpine) {
    // ----------------------------------------------------
    // 1. Default Configurations and Settings Management
    // ----------------------------------------------------
    const defaultSettings = {
        toast: {
            duration: 3000,
            position: 'top-right',
        },
        themes: {
            success: {
                bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                border: 'border-emerald-200 dark:border-emerald-800/40',
                text: 'text-emerald-800 dark:text-emerald-200',
                iconColor: 'text-emerald-500',
                icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            },
            error: {
                bg: 'bg-red-50 dark:bg-red-950/20',
                border: 'border-red-200 dark:border-red-800/40',
                text: 'text-red-800 dark:text-red-200',
                iconColor: 'text-red-500',
                icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            },
            danger: { // alias
                bg: 'bg-red-50 dark:bg-red-950/20',
                border: 'border-red-200 dark:border-red-800/40',
                text: 'text-red-800 dark:text-red-200',
                iconColor: 'text-red-500',
                icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            },
            warning: {
                bg: 'bg-amber-50 dark:bg-amber-950/20',
                border: 'border-amber-200 dark:border-amber-800/40',
                text: 'text-amber-800 dark:text-amber-200',
                iconColor: 'text-amber-500',
                icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
            },
            info: {
                bg: 'bg-sky-50 dark:bg-sky-950/20',
                border: 'border-sky-200 dark:border-sky-800/40',
                text: 'text-sky-800 dark:text-sky-200',
                iconColor: 'text-sky-500',
                icon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            }
        },
        confirm: {
            title: 'Are you sure?',
            text: "You won't be able to revert this action!",
            confirmButtonText: 'Yes!',
            confirmButtonClass: 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer',
            cancelButtonText: 'No',
            cancelButtonClass: 'px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 cursor-pointer',
            icon: `<svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`,
            iconColor: 'text-amber-500'
        }
    };

    let activeSettings = JSON.parse(JSON.stringify(defaultSettings));

    function mergeSettings(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                mergeSettings(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
        return target;
    }

    // ----------------------------------------------------
    // 2. Alpine.js Reactive Stores
    // ----------------------------------------------------

    // Toast Notifications Store
    Alpine.store('toasts', {
        items: [],

        getTheme(type) {
            return activeSettings.themes[type] || activeSettings.themes.info;
        },

        show(options) {
            if (typeof options === 'string') {
                options = { text: options };
            }

            const id = 'vkm-toast-' + Math.random().toString(36).substr(2, 9);
            const position = options.position || activeSettings.toast.position;
            const type = options.icon || options.type || 'success';
            const duration = options.timer !== undefined ? options.timer : activeSettings.toast.duration;

            const item = {
                id,
                title: options.title || '',
                text: options.text || '',
                type,
                position,
                visible: false,
                customClasses: options.customClasses || options.class || '',
                icon: options.iconHtml || null
            };

            this.items.push(item);

            // Trigger animation enter frame
            setTimeout(() => {
                const found = this.items.find(i => i.id === id);
                if (found) found.visible = true;
            }, 50);

            // Auto dismiss setup
            if (duration > 0) {
                setTimeout(() => {
                    this.remove(id);
                }, duration);
            }

            return id;
        },

        remove(id) {
            const found = this.items.find(i => i.id === id);
            if (found) {
                found.visible = false;
                // Wait for fade-out animation before cleaning up state
                setTimeout(() => {
                    this.items = this.items.filter(i => i.id !== id);
                }, 300);
            }
        }
    });

    // Alert & Confirm Dialog Store
    Alpine.store('dialog', {
        open: false,
        title: '',
        text: '',
        confirmButtonText: '',
        confirmButtonClass: '',
        cancelButtonText: '',
        cancelButtonClass: '',
        showCancelButton: true,
        iconHtml: '',
        iconColor: '',
        resolve: null,

        get icon() {
            return activeSettings.confirm.icon;
        },

        fire(options) {
            this.title = options.title || '';
            this.text = options.text || '';
            this.confirmButtonText = options.confirmButtonText || activeSettings.confirm.confirmButtonText;
            this.confirmButtonClass = options.confirmButtonClass || activeSettings.confirm.confirmButtonClass;
            this.cancelButtonText = options.cancelButtonText || activeSettings.confirm.cancelButtonText;
            this.cancelButtonClass = options.cancelButtonClass || activeSettings.confirm.cancelButtonClass;
            this.showCancelButton = options.showCancelButton !== false;
            this.iconHtml = options.iconHtml || '';
            this.iconColor = options.iconColor || activeSettings.confirm.iconColor;
            this.open = true;

            return new Promise((resolve) => {
                this.resolve = resolve;
            });
        },

        confirm() {
            this.open = false;
            if (this.resolve) {
                this.resolve({ isConfirmed: true });
                this.resolve = null;
            }
        },

        cancel() {
            this.open = false;
            if (this.resolve) {
                this.resolve({ isConfirmed: false });
                this.resolve = null;
            }
        }
    });

    // ----------------------------------------------------
    // 3. The Magic Helper API ($toast)
    // ----------------------------------------------------
    const toastApi = {
        settings(options) {
            mergeSettings(activeSettings, options);
            return this;
        },

        show(message, options = {}) {
            return Alpine.store('toasts').show({ text: message, ...options });
        },

        success(message, options = {}) {
            return Alpine.store('toasts').show({ text: message, icon: 'success', ...options });
        },

        error(message, options = {}) {
            return Alpine.store('toasts').show({ text: message, icon: 'error', ...options });
        },

        danger(message, options = {}) {
            return Alpine.store('toasts').show({ text: message, icon: 'danger', ...options });
        },

        warning(message, options = {}) {
            return Alpine.store('toasts').show({ text: message, icon: 'warning', ...options });
        },

        info(message, options = {}) {
            return Alpine.store('toasts').show({ text: message, icon: 'info', ...options });
        },

        confirm(param1, param2, param3, param4) {
            let callback = null;
            let text = '';
            let title = '';
            let options = {};

            if (typeof param1 === 'function') {
                callback = param1;
                text = typeof param2 === 'string' ? param2 : '';
                title = typeof param3 === 'string' ? param3 : '';
                options = typeof param4 === 'object' ? param4 : {};
            } else if (typeof param1 === 'string') {
                text = param1;
                title = typeof param2 === 'string' ? param2 : '';
                options = typeof param3 === 'object' ? param3 : {};
            } else if (typeof param1 === 'object') {
                options = param1;
                text = options.text || '';
                title = options.title || '';
            }

            const mergedTitle = title || options.title || activeSettings.confirm.title;
            const mergedText = text || options.text || activeSettings.confirm.text;
            const confirmBtnText = options.confirmButtonText || activeSettings.confirm.confirmButtonText;
            const confirmBtnClass = options.confirmButtonClass || activeSettings.confirm.confirmButtonClass;
            const cancelBtnText = options.cancelButtonText || activeSettings.confirm.cancelButtonText;
            const cancelBtnClass = options.cancelButtonClass || activeSettings.confirm.cancelButtonClass;
            const icon = options.iconHtml || options.icon || activeSettings.confirm.icon;
            const iconColor = options.iconColor || activeSettings.confirm.iconColor;
            const showCancel = options.showCancelButton !== false;

            return Alpine.store('dialog').fire({
                title: mergedTitle,
                text: mergedText,
                confirmButtonText: confirmBtnText,
                confirmButtonClass: confirmBtnClass,
                cancelButtonText: cancelBtnText,
                cancelButtonClass: cancelBtnClass,
                iconHtml: icon,
                iconColor,
                showCancelButton: showCancel
            }).then((result) => {
                if (result.isConfirmed) {
                    if (callback) {
                        // Support both raw function invocation and function returning functions
                        const res = callback();
                        if (typeof res === 'function') res();
                    }
                    return true;
                }
                return false;
            });
        }
    };

    // Register Magic property $toast
    Alpine.magic('toast', () => toastApi);

    // Register Magic property $alert as alias
    Alpine.magic('alert', () => toastApi);

    // ----------------------------------------------------
    // 4. Global Backward Compatibility Fallbacks
    // ----------------------------------------------------
    window.success = (message, seconds = 3000) => {
        toastApi.success(message, { timer: seconds });
    };

    window.information = (message, seconds = 0) => {
        toastApi.info(message, { timer: seconds });
    };

    window.error = (message, seconds = 0) => {
        toastApi.error(message, { timer: seconds });
    };

    window.warning = (message, seconds = 0) => {
        toastApi.warning(message, { timer: seconds });
    };

    window.confirm = (callback, text, title, icon, color) => {
        const options = {};
        if (icon) options.iconHtml = icon;
        if (color) options.iconColor = color;
        toastApi.confirm(callback, text, title, options);
    };

    // ----------------------------------------------------
    // 5. Dynamic HTML DOM Injection
    // ----------------------------------------------------
    const injectTemplate = () => {
        if (document.getElementById('vkm-alerts-container')) return;

        // Ensure [x-cloak] is present dynamically so elements are hidden before load
        if (!document.getElementById('vkm-alerts-cloak-style')) {
            const style = document.createElement('style');
            style.id = 'vkm-alerts-cloak-style';
            style.textContent = '[x-cloak] { display: none !important; }';
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.id = 'vkm-alerts-container';
        container.className = 'contents';
        container.innerHTML = `
            <!-- Toast Containers for directions -->
            <template x-for="pos in ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']" :key="pos">
                <div 
                    :id="'vkm-toasts-' + pos" 
                    class="fixed z-[9999] flex flex-col gap-2 p-4 pointer-events-none max-w-sm w-full"
                    :class="{
                        'top-4 left-4': pos === 'top-left',
                        'top-4 left-1/2 -translate-x-1/2': pos === 'top-center',
                        'top-4 right-4': pos === 'top-right',
                        'bottom-4 left-4': pos === 'bottom-left',
                        'bottom-4 left-1/2 -translate-x-1/2': pos === 'bottom-center',
                        'bottom-4 right-4': pos === 'bottom-right'
                    }"
                >
                    <template x-for="toast in $store.toasts.items.filter(t => t.position === pos)" :key="toast.id">
                        <div 
                            x-show="toast.visible"
                            x-transition:enter="transition ease-out duration-300 transform"
                            x-transition:enter-start="opacity-0 translate-y-2"
                            x-transition:enter-end="opacity-100 translate-y-0"
                            x-transition:leave="transition ease-in duration-200 transform"
                            x-transition:leave-start="opacity-100 translate-y-0"
                            x-transition:leave-end="opacity-0 translate-y-2"
                            class="pointer-events-auto flex w-full max-w-sm rounded-lg border shadow-lg overflow-hidden transition-all"
                            :class="[
                                $store.toasts.getTheme(toast.type).bg,
                                $store.toasts.getTheme(toast.type).border,
                                $store.toasts.getTheme(toast.type).text,
                                toast.customClasses || ''
                            ]"
                        >
                            <div class="p-4 flex items-start w-full">
                                <!-- Icon -->
                                <div class="flex-shrink-0 mr-3" :class="$store.toasts.getTheme(toast.type).iconColor" x-html="toast.icon || $store.toasts.getTheme(toast.type).icon"></div>
                                
                                <!-- Text content -->
                                <div class="flex-1 pt-0.5">
                                    <p x-show="toast.title" class="text-sm font-semibold mb-1" x-text="toast.title"></p>
                                    <p class="text-xs font-medium" x-text="toast.text"></p>
                                </div>
                                
                                <!-- Close Button -->
                                <button 
                                    @click="$store.toasts.remove(toast.id)"
                                    class="ml-4 flex-shrink-0 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
                                    :class="[$store.toasts.getTheme(toast.type).text, 'hover:bg-black/5 dark:hover:bg-white/5']"
                                >
                                    <span class="sr-only">Close</span>
                                    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </template>

            <!-- Dialog Modal Overlay -->
            <div 
                x-show="$store.dialog.open" 
                class="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
                x-cloak
            >
                <!-- Backdrop -->
                <div 
                    x-show="$store.dialog.open" 
                    x-transition.opacity.duration.300ms
                    class="fixed inset-0 bg-zinc-900/60 dark:bg-black/85 backdrop-blur-sm cursor-pointer"
                    @click="$store.dialog.cancel()"
                ></div>

                <!-- Modal Content Card -->
                <div 
                    x-show="$store.dialog.open" 
                    x-transition:enter="transition ease-out duration-300 transform"
                    x-transition:enter-start="opacity-0 scale-95"
                    x-transition:enter-end="opacity-100 scale-100"
                    x-transition:leave="transition ease-in duration-200 transform"
                    x-transition:leave-start="opacity-100 scale-100"
                    x-transition:leave-end="opacity-0 scale-95"
                    class="relative bg-white dark:bg-zinc-950 rounded-xl shadow-2xl max-w-md w-full p-6 border border-zinc-100 dark:border-zinc-800 pointer-events-auto text-left"
                >
                    <div class="flex items-start">
                        <!-- Dialog Icon -->
                        <div x-show="$store.dialog.iconHtml || $store.dialog.icon" 
                             class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 mr-4"
                             :class="$store.dialog.iconColor"
                             x-html="$store.dialog.iconHtml || $store.dialog.icon"
                        ></div>
                        
                        <!-- Header and Text -->
                        <div class="flex-1">
                            <h3 x-show="$store.dialog.title" class="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2" x-text="$store.dialog.title"></h3>
                            <p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed" x-text="$store.dialog.text"></p>
                        </div>
                    </div>

                    <!-- Footer Action Buttons -->
                    <div class="mt-6 flex justify-end gap-3">
                        <button 
                            x-show="$store.dialog.showCancelButton" 
                            type="button" 
                            :class="$store.dialog.cancelButtonClass"
                            @click="$store.dialog.cancel()"
                            x-text="$store.dialog.cancelButtonText"
                        ></button>
                        <button 
                            type="button" 
                            :class="$store.dialog.confirmButtonClass"
                            @click="$store.dialog.confirm()"
                            x-text="$store.dialog.confirmButtonText"
                        ></button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectTemplate);
    } else {
        injectTemplate();
    }
}

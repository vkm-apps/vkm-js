export default function colorPickerModule(editorModule) {
    return {
        open: false,               // Color picker visibility
        currentColor: '#000000',  // Initial color
        colorElement: null,        // Element the picker is associated with
        colorAction: null,         // Action: 'text' or 'background' (for text color or background color)
        palettes: {
            red: [
                '#fef2f2',
                '#fee2e2',
                '#fecaca',
                '#fca5a5',
                '#f87171',
                '#ef4444',
                '#dc2626',
                '#b91c1c',
                '#991b1b',
                '#7f1d1d',
                '#6b1e1e',
            ],
            blue: [
                '#e9eeff',
                '#d6e0ff',
                '#b6c5ff',
                '#8a9dff',
                '#5c66ff',
                '#3a36ff',
                '#2d14ff',
                '#2307f2',
                '#1f0cc7',
                '#1f149b',
                '#140c5a',
            ],
            info: [
                '#f0f8fe',
                '#ddeffc',
                '#c3e4fa',
                '#9bd3f5',
                '#6bbaef',
                '#489ee9',
                '#3382dd',
                '#2a6dcb',
                '#2858a5',
                '#264c82',
                '#223b63',
            ],
            purple: [
                '#f3f2fb',
                '#eae8f7',
                '#d7d5f0',
                '#c0bbe6',
                '#ada0d9',
                '#9c88cc',
                '#8b6fbc',
                '#795ea4',
                '#624e85',
                '#51436b',
                '#31273f',
            ],
            aqua: [
                '#ebfef6',
                '#cffce8',
                '#a3f7d5',
                '#48eab4',
                '#2bdca6',
                '#07c290',
                '#009e76',
                '#007e62',
                '#01644e',
                '#025242',
                '#002e26',
            ],
            green: [
                '#f5f8f5',
                '#e7f1e7',
                '#d0e2d0',
                '#abcaac',
                '#7eaa80',
                '#5b8c5d',
                '#436b45',
                '#3a5b3b',
                '#324934',
                '#2a3d2c',
                '#132014',
            ],
            yellow: [
                '#fefbec',
                '#fbf3ca',
                '#f6e691',
                '#f1d358',
                '#efc643',
                '#e6a21a',
                '#cc7e13',
                '#a95a14',
                '#8a4716',
                '#713b16',
                '#411d07',
            ],
            'orange': [
                '#fff7ed',
                '#feedd6',
                '#fcd6ac',
                '#fab977',
                '#f79b53',
                '#f3721c',
                '#e45812',
                '#bd4111',
                '#973515',
                '#792d15',
                '#411409',
            ],
            rose: [
                '#fff2f1',
                '#ffe4e1',
                '#ffccc7',
                '#ffa9a0',
                '#ff8f83',
                '#f84d3b',
                '#e5301d',
                '#c12514',
                '#a02214',
                '#842218',
                '#480d07',
            ],
            pink: [
                '#fff1f5',
                '#ffe4eb',
                '#fdcedc',
                '#fb8cb0',
                '#f973a1',
                '#f24184',
                '#df1f70',
                '#bc145f',
                '#9d1455',
                '#87144f',
                '#4b0627',
            ],
            gray: [
                '#f6f6f7',
                '#eeeff1',
                '#e0e2e5',
                '#cccfd5',
                '#b6bac3',
                '#acaeb9',
                '#8d8e9e',
                '#7a7b88',
                '#64656f',
                '#53535c',
                '#313235',
            ],
            neutral: [
                '#ffffff',
                '#efefef',
                '#dcdcdc',
                '#bdbdbd',
                '#989898',
                '#7c7c7c',
                '#656565',
                '#525252',
                '#464646',
                '#3d3d3d',
                '#000000',
            ],
        },

        toRGB(color) {
            const ctx = document.createElement('canvas').getContext('2d');
            ctx.fillStyle = color;
            return ctx.fillStyle; // always returns as rgb() or hex
        },

        openColorPicker(el, action) {
            if (document.getElementById('color-picker')) {
                return;
            }

            // When a button is clicked, open the color picker
            this.colorElement = el;
            this.colorAction = action;
            this.currentColor = this.currentColor || '#000000';

            let ref = '$refs.text_picker';
            if (action !== 'text') {
                ref = '$refs.bg_picker';
            }

            let pickerPopup = document.createElement('div');
            pickerPopup.id = 'color-picker';
            pickerPopup.className = 'min-w-max p-4 bg-white rounded-md border border-gray-200/50 dark:bg-black/90 border shadow-md z-10';
            pickerPopup.setAttribute('x-on:click.outside', "if (!$event.target.closest('button')) { $el.remove() }");
            pickerPopup.setAttribute('x-anchor', ref);

            pickerPopup.innerHTML = `
                    <div class="flex items-center space-x-2">
                        <input
                            type="color"
                            x-model="color.currentColor"
                            class="rounded-md w-1/2"
                        />
                        <span class="font-medium text-gray-500 text-sm"">Pick Color</span>
                    </div>

                    <div class="grid grid-cols-12 gap-0.5 mt-2">
                        <template x-for="(palette, key) in color.palettes" :key="key">
                            <div class="flex flex-col space-y-0.5">
                                <template x-for="color in palette" :key="color">
                                    <button
                                        type="button"
                                        class="h-5 w-5 border border-gray-200 rounded-sm hover:cursor-pointer"
                                        :style="{ backgroundColor: color }"
                                        @click="color.currentColor = color"
                                    ></button>
                                </template>
                            </div>
                        </template>
                    </div>

                    <!-- Add Button -->
                    <button type="button" class="mt-3 px-3 py-1 rounded-sm bg-blue-500 text-xs text-white hover:cursor-pointer hover:opacity-80" @click="color.changeColor(), document.getElementById('color-picker').remove()">
                        Apply Color
                    </button>

                    <button type="button" class="mt-3 px-3 py-1 rounded-sm bg-gray-300 text-xs text-black hover:cursor-pointer hover:opacity-80" @click="document.getElementById('color-picker').remove()">
                        Cancel
                    </button>
                `;
            el.after(pickerPopup);

            // Attach event listener AFTER inserting popup into DOM
            // document.getElementById('insert-link-btn').addEventListener('click', this.insertOrUpdateLink.bind(this));

            this.open = true;
        },

        closeColorPicker() {
            // Close the color picker when clicking outside
            this.open = false;
            this.colorElement = null;
            this.colorAction = null;
        },

        changeColor() {
            // Change the color based on the selected action (text or background)
            if (this.colorAction === 'text') {
                this.changeTextColor();
            }
            else if (this.colorAction === 'background') {
                this.changeBgColor();
            }

            editorModule.save();
        },

        changeTextColor() {
            // Apply the text color to the selected range
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);  // Get the selected range
            const selectedNode = range.cloneContents(); // Clone selected contents

            // Create a span element to wrap the selected text and change its color
            const span = document.createElement('span');
            span.style.color = this.currentColor;  // Apply the selected color to text

            // Append the selected text into the span
            span.appendChild(selectedNode);

            // Delete the original contents and insert the new span with the updated text color
            range.deleteContents();
            range.insertNode(span);

            // Reset the cursor position after text modification
            const cursorPosition = range.endContainer;
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStart(cursorPosition, 0);
            newRange.setEnd(cursorPosition, 0);
            selection.addRange(newRange);
        },

        changeBgColor() {
            // Apply background color to the selected range
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);  // Get the selected range
            const selectedNode = range.cloneContents(); // Clone selected contents

            // Create a span element to wrap the selected text and change its background color
            const span = document.createElement('span');
            span.style.backgroundColor = this.currentColor;  // Apply the selected background color

            // Append the selected text into the span
            span.appendChild(selectedNode);

            // Delete the original contents and insert the new span with the updated background color
            range.deleteContents();
            range.insertNode(span);

            // Reset the cursor position after background color change
            const cursorPosition = range.endContainer;
            selection.removeAllRanges();
            const newRange = document.createRange();
            newRange.setStart(cursorPosition, 0);
            newRange.setEnd(cursorPosition, 0);
            selection.addRange(newRange);
        }
    };
}

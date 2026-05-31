// videoModule.js
export default function videoModule(editorModule) {
    return {
        selection: null,
        showModal: false,
        youtubeUrl: '',
        videoTitle: '',
        customClasses: '',
        customStyles: '',

        insert() {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                this.selection = selection.getRangeAt(0);
            }

            this.showModal = true;
        },

        add() {
            if (!this.youtubeUrl) {
                return;
            }

            let iframe;

            // Check if the input is a full iframe embed code
            let pastedIframe = null;
            const trimmedInput = this.youtubeUrl.trim();
            if (trimmedInput.startsWith('<')) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(trimmedInput, 'text/html');
                    pastedIframe = doc.querySelector('iframe');
                } catch (e) {
                    pastedIframe = null;
                }
            }

            if (pastedIframe) {
                const src = pastedIframe.getAttribute('src') || '';
                const trustedSources = [
                    'youtube.com',
                    'youtu.be',
                    'youtube-nocookie.com',
                    'player.vimeo.com',
                    'vimeo.com'
                ];
                let isTrusted = false;
                try {
                    const url = new URL(src, window.location.origin);
                    isTrusted = trustedSources.some(domain => url.hostname === domain || url.hostname.endsWith('.' + domain));
                } catch (e) {
                    isTrusted = false;
                }

                if (!isTrusted) {
                    alert('Invalid or untrusted video iframe source.');
                    return;
                }

                // Create a clean new iframe to prevent smuggled event handlers or javascript execution
                iframe = document.createElement('iframe');
                iframe.src = src;

                const width = pastedIframe.getAttribute('width');
                const height = pastedIframe.getAttribute('height');
                if (width) iframe.setAttribute('width', width);
                if (height) iframe.setAttribute('height', height);

                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            } else {
                // Create a new iframe
                iframe = document.createElement('iframe');

                // Check if input is an embed URL
                const embedMatch = this.youtubeUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
                if (embedMatch) {
                    iframe.src = this.youtubeUrl;
                } else {
                    // Check if input is a standard watch URL or youtu.be link
                    const watchMatch = this.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
                    if (watchMatch) {
                        iframe.src = `https://www.youtube.com/embed/${watchMatch[1]}`;
                    } else {
                        alert('Invalid YouTube URL. Use a watch URL, youtu.be link, or embed code.');
                        return;
                    }
                }

                // Set default iframe attributes
                iframe.frameBorder = '0';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            }

            // Apply Tailwind classes and custom styles
            let classes = this.customClasses || '';

            if (classes) {
                iframe.className = classes;
            }

            if (this.customStyles) {
                iframe.style.cssText = this.customStyles;
            }

            // Optional: set title for accessibility
            iframe.title = this.videoTitle;

            // Insert into editor
            this.selection.insertNode(iframe);
            editorModule.save();

            // Reset modal
            this.showModal = false;
            this.youtubeUrl = '';
            this.videoTitle = '';
            this.customClasses = '';
            this.customStyles = '';
        }
    }
}

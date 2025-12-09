export default function imageModule(editorModule) {
    return {
        // Core state
        lastSelection: null,
        showModal: false,
        src: '',
        alt: '',
        originalWidth: 200,
        originalHeight: 0,
        aspectRatio: 1,
        width: 200,
        height: '',
        opacity: 1,
        borderWidth: 0,
        borderColor: '#000',
        borderRadius: 0,
        float: "none",
        selectedImage: null,
        constraint: true,
        range: 1,

        setRange(x) {
            this.range = x;
        },

        init() {
            if (!this.lastSelection) {
                this.storeSelection();
            }

            if (!this.src) {
                return;
            }

            // Only calculate if width or height is missing
            if (this.width && !this.height) {
                const img = new Image();
                img.onload = () => this.calculateDimensions(img);
                img.src = this.src;
            }
        },

        storeSelection() {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                this.lastSelection = selection.getRangeAt(0);
            }
        },

        closeModal() {
            this.reset();
            this.showModal = false;
        },

        //reset image modal
        reset() {
            this.src = '';
            this.alt = '';
            this.originalWidth = 200;
            this.originalHeight = 0;
            this.aspectRatio = 1;
            this.width = 200;
            this.height = '';
            this.opacity = 1;
            this.borderWidth = 0;
            this.borderColor = '#000';
            this.borderRadius = 0;
            this.float = 'none';
            this.selectedImage = null;
            this.constraint = true;
            this.range = 1;
            this.lastSelection = null;
            this.showModal = false;
        },

        calculateDimensions(img) {
            // Store original dimensions & aspect ratio if not set
            if (!this.originalWidth || !this.originalHeight) {
                this.originalWidth = img.naturalWidth;
                this.originalHeight = img.naturalHeight;
                this.aspectRatio = img.naturalWidth / img.naturalHeight;
            }

            // Set width if not already set
            if (!this.width) {
                this.width = this.originalWidth;
            }

            // Set height based on width & aspect ratio if not already set
            if (!this.height) {
                this.height = Math.round(this.width / this.aspectRatio);
            }
        },

        changeConstraint() {
            this.constraint = !this.constraint;

            if (this.constraint && this.width && this.height) {
                this.aspectRatio = this.width / this.height;
            }
        },

        changeImageDimensions(type, value) {
            value = parseInt(value);

            if (type === 'w') {
                this.width = value;
                if (this.constraint) {
                    this.height = Math.round(this.width / this.aspectRatio);
                }
            } else if (type === 'h') {
                this.height = value;
                if (this.constraint) {
                    this.width = Math.round(this.height * this.aspectRatio);
                }
            }
        },

        setBorderColor(value) {
            this.borderColor = value;
        },

        // --- Insert / Update Image ---
        insertImage() {
            if (!this.lastSelection && !this.selectedImage) {
                return;
            }

            const img = this.selectedImage || document.createElement('img');

            img.src = this.src;
            img.alt = this.alt;
            img.style.width = this.width + 'px';
            img.style.height = this.height + 'px';
            img.style.float = this.float;

            if (this.borderWidth) {
                img.style.border = `${this.borderWidth}px solid ${this.borderColor}`;
            }

            if (this.borderRadius) {
                img.style.borderRadius = this.borderRadius + 'px';
            }

            if (this.opacity) {
                img.style.opacity = this.opacity;
            }

            img.style.display = "inline-block";

            if (!this.selectedImage) {
                this.lastSelection.insertNode(img);
                this.lastSelection = null;
            }

            this.closeModal();
            editorModule.save();
        },

        insertFile(url) {
            if (!this.lastSelection) {
                return;
            }

            let input = prompt("Enter a title for the link:", "") || url;

            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.textContent = input;
            link.style.cssText = "color: #007bff; text-decoration: underline; font-weight: bold; transition: color 0.2s ease-in-out;";

            this.lastSelection.insertNode(link);
            this.lastSelection = null;

            this.closeModal();
            editorModule.save();
        },

        openImageEditor(event) {
            const data = event.detail;
            this.src = data.url;
            this.path = data.path;

            if (data.width) {
                this.width = data.width;
            }

            if (data.height) {
                this.height = data.height;
            }

            this.init();
            this.showModal = true;
        },

        updateImageSrc(value) {
            if (this.selectedImage) {
                this.selectedImage.src = value;
                editorModule.save();
            }
        },

        updateAltText(value) {
            if (this.selectedImage) {
                this.selectedImage.alt = value;
                editorModule.save();
            }
        },

        // --- Selection & Modal ---
        selectImage(image) {
            this.selectedImage = image;
            this.lastSelection = image;
            this.src = image.src;
            this.alt = image.alt;

            // Float & border styles
            this.float = getComputedStyle(image).float;
            this.borderWidth = parseFloat(getComputedStyle(image).borderWidth);
            this.borderColor = getComputedStyle(image).borderColor;
            this.borderRadius = parseFloat(getComputedStyle(image).borderRadius);
            this.opacity = parseFloat(getComputedStyle(image).opacity);

            // Use the image's natural dimensions to calculate aspect ratio
            if (!this.originalWidth || !this.originalHeight) {
                this.originalWidth = image.naturalWidth || image.width;
                this.originalHeight = image.naturalHeight || image.height;
                this.aspectRatio = this.originalWidth / this.originalHeight;
            }

            // Preserve existing width if set, otherwise use original
            this.width = image.width || this.width || this.originalWidth;

            // Calculate height according to width & aspect ratio
            this.height = image.height || this.height || Math.round(this.width / this.aspectRatio);

            let currentAspectRatio = this.width / this.height;

            // Use a small tolerance to account for floating point differences
            const tolerance = 0.01;

            if (Math.abs(this.aspectRatio - currentAspectRatio) > tolerance) {
                this.constraint = false;
            }
            else {
                this.constraint = true;
            }

            this.showModal = true;
        },

        deselectImage() {
            this.selectedImage = null;
            this.reset();
        },

        remove() {
            this.selectedImage.remove();
            this.closeModal();
            editorModule.save();
        },

        handleClick(event) {
            if (event.target.tagName === 'IMG') {
                this.selectImage(event.target)
            }
            else {
                this.deselectImage();
            }
        },

        alignImage(position) {
            if (!this.selectedImage) {
                return;
            }
            this.selectedImage.style.display = 'inline';
            this.selectedImage.style.margin = position === 'center' ? '0 auto' : '0';
            this.selectedImage.style.float = position === 'left' ? 'left' : position === 'right' ? 'right' : 'none';
            editorModule.save();
        },

        handleDragStart(event) {
            if (event.target.tagName !== 'IMG') {
                return;
            }

            event.target.classList.add('opacity-50', 'scale-75', 'cursor-grabbing');
        },

        handleDragEnd(event) {
            if (event.target.tagName !== 'IMG') {
                return;
            }

            event.target.classList.remove('opacity-50', 'scale-75', 'cursor-grabbing');
        },

        isValidImageUrl(url) {
            return /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|bmp|webp))/i.test(url);
        },
    };
}

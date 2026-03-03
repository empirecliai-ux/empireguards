class Pane {
    constructor(manager, url) {
        this.manager = manager;
        this.id = `pane-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        this.isMaximized = false;
        this.preMaximizeRect = null;

        this.element = this._createPaneElement();
        this.webview = this.element.querySelector('webview');
        this.titleBar = this.element.querySelector('.pane-titlebar');
        this.overlay = this.element.querySelector('.webview-overlay');

        // Use setAttribute for src instead of innerHTML to prevent XSS
        this.webview.setAttribute('src', url);
        // Explicitly exclude allowpopups for security as per memory context

        this._setupEvents();
    }

    _createPaneElement() {
        const div = document.createElement('div');
        div.className = 'window-pane';
        div.id = this.id;
        div.style.left = '50px';
        div.style.top = '50px';
        div.style.width = '800px';
        div.style.height = '600px';

        div.innerHTML = `
            <div class="pane-titlebar">
                <span class="pane-title">Loading...</span>
                <div class="pane-controls">
                    <button class="pane-btn maximize"></button>
                    <button class="pane-btn close"></button>
                </div>
            </div>
            <div class="pane-content">
                <div class="webview-overlay"></div>
                <webview class="pane-webview"></webview>
            </div>
            <div class="resize-handle n"></div>
            <div class="resize-handle s"></div>
            <div class="resize-handle e"></div>
            <div class="resize-handle w"></div>
            <div class="resize-handle ne"></div>
            <div class="resize-handle nw"></div>
            <div class="resize-handle se"></div>
            <div class="resize-handle sw"></div>
        `;
        return div;
    }

    _setupEvents() {
        // Dragging
        this.titleBar.addEventListener('mousedown', (e) => {
            if (e.target.closest('.pane-controls')) return;
            this.manager.startDrag(e, this);
        });

        // Double click to maximize/restore
        this.titleBar.addEventListener('dblclick', (e) => {
            if (e.target.closest('.pane-controls')) return;
            this.toggleMaximize();
        });

        // Resizing
        const handles = this.element.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                const type = handle.className.replace('resize-handle ', '');
                this.manager.startResize(e, this, type);
            });
        });

        // Activation
        this.element.addEventListener('mousedown', () => {
            this.manager.setActivePane(this);
        });

        // Controls
        this.element.querySelector('.pane-btn.close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        this.element.querySelector('.pane-btn.maximize').addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximize();
        });

        // Webview events
        this.webview.addEventListener('did-start-loading', () => {
            this.titleBar.querySelector('.pane-title').textContent = 'Loading...';
        });

        this.webview.addEventListener('did-stop-loading', () => {
            this.titleBar.querySelector('.pane-title').textContent = this.webview.getTitle();
        });


        this.webview.addEventListener('page-title-updated', (e) => {
            this.titleBar.querySelector('.pane-title').textContent = e.title;
        });

        // Add did-navigate to sync URL back to manager/address bar
        this.webview.addEventListener('did-navigate', (e) => {
            if (this.manager.activePane === this) {
                const event = new CustomEvent('pane-navigated', { detail: { url: e.url } });
                document.dispatchEvent(event);
            }
        });

        this.webview.addEventListener('did-navigate-in-page', (e) => {
             if (this.manager.activePane === this) {
                const event = new CustomEvent('pane-navigated', { detail: { url: e.url } });
                document.dispatchEvent(event);
            }
        });


        // Sync active pane state when webview is focused
        this.webview.addEventListener('focus', () => {
            this.manager.setActivePane(this);
        });
    }

    close() {
        this.element.remove();
        this.manager.removePane(this);
    }

    toggleMaximize() {
        if (this.isMaximized) {
            this.restore();
        } else {
            this.maximize();
        }
    }

    maximize() {
        this.preMaximizeRect = {
            left: this.element.style.left,
            top: this.element.style.top,
            width: this.element.style.width,
            height: this.element.style.height
        };
        this.element.style.left = '0';
        this.element.style.top = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.isMaximized = true;
    }

    restore() {
        if (this.preMaximizeRect) {
            this.element.style.left = this.preMaximizeRect.left;
            this.element.style.top = this.preMaximizeRect.top;
            this.element.style.width = this.preMaximizeRect.width;
            this.element.style.height = this.preMaximizeRect.height;
        }
        this.isMaximized = false;
    }

    showOverlay() {
        this.overlay.style.display = 'block';
    }

    hideOverlay() {
        this.overlay.style.display = 'none';
    }
}

class WindowManager {
    constructor(container) {
        this.container = container;
        this.panes = [];
        this.activePane = null;
        this.dragState = null;
        this.resizeState = null;

        // Snap overlay
        this.snapOverlay = document.createElement('div');
        this.snapOverlay.className = 'snap-overlay';
        this.container.appendChild(this.snapOverlay);

        // Global mouse events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }

    createPane(url = 'about:blank') {
        const pane = new Pane(this, url);
        this.container.appendChild(pane.element);
        this.panes.push(pane);

        // Offset new pane
        const offset = (this.panes.length - 1) * 30;
        pane.element.style.left = `${50 + offset}px`;
        pane.element.style.top = `${50 + offset}px`;

        this.setActivePane(pane);
        return pane;
    }

    removePane(pane) {
        this.panes = this.panes.filter(p => p !== pane);
        if (this.activePane === pane) {
            this.activePane = this.panes.length > 0 ? this.panes[this.panes.length - 1] : null;
            if (this.activePane) this.setActivePane(this.activePane);
        }

        // If all panes closed, clear address bar (handled by event)
        if (this.panes.length === 0) {
            const event = new CustomEvent('all-panes-closed');
            document.dispatchEvent(event);
        }
    }

    setActivePane(pane) {
        if (this.activePane) {
            this.activePane.element.classList.remove('active');
            this.activePane.element.style.zIndex = 10;
        }
        this.activePane = pane;
        if (pane) {
            pane.element.classList.add('active');
            pane.element.style.zIndex = 20;

            // Dispatch event for UI updates (address bar, buttons)
            const event = new CustomEvent('pane-activated', { detail: { pane } });
            document.dispatchEvent(event);
        }
    }

    startDrag(e, pane) {
        if (pane.isMaximized) {
            // Drag-to-restore logic
            pane.restore();
            // Adjust start position relative to the newly restored size
            // For a simpler approach, just center it on the mouse
            const rect = pane.element.getBoundingClientRect();
            pane.element.style.left = `${e.clientX - (rect.width / 2)}px`;
            pane.element.style.top = `${e.clientY - 15}px`;
        }

        this.dragState = {
            pane,
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: pane.element.offsetLeft,
            initialTop: pane.element.offsetTop
        };
        pane.showOverlay();
        this.setActivePane(pane);
        e.preventDefault();
    }

    startResize(e, pane, handleType) {
        if (pane.isMaximized) return;

        this.resizeState = {
            pane,
            handleType,
            startX: e.clientX,
            startY: e.clientY,
            initialLeft: pane.element.offsetLeft,
            initialTop: pane.element.offsetTop,
            initialWidth: pane.element.offsetWidth,
            initialHeight: pane.element.offsetHeight
        };
        pane.showOverlay();
        this.setActivePane(pane);
        e.preventDefault();
    }

    handleMouseMove(e) {
        if (this.dragState) {
            this.handleDrag(e);
        } else if (this.resizeState) {
            this.handleResize(e);
        }
    }

    handleDrag(e) {
        const { pane, startX, startY, initialLeft, initialTop } = this.dragState;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // Enhanced Snapping from v36
        newLeft = this.snap(newLeft, 'x');
        newTop = this.snap(newTop, 'y');

        // Bounds check (keep titlebar visible)
        if (newTop < 0) newTop = 0;
        if (newTop > this.container.clientHeight - 30) newTop = this.container.clientHeight - 30;

        pane.element.style.left = `${newLeft}px`;
        pane.element.style.top = `${newTop}px`;

        // Screen edge snap detection for preview
        this.checkSnap(e.clientX, e.clientY);
    }

    snap(pos, axis) {
        const snapDistance = 20;
        // Snap to container edges
        if (Math.abs(pos) < snapDistance) return 0;

        const containerSize = axis === 'x' ? this.container.offsetWidth : this.container.offsetHeight;
        const paneSize = axis === 'x' ? this.dragState.pane.element.offsetWidth : this.dragState.pane.element.offsetHeight;

        if (Math.abs(pos + paneSize - containerSize) < snapDistance) {
            return containerSize - paneSize;
        }

        // Snap to other panes (Inter-pane snapping from v36)
        for (const otherPane of this.panes) {
            if (otherPane === this.dragState.pane) continue;

            const otherRect = {
                left: otherPane.element.offsetLeft,
                top: otherPane.element.offsetTop,
                right: otherPane.element.offsetLeft + otherPane.element.offsetWidth,
                bottom: otherPane.element.offsetTop + otherPane.element.offsetHeight
            };

            if (axis === 'x') {
                if (Math.abs(pos - otherRect.right) < snapDistance) return otherRect.right;
                if (Math.abs(pos + paneSize - otherRect.left) < snapDistance) return otherRect.left - paneSize;
                if (Math.abs(pos - otherRect.left) < snapDistance) return otherRect.left;
                if (Math.abs(pos + paneSize - otherRect.right) < snapDistance) return otherRect.right - paneSize;
            } else {
                if (Math.abs(pos - otherRect.bottom) < snapDistance) return otherRect.bottom;
                if (Math.abs(pos + paneSize - otherRect.top) < snapDistance) return otherRect.top - paneSize;
                if (Math.abs(pos - otherRect.top) < snapDistance) return otherRect.top;
                if (Math.abs(pos + paneSize - otherRect.bottom) < snapDistance) return otherRect.bottom - paneSize;
            }
        }
        return pos;
    }

    checkSnap(x, y) {
        const threshold = 20;
        const { clientWidth, clientHeight } = this.container;

        this.snapOverlay.classList.remove('visible');
        this.dragState.snapType = null;

        if (x < threshold) {
            this.showSnapPreview(0, 0, clientWidth / 2, clientHeight);
            this.dragState.snapType = 'left';
        } else if (x > clientWidth - threshold) {
            this.showSnapPreview(clientWidth / 2, 0, clientWidth / 2, clientHeight);
            this.dragState.snapType = 'right';
        } else if (y < threshold) {
            this.showSnapPreview(0, 0, clientWidth, clientHeight);
            this.dragState.snapType = 'maximize';
        } else if (y > clientHeight - threshold) {
             this.showSnapPreview(0, clientHeight / 2, clientWidth, clientHeight / 2);
             this.dragState.snapType = 'bottom';
        }
    }

    showSnapPreview(x, y, w, h) {
        this.snapOverlay.style.left = `${x}px`;
        this.snapOverlay.style.top = `${y}px`;
        this.snapOverlay.style.width = `${w}px`;
        this.snapOverlay.style.height = `${h}px`;
        this.snapOverlay.classList.add('visible');
    }

    handleResize(e) {
        const { pane, handleType, startX, startY, initialLeft, initialTop, initialWidth, initialHeight } = this.resizeState;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = initialWidth;
        let newHeight = initialHeight;
        let newLeft = initialLeft;
        let newTop = initialTop;

        if (handleType.includes('e')) {
            newWidth = Math.max(300, initialWidth + deltaX);
        }
        if (handleType.includes('s')) {
            newHeight = Math.max(200, initialHeight + deltaY);
        }
        if (handleType.includes('w')) {
            newWidth = Math.max(300, initialWidth - deltaX);
            newLeft = initialLeft + (initialWidth - newWidth);
        }
        if (handleType.includes('n')) {
             newHeight = Math.max(200, initialHeight - deltaY);
             newTop = initialTop + (initialHeight - newHeight);
        }

        pane.element.style.width = `${newWidth}px`;
        pane.element.style.height = `${newHeight}px`;
        pane.element.style.left = `${newLeft}px`;
        pane.element.style.top = `${newTop}px`;
    }

    handleMouseUp(e) {
        if (this.dragState) {
            const { pane, snapType } = this.dragState;
            pane.hideOverlay();

            if (snapType) {
                this.applySnap(pane, snapType);
            }

            this.snapOverlay.classList.remove('visible');
            this.dragState = null;
        } else if (this.resizeState) {
            this.resizeState.pane.hideOverlay();
            this.resizeState = null;
        }
    }

    applySnap(pane, type) {
        pane.preMaximizeRect = {
            left: pane.element.style.left,
            top: pane.element.style.top,
            width: pane.element.style.width,
            height: pane.element.style.height
        };

        if (type === 'left') {
            pane.element.style.left = '0';
            pane.element.style.top = '0';
            pane.element.style.width = '50%';
            pane.element.style.height = '100%';
        } else if (type === 'right') {
            pane.element.style.left = '50%';
            pane.element.style.top = '0';
            pane.element.style.width = '50%';
            pane.element.style.height = '100%';
        } else if (type === 'maximize') {
            pane.maximize();
        } else if (type === 'bottom') {
            pane.element.style.left = '0';
            pane.element.style.top = '50%';
            pane.element.style.width = '100%';
            pane.element.style.height = '50%';
        }
    }
}

// Support both script tag and CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WindowManager;
} else {
    window.WindowManager = WindowManager;
}

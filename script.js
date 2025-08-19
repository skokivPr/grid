// Bookmark Manager - Vanilla JavaScript

class BookmarkManager {
    constructor() {
        this.bookmarks = this.loadBookmarks();
        this.cardSize = 220;
        this.isDarkMode = this.loadTheme();
        this.searchTerm = '';
        this.editMode = this.loadEditMode();
        this.draggedIndex = null;

        this.init();
    }

    loadTheme() {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'dark' : true; // domyślnie ciemny motyw
    }

    loadEditMode() {
        const saved = localStorage.getItem('editMode');
        return saved === 'true';
    }

    init() {
        this.setupEventListeners();
        this.setupCursorEffect();
        this.render();
        this.updateTheme();
        this.updateEditMode(); // Ustaw tryb edycji
        this.updateCardSize(this.cardSize); // Ustaw początkowy rozmiar grid
        this.checkCarrdLinks(); // Sprawdź linki carrd.co przy ładowaniu
    }

    // Sprawdź przy ładowaniu aplikacji czy są linki carrd.co i dodaj meta tagi
    checkCarrdLinks() {
        this.bookmarks.forEach(bookmark => {
            if (bookmark.url.includes('carrd.co')) {
                this.addCarrdMetaTags(bookmark.url);
            }
        });
    }

    loadBookmarks() {
        const saved = localStorage.getItem('bookmarks');
        if (saved) {
            return JSON.parse(saved);
        }

        // Domyślne zakładki
        return [
            { id: 1, title: 'Aktywacja programów', url: 'www.bonik.com.pl' },
            { id: 2, title: 'Allegro.pl - Więcej niż aukcje', url: 'allegro.pl' },
            { id: 3, title: 'APKMIRROR - LATEST ANDROID APKS', url: 'www.apkmirror.com' },
            { id: 4, title: 'Archiwum: Menedżery haseł', url: 'portable.info.pl' },
        ];
    }

    saveBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
        this.updateBookmarkCount();
    }

    updateBookmarkCount() {
        document.getElementById('bookmark-count').textContent = this.bookmarks.length;
    }

    setupEventListeners() {
        // Przycisk dodawania
        document.getElementById('add-btn').addEventListener('click', () => this.showAddModal());

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.hideAddModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.hideAddModal());
        document.getElementById('add-form').addEventListener('submit', (e) => this.handleAddBookmark(e));

        // Kliknięcie poza modalem
        document.getElementById('add-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-modal') this.hideAddModal();
        });

        // Przycisk motywu
        document.getElementById('theme-btn').addEventListener('click', () => this.toggleTheme());

        // Slider rozmiaru
        const slider = document.getElementById('card-size-slider');
        slider.addEventListener('input', (e) => this.updateCardSize(e.target.value));

        // Wyszukiwanie
        document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Inne przyciski
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAllBookmarks());
        document.getElementById('refresh-btn').addEventListener('click', () => this.refreshFavicons());
        document.getElementById('export-btn').addEventListener('click', () => this.exportBookmarks());
        document.getElementById('import-btn').addEventListener('click', () => this.importBookmarks());
        document.getElementById('file-input').addEventListener('change', (e) => this.handleFileImport(e));
        document.getElementById('sort-btn').addEventListener('click', () => this.sortBookmarks());
        document.getElementById('edit-btn').addEventListener('click', () => this.toggleEditMode());

        // Inicjalizuj dropdown sortowania
        this.initSortDropdown();

        // Skróty klawiszowe
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Listener do zmiany rozmiaru okna dla aktualizacji pustych komórek
        window.addEventListener('resize', () => this.handleResize());
    }

    // System potwierdzeń w stylu strony
    showCustomAlert(message, title = 'Informacja', type = 'info') {
        return new Promise((resolve) => {
            this.createCustomModal({
                title: title,
                message: message,
                type: type,
                buttons: [
                    {
                        text: 'OK',
                        class: 'modal-button',
                        action: () => resolve(true)
                    }
                ]
            });
        });
    }

    showCustomConfirm(message, title = 'Potwierdzenie', type = 'warning') {
        return new Promise((resolve) => {
            this.createCustomModal({
                title: title,
                message: message,
                type: type,
                buttons: [
                    {
                        text: 'Anuluj',
                        class: 'modal-button secondary',
                        action: () => resolve(false)
                    },
                    {
                        text: 'Potwierdź',
                        class: 'modal-button',
                        action: () => resolve(true)
                    }
                ]
            });
        });
    }

    createCustomModal({ title, message, type, buttons }) {
        // Usuń istniejący modal jeśli istnieje
        const existingModal = document.querySelector('.custom-confirmation-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Ikony dla różnych typów
        const icons = {
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle',
            success: 'fas fa-check-circle'
        };

        // Stwórz modal
        const modal = document.createElement('div');
        modal.className = 'modal custom-confirmation-modal show';
        modal.innerHTML = `
            <div class="modal-content confirmation-modal-content">
                <div class="modal-header">
                    <div class="modal-title-container">
                        <i class="${icons[type] || icons.info} modal-icon"></i>
                        <h2>${title}</h2>
                    </div>
                    <button class="modal-close-btn" type="button">×</button>
                </div>
                <div class="modal-body">
                    <p class="confirmation-message">${message}</p>
                </div>
                <div class="modal-actions">
                    ${buttons.map(button => `
                        <button class="${button.class}" data-action="${button.text}">
                            ${button.text}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Dodaj do body
        document.body.appendChild(modal);

        // Dodaj event listenery
        const closeBtn = modal.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            // Jeśli to confirm, zwróć false jako domyślną wartość
            if (buttons.length > 1) {
                buttons[0].action(); // Pierwsze to zawsze Anuluj
            }
        });

        // Dodaj listenery dla przycisków
        buttons.forEach((button, index) => {
            const btnElement = modal.querySelector(`[data-action="${button.text}"]`);
            if (btnElement) {
                btnElement.addEventListener('click', () => {
                    modal.remove();
                    button.action();
                });
            }
        });

        // Zamknij na ESC
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
                if (buttons.length > 1) {
                    buttons[0].action(); // Anuluj
                }
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Zamknij po kliknięciu tła
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                if (buttons.length > 1) {
                    buttons[0].action(); // Anuluj
                }
            }
        });
    }

    handleResize() {
        // Force re-render when window resizes to recalculate empty cells
        // Opóźnienie żeby CSS grid się zaktualizował
        setTimeout(() => {
            this.render();
        }, 150);
    }

    showAddModal() {
        document.getElementById('add-modal').classList.add('show');
        document.getElementById('title-input').focus();
    }

    hideAddModal() {
        document.getElementById('add-modal').classList.remove('show');
        document.getElementById('add-form').reset();
    }

    handleAddBookmark(e) {
        e.preventDefault();

        const title = document.getElementById('title-input').value.trim();
        const url = document.getElementById('url-input').value.trim();

        if (title && url) {
            const cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, "").split('/')[0];
            const newBookmark = {
                id: Date.now(),
                title: title,
                url: cleanUrl
            };

            // Sprawdź czy dodawany link to carrd.co i dodaj meta tag z unikalną ikoną
            if (newBookmark.url.includes('carrd.co')) {
                this.addCarrdMetaTags(newBookmark.url);
            }

            this.bookmarks.push(newBookmark);
            this.saveBookmarks();
            this.render();
            this.hideAddModal();
        }
    }

    async deleteBookmark(id) {
        const confirmed = await this.showCustomConfirm(
            'Czy na pewno chcesz usunąć tę zakładkę?',
            'Usuń zakładkę',
            'warning'
        );

        if (confirmed) {
            this.bookmarks = this.bookmarks.filter(b => b.id !== id);
            this.saveBookmarks();
            this.render();
        }
    }

    openBookmark(url) {
        let fullUrl = url;
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = 'https://' + fullUrl;
        }
        window.open(fullUrl, '_blank', 'noopener,noreferrer');
    }

    getFaviconUrl(url) {
        const cleanUrl = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

        // Dla carrd.co użyj prawdziwą strukturę favicon
        if (cleanUrl.includes('carrd.co')) {
            return `https://${cleanUrl}/assets/images/favicon.png`;
        }

        return `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanUrl}&size=32`;
    }

    // Obsługa błędów favicon - próbuj różne źródła
    handleFaviconError(imgElement, bookmark) {
        const attempt = parseInt(imgElement.dataset.attempt) || 1;
        const cleanUrl = bookmark.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const isCarrd = cleanUrl.includes('carrd.co');

        if (isCarrd) {
            // Specjalna logika dla carrd.co
            if (attempt === 1) {
                // Druga próba - apple-touch-icon jako fallback
                imgElement.src = `https://${cleanUrl}/assets/images/apple-touch-icon.png`;
                imgElement.dataset.attempt = "2";
            } else if (attempt === 2) {
                // Trzecia próba - nowe Google Favicons API
                imgElement.src = `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanUrl}&size=32`;
                imgElement.dataset.attempt = "3";
            } else if (attempt === 3) {
                // Czwarta próba - Yandex API
                imgElement.src = `https://favicon.yandex.net/favicon/${cleanUrl}`;
                imgElement.dataset.attempt = "4";
            } else {
                // Pokaż fallback
                this.showFaviconFallback(imgElement, bookmark);
            }
        } else {
            // Standardowa logika dla innych stron
            if (attempt === 1) {
                // Druga próba - stare Google Favicons API jako fallback
                imgElement.src = `https://www.google.com/s2/favicons?domain=${cleanUrl}&sz=32`;
                imgElement.dataset.attempt = "2";
            } else if (attempt === 2) {
                // Trzecia próba - DuckDuckGo
                imgElement.src = `https://icons.duckduckgo.com/ip3/${cleanUrl}.ico`;
                imgElement.dataset.attempt = "3";
            } else if (attempt === 3) {
                // Czwarta próba - bezpośredni favicon
                imgElement.src = `https://${cleanUrl}/favicon.ico`;
                imgElement.dataset.attempt = "4";
            } else {
                // Pokaż fallback
                this.showFaviconFallback(imgElement, bookmark);
            }
        }
    }

    showFaviconFallback(imgElement, bookmark) {
        imgElement.style.display = 'none';
        const fallbackDiv = imgElement.nextElementSibling;
        if (fallbackDiv && fallbackDiv.classList.contains('bookmark-favicon-fallback')) {
            fallbackDiv.style.display = 'flex';
        }
    }

    getFirstLetter(url) {
        try {
            const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
            return domain.charAt(0).toUpperCase();
        } catch (e) {
            return 'W';
        }
    }

    // Funkcja do dodawania meta tagów Open Graph dla carrd.co
    addCarrdMetaTags(carrdUrl) {
        // Usuń istniejące meta tagi carrd.co jeśli istnieją
        const existingMeta = document.querySelector('meta[property="og:image"][content*="carrd.co"]');
        if (existingMeta) {
            existingMeta.remove();
        }

        // Wyciągnij subdomenę z URL carrd.co (np. "linkosi" z "linkosi.carrd.co")
        let subdomain = '';
        try {
            const cleanUrl = carrdUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
            if (cleanUrl.includes('carrd.co')) {
                subdomain = cleanUrl.split('.carrd.co')[0];
            }
        } catch (e) {
            console.warn('Could not parse carrd.co URL:', carrdUrl);
            return;
        }

        if (subdomain) {
            // Dodaj meta tag Open Graph z unikalną ikoną dla tej strony carrd.co
            const metaTag = document.createElement('meta');
            metaTag.setAttribute('property', 'og:image');
            metaTag.setAttribute('content', `https://${subdomain}.carrd.co/assets/images/card.jpg?v=01aaf00f`);
            document.head.appendChild(metaTag);
        }
    }

    createBookmarkCard(bookmark, index) {
        const card = document.createElement('div');
        card.className = `info-card ${this.editMode ? 'draggable edit-mode' : ''}`;
        card.draggable = this.editMode;

        card.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-btn') && !e.target.closest('.drag-handle')) {
                this.openBookmark(bookmark.url);
            }
        });

        // Drag & Drop event listeners
        if (this.editMode) {
            card.addEventListener('dragstart', (e) => this.handleDragStart(e, index, bookmark.id));
            card.addEventListener('dragend', (e) => this.handleDragEnd(e));
            card.addEventListener('dragover', (e) => this.handleDragOver(e));
            card.addEventListener('dragenter', (e) => this.handleDragEnter(e, index));
            card.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            card.addEventListener('drop', (e) => this.handleDrop(e, index));
        }

        // Dodaj corner elementy
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        corners.forEach(corner => {
            const cornerEl = document.createElement('div');
            cornerEl.className = `corner ${corner}`;
            card.appendChild(cornerEl);
        });

        // Info card link container
        const infoCardLink = document.createElement('div');
        infoCardLink.className = 'info-card-link';

        // Favicon container
        const faviconContainer = document.createElement('div');
        faviconContainer.className = 'bookmark-favicon-container';

        const img = document.createElement('img');
        img.className = 'card-icon-img bookmark-favicon';
        img.src = this.getFaviconUrl(bookmark.url);
        img.alt = `${bookmark.url} favicon`;
        img.setAttribute('data-attempt', '1');

        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'bookmark-favicon-fallback';
        fallbackDiv.style.display = 'none';

        const fallbackSpan = document.createElement('span');
        fallbackSpan.className = 'fallback-letter';
        fallbackSpan.textContent = this.getFirstLetter(bookmark.url);
        fallbackDiv.appendChild(fallbackSpan);

        img.onerror = () => {
            this.handleFaviconError(img, bookmark);
        };

        img.onload = () => {
            fallbackDiv.style.display = 'none';
            img.style.display = 'block';
        };

        faviconContainer.appendChild(img);
        faviconContainer.appendChild(fallbackDiv);

        // Sprawdź czy to link carrd.co i dodaj meta tag z unikalną ikoną
        if (bookmark.url.includes('carrd.co')) {
            this.addCarrdMetaTags(bookmark.url);
        }

        // Title section
        const titleSection = document.createElement('div');
        titleSection.className = 'card-title-section';

        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = bookmark.title;

        const subtitle = document.createElement('div');
        subtitle.className = 'card-subtitle';
        subtitle.textContent = bookmark.url;

        titleSection.appendChild(title);
        titleSection.appendChild(subtitle);

        infoCardLink.appendChild(faviconContainer);
        infoCardLink.appendChild(titleSection);

        // Drag handle (tylko w trybie edycji)
        if (this.editMode) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.title = 'Przeciągnij aby zmienić kolejność';
            dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            card.appendChild(dragHandle);
        }

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt" style="font-size: 16px;"></i>';
        deleteBtn.title = 'Usuń zakładkę';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteBookmark(bookmark.id);
        });

        card.appendChild(infoCardLink);
        card.appendChild(deleteBtn);

        return card;
    }

    render() {
        const container = document.getElementById('bookmarks-container');
        container.innerHTML = '';

        let filteredBookmarks = this.bookmarks;

        // Filtrowanie wyszukiwania
        if (this.searchTerm) {
            filteredBookmarks = this.bookmarks.filter(bookmark =>
                bookmark.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                bookmark.url.toLowerCase().includes(this.searchTerm.toLowerCase())
            );
        }

        // Tworzenie kart
        filteredBookmarks.forEach((bookmark, index) => {
            const card = this.createBookmarkCard(bookmark, index);
            container.appendChild(card);
        });

        // Generuj puste komórki do wypełnienia grid
        const emptyCells = this.generateEmptyCells(filteredBookmarks.length);
        emptyCells.forEach(cell => {
            const emptyCard = this.createEmptyGridCell();
            container.appendChild(emptyCard);
        });

        this.updateBookmarkCount();
    }

    // Funkcja do kalkulacji liczby kolumn w grid - zintegrowana ze zmianą wielkości kart
    calculateGridColumns() {
        const container = document.getElementById('bookmarks-container');
        if (!container) return 1;

        // Spróbuj pobrać rzeczywistą liczbę kolumn z CSS grid
        const computedStyle = window.getComputedStyle(container);
        const gridColumns = computedStyle.getPropertyValue('grid-template-columns');

        if (gridColumns && gridColumns !== 'none') {
            // Policz liczbę kolumn z CSS grid-template-columns
            const columnCount = gridColumns.split(' ').length;
            console.log(`CSS Grid columns: ${columnCount}, Grid template: ${gridColumns}`);
            return columnCount;
        }

        // Fallback - oblicz na podstawie szerokości kontenera i rozmiaru kart
        const containerWidth = container.clientWidth || window.innerWidth - 64;
        const columns = Math.floor(containerWidth / this.cardSize);

        console.log(`Fallback calculation - Container width: ${containerWidth}, Card size: ${this.cardSize}, Columns: ${columns}`);

        return Math.max(1, columns);
    }

    // Generuj puste komórki do wypełnienia grid do pełnego rzędu
    generateEmptyCells(bookmarkCount) {
        if (bookmarkCount === 0) return [];

        const columns = this.calculateGridColumns();
        const cellsInCurrentRow = bookmarkCount % columns;

        // Debug info
        console.log(`Bookmarks: ${bookmarkCount}, Columns: ${columns}, Cells in current row: ${cellsInCurrentRow}`);

        // Jeśli ostatni rząd jest pełny, nie dodawaj pustych komórek
        if (cellsInCurrentRow === 0) {
            console.log('Last row is full, no empty cells needed');
            return [];
        }

        // Dodaj wszystkie puste komórki do wypełnienia ostatniego rzędu do końca
        const emptyCellsCount = columns - cellsInCurrentRow;
        console.log(`Adding ${emptyCellsCount} empty cells`);

        return Array.from({ length: emptyCellsCount }, (_, index) => ({
            id: `empty-${bookmarkCount + index}`,
            isEmpty: true
        }));
    }

    // Komponent pustej komórki grid - tylko podstawowa struktura
    createEmptyGridCell() {
        const card = document.createElement('div');
        card.className = 'info-card'; // Tylko podstawowa klasa info-card

        // Dodaj podstawowe corner elementy jak w normalnych kartach
        const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        corners.forEach(corner => {
            const cornerEl = document.createElement('div');
            cornerEl.className = `corner ${corner}`;
            card.appendChild(cornerEl);
        });

        // Pusta komórka - bez zawartości, tylko struktura
        return card;
    }

    updateCardSize(size) {
        this.cardSize = parseInt(size);
        document.getElementById('size-display').textContent = size + 'px';
        const container = document.getElementById('bookmarks-container');
        container.style.gridTemplateColumns = `repeat(auto-fill, minmax(${size}px, 1fr))`;
        container.style.setProperty('--debug-cardd-size', size);

        // Przeliczy puste komórki po zmianie rozmiaru kart
        setTimeout(() => {
            this.render();
        }, 100); // Krótkie opóźnienie żeby CSS grid się zaktualizował
    }

    handleSearch(term) {
        this.searchTerm = term;
        this.render();
    }

    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.updateTheme();
    }

    updateTheme() {
        const html = document.documentElement;
        const themeBtn = document.getElementById('theme-btn');

        if (this.isDarkMode) {
            html.setAttribute('theme', 'dark');
            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            themeBtn.title = 'Przełącz na jasny motyw';
        } else {
            html.setAttribute('theme', 'light');
            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            themeBtn.title = 'Przełącz na ciemny motyw';
        }

        localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    }

    toggleEditMode() {
        this.editMode = !this.editMode;
        this.updateEditMode();
        this.render();
    }

    updateEditMode() {
        const editBtn = document.getElementById('edit-btn');
        const container = document.getElementById('bookmarks-container');

        if (this.editMode) {
            editBtn.classList.add('active');
            editBtn.title = 'Wyłącz tryb przenoszenia (Ctrl+E)';
            container.classList.add('edit-mode');
        } else {
            editBtn.classList.remove('active');
            editBtn.title = 'Włącz tryb przenoszenia - przeciągaj karty (Ctrl+E)';
            container.classList.remove('edit-mode');
        }

        localStorage.setItem('editMode', this.editMode.toString());
    }

    async clearAllBookmarks() {
        if (this.bookmarks.length === 0) {
            await this.showCustomAlert('Brak zakładek do usunięcia!', 'Informacja', 'info');
            return;
        }

        const confirmed = await this.showCustomConfirm(
            `Czy na pewno chcesz usunąć wszystkie ${this.bookmarks.length} zakładek?\n\nTa operacja jest nieodwracalna!`,
            'Usuń wszystkie zakładki',
            'warning'
        );

        if (confirmed) {
            this.bookmarks = [];
            this.saveBookmarks();
            this.render();
            await this.showCustomAlert('Usunięto wszystkie zakładki!', 'Sukces', 'success');
        }
    }

    async refreshFavicons() {
        await this.showCustomAlert('Ikony zostaną ponownie załadowane.', 'Odświeżanie ikon', 'info');
        this.render(); // Re-render wszystkich kart
    }

    exportBookmarks() {
        const fileContent = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
${this.bookmarks.map(b => `    <DT><A HREF="https://${b.url}">${b.title}</A>`).join('\n')}
</DL><p>`;

        const blob = new Blob([fileContent], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'bookmarks.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    importBookmarks() {
        document.getElementById('file-input').click();
    }

    async handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, "text/html");
            const links = doc.querySelectorAll('a');

            let imported = 0;
            let maxId = this.bookmarks.length > 0 ? Math.max(...this.bookmarks.map(b => b.id)) : 0;

            links.forEach(link => {
                try {
                    const url = new URL(link.href).hostname.replace('www.', '');
                    const title = link.textContent.trim();

                    if (url && title && !this.bookmarks.some(b => b.url === url)) {
                        this.bookmarks.push({
                            id: ++maxId,
                            title: title,
                            url: url
                        });
                        imported++;
                    }
                } catch (e) {
                    console.warn("Could not parse bookmark link:", link.href);
                }
            });

            if (imported > 0) {
                // Sprawdź czy wśród importowanych zakładek są linki carrd.co i dodaj meta tagi
                this.bookmarks.forEach(bookmark => {
                    if (bookmark.url.includes('carrd.co')) {
                        this.addCarrdMetaTags(bookmark.url);
                    }
                });

                this.saveBookmarks();
                this.render();
                await this.showCustomAlert(`Zaimportowano ${imported} zakładek!`, 'Import zakończony', 'success');
            } else {
                await this.showCustomAlert('Nie znaleziono nowych zakładek do zaimportowania.', 'Import', 'info');
            }
        };

        reader.readAsText(file);
        event.target.value = null;
    }

    sortBookmarks() {
        const dropdown = document.querySelector('.sort-dropdown-content');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    initSortDropdown() {
        const sortOptions = [
            { key: 'title-asc', label: 'Tytuł A-Z', icon: 'fas fa-sort-alpha-down' },
            { key: 'title-desc', label: 'Tytuł Z-A', icon: 'fas fa-sort-alpha-up' },
            { key: 'url-asc', label: 'URL A-Z', icon: 'fas fa-link' },
            { key: 'url-desc', label: 'URL Z-A', icon: 'fas fa-link' },
            { key: 'default', label: 'Domyślna', icon: 'fas fa-undo' }
        ];

        // Znajdź przycisk sortowania i dodaj dropdown
        const sortBtn = document.getElementById('sort-btn');
        if (sortBtn && !document.querySelector('.sort-dropdown-content')) {
            // Zamień przycisk w dropdown container
            sortBtn.classList.add('sort-dropdown');
            sortBtn.innerHTML = `
                <button class="sort-dropdown-button" title="Sortowanie">
                    <i class="fas fa-sort" style="font-size: 16px;"></i>
                </button>
                <div class="sort-dropdown-content">
                    ${sortOptions.map(option => `
                        <div class="sort-option" data-sort="${option.key}">
                            <i class="${option.icon}"></i>
                            ${option.label}
                        </div>
                    `).join('')}
                </div>
            `;

            // Dodaj event listenery
            const dropdownBtn = sortBtn.querySelector('.sort-dropdown-button');
            const dropdownContent = sortBtn.querySelector('.sort-dropdown-content');

            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownContent.classList.toggle('show');
            });

            // Dodaj listenery dla opcji sortowania
            sortOptions.forEach(option => {
                const optionElement = dropdownContent.querySelector(`[data-sort="${option.key}"]`);
                if (optionElement) {
                    optionElement.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.applySorting(option.key);
                        dropdownContent.classList.remove('show');

                        // Oznacz aktywną opcję
                        dropdownContent.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
                        optionElement.classList.add('active');
                    });
                }
            });

            // Zamknij dropdown po kliknięciu poza nim
            document.addEventListener('click', (e) => {
                if (!sortBtn.contains(e.target)) {
                    dropdownContent.classList.remove('show');
                }
            });
        }
    }

    applySorting(sortKey) {
        switch (sortKey) {
            case 'title-asc':
                this.bookmarks.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
                break;
            case 'title-desc':
                this.bookmarks.sort((a, b) => b.title.toLowerCase().localeCompare(a.title.toLowerCase()));
                break;
            case 'url-asc':
                this.bookmarks.sort((a, b) => a.url.toLowerCase().localeCompare(b.url.toLowerCase()));
                break;
            case 'url-desc':
                this.bookmarks.sort((a, b) => b.url.toLowerCase().localeCompare(a.url.toLowerCase()));
                break;
            case 'default':
                this.bookmarks.sort((a, b) => a.id - b.id);
                break;
        }

        this.saveBookmarks();
        this.render();
    }

    handleKeyboard(e) {
        // Ctrl+Shift+Delete - usuń wszystkie
        if (e.ctrlKey && e.shiftKey && e.key === 'Delete') {
            e.preventDefault();
            this.clearAllBookmarks();
        }

        // Ctrl+N - nowa zakładka
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.showAddModal();
        }

        // Ctrl+E - tryb edycji
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            this.toggleEditMode();
        }

        // Escape - zamknij modal
        if (e.key === 'Escape') {
            this.hideAddModal();
        }
    }

    // Drag & Drop functions
    handleDragStart(e, index, bookmarkId) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        e.dataTransfer.setDragImage(e.target, e.target.offsetWidth / 2, e.target.offsetHeight / 2);
        this.draggedIndex = index;
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        this.draggedIndex = null;
        // Usuń wszystkie drag-over klasy
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e, targetIndex) {
        e.preventDefault();
        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
            e.target.closest('.info-card')?.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.target.closest('.info-card')?.classList.remove('drag-over');
    }

    handleDrop(e, targetIndex) {
        e.preventDefault();
        e.target.closest('.info-card')?.classList.remove('drag-over');

        if (this.draggedIndex !== null && this.draggedIndex !== targetIndex) {
            // Pobierz aktualną listę zakładek
            let filteredBookmarks = this.bookmarks;
            if (this.searchTerm) {
                filteredBookmarks = this.bookmarks.filter(bookmark =>
                    bookmark.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                    bookmark.url.toLowerCase().includes(this.searchTerm.toLowerCase())
                );
            }

            const newBookmarks = [...filteredBookmarks];
            const draggedBookmark = newBookmarks[this.draggedIndex];

            // Usuń element z oryginalnej pozycji
            newBookmarks.splice(this.draggedIndex, 1);

            // Wstaw element na nowej pozycji
            const adjustedTargetIndex = this.draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newBookmarks.splice(adjustedTargetIndex, 0, draggedBookmark);

            // Zaktualizuj główną listę zakładek
            this.bookmarks = newBookmarks;
            this.saveBookmarks();
            this.render();
        }

        this.draggedIndex = null;
    }

    setupCursorEffect() {
        const cursorPosition = document.querySelector('.grid-lines_cursor-position');
        const cursor = document.querySelector('.grid-lines_cursor');

        if (cursorPosition && cursor) {
            let mouseX = 0;
            let mouseY = 0;
            let cursorX = 0;
            let cursorY = 0;

            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });

            const animateCursor = () => {
                const speed = 0.1;
                cursorX += (mouseX - cursorX) * speed;
                cursorY += (mouseY - cursorY) * speed;
                cursorPosition.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
                requestAnimationFrame(animateCursor);
            };

            animateCursor();

            document.addEventListener('mouseleave', () => {
                cursor.style.opacity = '0';
            });

            document.addEventListener('mouseenter', () => {
                cursor.style.opacity = '1';
            });
        }
    }
}

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicjalizacja Bookmark Manager...');
    window.bookmarkManager = new BookmarkManager();
    console.log('✅ Bookmark Manager załadowany!');
});

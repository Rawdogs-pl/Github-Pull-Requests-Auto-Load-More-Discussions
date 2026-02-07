let autoLoadMoreEnabled = false;
let observer = null;
let isHidingInProgress = false;
const DOM_UPDATE_DELAY_MS = 400;

// --- AUTO LOAD MORE (ZOPTYMALIZOWANY) ---
function clickLoadMoreButtons() {
    const buttons = document.querySelectorAll('button.ajax-pagination-btn');
    buttons.forEach(button => { 
        // Klikamy tylko jeśli przycisk nie jest w trakcie ładowania (GitHub dodaje atrybut disabled)
        if (!button.disabled) {
            button.click();
        }
    });
}

function startAutoLoadMore() {
    if (observer) observer.disconnect();
    
    // Używamy debounce, aby nie wywoływać kliknięć tysiąc razy na sekundę
    let debounceTimer;
    observer = new MutationObserver((mutations) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            clickLoadMoreButtons();
        }, 500); // Sprawdzaj przyciski max raz na 500ms po zmianach w DOM
    });

    // Celujemy w kontener dyskusji zamiast w cały body, żeby było lżej
    const targetNode = document.querySelector('.js-discussion') || document.body;
    observer.observe(targetNode, { childList: true, subtree: true });
    clickLoadMoreButtons();
}

function stopAutoLoadMore() { 
    if (observer) { 
        observer.disconnect(); 
        observer = null; 
    } 
}

// --- RESOLVE ALL ---
function resolveAllDiscussions() {
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Resolve conversation')) {
            btn.click();
        }
    });
}

// --- LOGIKA HIDE (TWOJA WERSJA Z POPRAWKĄ NA TIMELINEITEM) ---

function isSafeToHide(menuBtn) {
    // 1. Wyjdź w górę do kontenera sekcji/wątku
    const container = menuBtn.closest('.js-timeline-progressive-focus-container');

    if (container) {
        // 2. Wyszukaj wgłąb czy jest jakikolwiek tekst "Resolve conversation"
        // innerText zbiera tekst z przycisków i ich spanów
        if (container.innerText.includes('Resolve conversation')) {
            console.log("⏭️ POMIJAM: W kontenerze znaleziono aktywną dyskusję.");
            return false;
        }
    }

    // Dodatkowe zabezpieczenie: Pomiń główny opis PR
    if (menuBtn.closest('.js-command-palette-pull-body')) return false;

    return true; // Można ukrywać
}

async function setAsHidden() {
    if (isHidingInProgress) return;
    isHidingInProgress = true;

    // Pobierz wszystkie przyciski menu "..."
    const allButtons = document.querySelectorAll('.timeline-comment-action.Link--secondary.Button--link, summary.timeline-comment-action');
    
    // Filtrowanie
    const buttonsToProcess = Array.from(allButtons).filter(btn => {
        // Pomiń już ukryte
        if (btn.closest('.minimized-comment')) return false;
        // Sprawdź Twój warunek tekstowy w kontenerze
        return isSafeToHide(btn);
    });

    console.log(`🔍 Zidentyfikowano ${buttonsToProcess.length} komentarzy do ukrycia.`);

    for (let i = 0; i < buttonsToProcess.length; i++) {
        const btn = buttonsToProcess[i];
        const commentBox = btn.closest('.timeline-comment, .js-comment-container');
        if (!commentBox) continue;
        
        console.log(`👉 Ukrywanie ${i + 1}/${buttonsToProcess.length}`);
        
        btn.click(); // Otwórz menu

        // Czekaj na przycisk "Hide"
        const hideBtn = await new Promise(res => {
            let attempts = 0;
            const check = setInterval(() => {
                const found = commentBox.querySelector('.js-comment-hide-button');
                if (found || attempts > 10) {
                    clearInterval(check);
                    res(found);
                }
                attempts++;
            }, 100);
        });

        if (hideBtn) {
            hideBtn.click();

            // Czekaj na formularz
            const form = await new Promise(res => {
                let attempts = 0;
                const check = setInterval(() => {
                    const f = commentBox.querySelector('form[action*="minimize"]');
                    if (f || attempts > 10) {
                        clearInterval(check);
                        res(f);
                    }
                    attempts++;
                }, 100);
            });

            if (form) {
                const select = form.querySelector('select[name="classifier"]');
                if (select) {
                    select.value = "OUTDATED";
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    await new Promise(r => setTimeout(r, 150));
                    form.requestSubmit();
                }
            }
        } else {
            // Zamknij menu jeśli nie znaleziono Hide
            const details = btn.closest('details');
            if (details && details.open) btn.click();
        }

        await new Promise(r => setTimeout(r, DOM_UPDATE_DELAY_MS));
    }

    console.log("✅ Koniec operacji.");
    isHidingInProgress = false;
}

// --- PANEL STEROWANIA ---
function createControlPanel() {
    if (document.getElementById('github-pr-control-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'github-pr-control-panel';
    panel.innerHTML = `
        <h3>PR Discussions</h3>
        <div class="control-item"><span>Auto Load</span><button class="toggle-switch" id="auto-load-toggle"></button></div>
        <div class="control-item"><button id="resolve-all-btn">Resolve All</button></div>
        <div class="control-item"><button id="set-hidden-btn">Set as Hidden</button></div>
    `;
    document.body.appendChild(panel);

    const toggle = document.getElementById('auto-load-toggle');
    
    chrome.storage.local.get(['autoLoadMoreEnabled'], (res) => {
        autoLoadMoreEnabled = res.autoLoadMoreEnabled || false;
        if (autoLoadMoreEnabled) toggle.classList.add('active');
        if (autoLoadMoreEnabled) startAutoLoadMore();
    });

    toggle.addEventListener('click', () => {
        autoLoadMoreEnabled = !autoLoadMoreEnabled;
        chrome.storage.local.set({ autoLoadMoreEnabled });
        toggle.classList.toggle('active', autoLoadMoreEnabled);
        autoLoadMoreEnabled ? startAutoLoadMore() : stopAutoLoadMore();
    });

    document.getElementById('resolve-all-btn').addEventListener('click', resolveAllDiscussions);
    document.getElementById('set-hidden-btn').addEventListener('click', setAsHidden);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createControlPanel);
} else {
    createControlPanel();
}

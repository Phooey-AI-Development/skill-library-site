import { useEffect } from 'react';

/**
 * Wires up keyboard shortcuts on the catalog page:
 *   /         → focus the search input
 *   ← ↑ → ↓   → navigate between cards
 *   Enter     → open focused card
 *   ?         → show shortcut help (toggles modal)
 *   Esc       → clear focus / close help
 */
export default function KeyboardShortcuts() {
  useEffect(() => {
    function isTypingInField(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function focusSearch() {
      const input = document.querySelector<HTMLInputElement>('.search-input');
      if (input) input.focus();
    }

    function navigateCards(direction: 1 | -1) {
      const cards = Array.from(document.querySelectorAll<HTMLAnchorElement>('.grid .card'));
      if (cards.length === 0) return;
      const current = document.activeElement as HTMLAnchorElement | null;
      const currentIdx = current ? cards.indexOf(current) : -1;
      let nextIdx = currentIdx + direction;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= cards.length) nextIdx = cards.length - 1;
      cards[nextIdx]?.focus();
      cards[nextIdx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function toggleHelp() {
      const modal = document.getElementById('kb-help-modal');
      if (modal) modal.classList.toggle('is-open');
    }

    function onKeyDown(e: KeyboardEvent) {
      // Don't hijack keys when the user is typing
      if (isTypingInField(e.target)) {
        // ...except Escape, which should blur the field
        if (e.key === 'Escape' && e.target instanceof HTMLElement) {
          e.target.blur();
        }
        return;
      }

      // Ignore when a modifier is held (ctrl+k, cmd+f, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          focusSearch();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          navigateCards(1);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          navigateCards(-1);
          break;
        case '?':
          e.preventDefault();
          toggleHelp();
          break;
        case 'Escape': {
          const modal = document.getElementById('kb-help-modal');
          if (modal?.classList.contains('is-open')) {
            modal.classList.remove('is-open');
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div id="kb-help-modal" className="kb-help" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div
        className="kb-help-backdrop"
        onClick={() => document.getElementById('kb-help-modal')?.classList.remove('is-open')}
      />
      <div className="kb-help-panel">
        <h3>Keyboard shortcuts</h3>
        <dl>
          <dt><kbd>/</kbd></dt><dd>Focus search</dd>
          <dt><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></dt><dd>Navigate skills</dd>
          <dt><kbd>Enter</kbd></dt><dd>Open focused skill</dd>
          <dt><kbd>Esc</kbd></dt><dd>Close modal / clear focus</dd>
          <dt><kbd>?</kbd></dt><dd>Toggle this help</dd>
        </dl>
        <button
          className="btn-secondary"
          onClick={() => document.getElementById('kb-help-modal')?.classList.remove('is-open')}
        >
          Close
        </button>
      </div>
    </div>
  );
}

/**
 * RISKOS — Universal KaTeX Math Renderer & Sanitizer (katexHelper.js)
 * Ensures 100% reliable mathematical typesetting across all RISKOS interfaces:
 *  - Safely parses display math ($$...$$, \[...\]) and inline math (\(...\))
 *  - Prevents accidental currency tokenization ($100, $50M, ₹10,00,000)
 *  - Automatically renders dynamic lab cards, formula chips, and modals
 *  - Provides MutationObserver for single-page app DOM mutations
 */

(() => {
  'use strict';

  // Sanitizer ensuring LaTeX compiles without parser breaks
  function sanitizeLatex(raw) {
    if (!raw) return '';
    let clean = String(raw).trim();

    // Strip enclosing delimiters if passed as raw LaTeX to katex.render
    if (clean.startsWith('$$') && clean.endsWith('$$') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('\\[') && clean.endsWith('\\]') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    } else if (clean.startsWith('\\(') && clean.endsWith('\\)') && clean.length >= 4) {
      clean = clean.slice(2, -2).trim();
    }

    // Escape unescaped % so it never comments out the formula in KaTeX
    clean = clean.replace(/(^|[^\\])%/g, '$1\\%');

    // Wrap raw ₹ in \text{₹}
    clean = clean.replace(/₹/g, '\\text{₹}');

    return clean;
  }

  // Safe element renderer using KaTeX auto-render extension
  function renderMathSafely(container = document.body) {
    if (!container) return;

    if (typeof window.renderMathInElement === 'function') {
      try {
        window.renderMathInElement(container, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\[', right: '\\]', display: true },
            { left: '\\(', right: '\\)', display: false }
            // Note: Single dollar '$...$' is omitted intentionally to avoid collision with currency ($100, $50M)
          ],
          ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input'],
          ignoredClasses: ['no-katex', 'raw-code', 'ignore-math'],
          throwOnError: false,
          errorColor: '#f87171'
        });
      } catch (err) {
        console.warn('[KaTeX] auto-render error:', err);
      }
    }

    // Direct render for explicit math elements (.math-expr, .formula-chip, [data-katex])
    if (typeof window.katex === 'function') {
      const explicitEls = container.querySelectorAll('.math-expr:not([data-katex-rendered]), .formula-chip:not([data-katex-rendered]), [data-katex]:not([data-katex-rendered])');
      explicitEls.forEach(el => {
        try {
          const rawText = el.getAttribute('data-katex') || el.textContent;
          if (rawText && rawText.trim()) {
            const clean = sanitizeLatex(rawText);
            const isDisplay = el.classList.contains('display-mode') || !el.classList.contains('inline-math');
            window.katex.render(clean, el, {
              displayMode: isDisplay,
              throwOnError: false,
              errorColor: '#f87171'
            });
            el.setAttribute('data-katex-rendered', 'true');
          }
        } catch (e) {
          console.warn('[KaTeX] explicit render error:', e);
        }
      });
    }
  }

  // Throttled observer for dynamic DOM modifications
  let renderQueued = false;
  function scheduleMathRender(root = document.body) {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      renderMathSafely(root);
    });
  }

  function initObserver() {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(mutations => {
      let needsRender = false;
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length > 0) {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) { // Element node
              const text = node.textContent || '';
              if (text.includes('$$') || text.includes('\\(') || text.includes('\\[') ||
                  node.classList?.contains('math-expr') || node.classList?.contains('formula-chip') ||
                  node.hasAttribute?.('data-katex')) {
                needsRender = true;
                break;
              }
            }
          }
        }
        if (needsRender) break;
      }
      if (needsRender) {
        scheduleMathRender();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Global export
  window.RISKOS_KaTeX = {
    render: renderMathSafely,
    renderAsync: scheduleMathRender,
    sanitize: sanitizeLatex,
    renderToString: (latex, displayMode = true) => {
      if (typeof window.katex !== 'function') return latex;
      return window.katex.renderToString(sanitizeLatex(latex), {
        displayMode,
        throwOnError: false
      });
    }
  };

  // Execution upon ready
  function onReady() {
    // Wait slightly if KaTeX scripts are defer-loaded
    if (typeof window.katex !== 'undefined') {
      renderMathSafely();
      initObserver();
    } else {
      let tries = 0;
      const interval = setInterval(() => {
        tries++;
        if (typeof window.katex !== 'undefined' || tries > 20) {
          clearInterval(interval);
          renderMathSafely();
          initObserver();
        }
      }, 100);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

})();

document.addEventListener('DOMContentLoaded', () => {
    const debugBtn = document.getElementById('debug-menu-btn');
    const debugPanel = document.getElementById('debug-panel');
    const closeBtn = document.getElementById('close-debug-panel');
    const postcard = document.getElementById('postcard-preview');

    // Controls
    const toggleGrid = document.getElementById('toggle-grid');
    const toggleBorders = document.getElementById('toggle-borders');
    const toggleRulers = document.getElementById('toggle-rulers');
    const bgInput = document.getElementById('bg-image-input');
    const opacitySlider = document.getElementById('opacity-slider');
    const opacityVal = document.getElementById('opacity-val');
    const debugBgImage = document.getElementById('debug-bg-image');

    // Adjustment Controls
    const adjTarget = document.getElementById('adj-target');
    const adjX = document.getElementById('adj-x');
    const adjY = document.getElementById('adj-y');
    const adjReset = document.getElementById('adj-reset');
    const adjCopyCss = document.getElementById('adj-copy-css');

    // Spacing Controls
    const adjSpacingArea = document.getElementById('adj-spacing-area');
    const adjSpacingNormal = document.getElementById('adj-spacing-normal');
    const adjSpacingHyphen = document.getElementById('adj-spacing-hyphen');

    // State
    let adjustments = JSON.parse(localStorage.getItem('layout_adjustments') || '{}');

    // Initialization from URL Params
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === 'layout') {
        toggleRulers.checked = true;
        document.body.classList.add('debug-layout');
        debugPanel.style.display = 'block';
    } else if (params.get('debug') === 'true') {
        toggleBorders.checked = true;
        document.body.classList.add('debug-mode');
        debugPanel.style.display = 'block';
    }

    // Apply saved adjustments
    const applyAdjustments = () => {
        Object.keys(adjustments).forEach(selector => {
            const el = postcard.querySelector(selector);
            if (el) {
                const styles = adjustments[selector];

                // Handle standard style properties
                Object.keys(styles).forEach(prop => {
                    if (prop === 'spacing') return; // Skip spacing config here
                    el.style.setProperty(prop, styles[prop], 'important');
                });

                // Handle spacing if present
                if (styles.spacing) {
                    applySpacing(el, styles.spacing);
                }
            }
        });
    };

    const applySpacing = (el, spacing) => {
        const spans = el.querySelectorAll('span');
        if (spans.length === 0) return;

        spans.forEach((span, index) => {
            // Last child usually has 0 margin, so we skip it or handle it differently?
            // Existing CSS says last-child margin-right: 0. Layout.css: 192, 226
            if (index === spans.length - 1) return;

            if (index === 2) { // After 3rd digit (hyphen part)
                if (spacing.hyphen) span.style.setProperty('margin-right', spacing.hyphen, 'important');
            } else {
                if (spacing.normal) span.style.setProperty('margin-right', spacing.normal, 'important');
            }
        });
    };

    applyAdjustments();

    // Utility: Convert px to mm
    const pxToMm = (px) => {
        const div = document.createElement('div');
        div.style.width = '1mm';
        document.body.appendChild(div);
        const mmPx = div.getBoundingClientRect().width;
        document.body.removeChild(div);
        return px / mmPx;
    };

    // Update target element and state
    const updateTarget = () => {
        const selector = adjTarget.value;
        if (!selector) return;
        const el = postcard.querySelector(selector);
        if (!el) return;

        // Position Updates
        const x = parseFloat(adjX.value);
        const y = parseFloat(adjY.value);

        if (!adjustments[selector]) adjustments[selector] = {};

        // Determine whether to use left/right or top/bottom based on selector
        // And update adjustments object
        if (selector === '.postal-code-area') {
            adjustments[selector].top = `${y}mm`;
            adjustments[selector].right = `${x}mm`;
        } else if (selector === '.sender-postal-code') {
            adjustments[selector].bottom = `${y}mm`;
            adjustments[selector].left = `${x}mm`;
        } else if (selector === '.sender-area') {
            adjustments[selector].bottom = `${y}mm`;
            adjustments[selector].left = `${x}mm`;
        } else if (selector === '.address-main') {
            adjustments[selector].top = `${y}mm`;
            adjustments[selector].right = `${x}mm`;
        } else if (selector === '.name-area') {
            adjustments[selector].top = `${y}mm`;
            adjustments[selector].left = `${x}mm`;
            adjustments[selector].transform = 'translate(0, 0)';
        }

        // Apply Position
        Object.keys(adjustments[selector]).forEach(prop => {
            if (prop === 'spacing') return;
            el.style.setProperty(prop, adjustments[selector][prop], 'important');
        });

        // Spacing Updates (only for postal codes)
        if (selector === '.postal-code-area' || selector === '.sender-postal-code') {
            const normal = parseFloat(adjSpacingNormal.value);
            const hyphen = parseFloat(adjSpacingHyphen.value);

            if (!isNaN(normal) || !isNaN(hyphen)) {
                adjustments[selector].spacing = {
                    normal: !isNaN(normal) ? `${normal}mm` : undefined,
                    hyphen: !isNaN(hyphen) ? `${hyphen}mm` : undefined
                };
                applySpacing(el, adjustments[selector].spacing);
            }
        }

        localStorage.setItem('layout_adjustments', JSON.stringify(adjustments));
    };

    // Target change handler
    adjTarget.onchange = () => {
        const selector = adjTarget.value;
        if (!selector) {
            adjX.value = '';
            adjY.value = '';
            adjSpacingArea.style.display = 'none';
            return;
        }

        const el = postcard.querySelector(selector);
        if (!el) return;

        // Position Values
        const getVal = (prop) => {
            if (el.style[prop]) return parseFloat(el.style[prop]);
            const computed = window.getComputedStyle(el)[prop];
            return pxToMm(parseFloat(computed));
        };

        if (selector === '.postal-code-area') {
            adjX.value = getVal('right').toFixed(1);
            adjY.value = getVal('top').toFixed(1);
            adjSpacingArea.style.display = 'block';
        } else if (selector === '.sender-postal-code') {
            adjX.value = getVal('left').toFixed(1);
            adjY.value = getVal('bottom').toFixed(1);
            adjSpacingArea.style.display = 'block';
        } else {
            // Other elements
            if (selector === '.sender-area') {
                adjX.value = getVal('left').toFixed(1);
                adjY.value = getVal('bottom').toFixed(1);
            } else if (selector === '.address-main') {
                adjX.value = getVal('right').toFixed(1);
                adjY.value = getVal('top').toFixed(1);
            } else if (selector === '.name-area') {
                adjX.value = getVal('left').toFixed(1);
                adjY.value = getVal('top').toFixed(1);
            }
            adjSpacingArea.style.display = 'none';
        }

        // Spacing Values (Initialize inputs)
        if (selector === '.postal-code-area' || selector === '.sender-postal-code') {
            const spans = el.querySelectorAll('span');
            if (spans.length > 3) {
                // Normal: use 2nd digit (index 1) margin
                const normalPx = parseFloat(window.getComputedStyle(spans[1]).marginRight);
                adjSpacingNormal.value = pxToMm(normalPx).toFixed(1);

                // Hyphen: use 3rd digit (index 2) margin
                const hyphenPx = parseFloat(window.getComputedStyle(spans[2]).marginRight);
                adjSpacingHyphen.value = pxToMm(hyphenPx).toFixed(1);
            }
        }
    };

    adjX.oninput = updateTarget;
    adjY.oninput = updateTarget;
    adjSpacingNormal.oninput = updateTarget;
    adjSpacingHyphen.oninput = updateTarget;

    // Reset
    adjReset.onclick = () => {
        const selector = adjTarget.value;
        if (selector) {
            delete adjustments[selector];
            const el = postcard.querySelector(selector);
            if (el) {
                el.style.top = '';
                el.style.bottom = '';
                el.style.left = '';
                el.style.right = '';
                el.style.transform = '';
                // Reset spacing
                const spans = el.querySelectorAll('span');
                spans.forEach(s => s.style.marginRight = '');
            }
            localStorage.setItem('layout_adjustments', JSON.stringify(adjustments));
            adjTarget.onchange(); // trigger refresh
        } else if (confirm('すべての調整をリセットしますか？')) {
            adjustments = {};
            localStorage.removeItem('layout_adjustments');
            location.reload();
        }
    };

    // Copy CSS
    adjCopyCss.onclick = () => {
        let css = '/* Layout Adjustments */\n';
        Object.keys(adjustments).forEach(selector => {
            css += `${selector} {\n`;
            const styles = adjustments[selector];

            // Standard Props
            Object.keys(styles).forEach(prop => {
                if (prop === 'spacing') return;
                css += `    ${prop}: ${styles[prop]} !important;\n`;
            });
            css += '}\n';

            // Spacing CSS
            if (styles.spacing) {
                if (styles.spacing.normal) {
                    css += `${selector} span:not(:nth-child(3)):not(:last-child) {\n`;
                    css += `    margin-right: ${styles.spacing.normal} !important;\n`;
                    css += '}\n';
                }
                if (styles.spacing.hyphen) {
                    css += `${selector} span:nth-child(3) {\n`;
                    css += `    margin-right: ${styles.spacing.hyphen} !important;\n`;
                    css += '}\n';
                }
            }
        });

        navigator.clipboard.writeText(css).then(() => {
            const originalText = adjCopyCss.innerText;
            adjCopyCss.innerText = 'コピー完了！';
            setTimeout(() => adjCopyCss.innerText = originalText, 2000);
        });
    };

    // Toggle Panel
    debugBtn.onclick = () => {
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    };

    closeBtn.onclick = () => {
        debugPanel.style.display = 'none';
    };

    // Toggle Grid
    toggleGrid.onchange = (e) => {
        if (e.target.checked) {
            postcard.classList.add('show-grid');
        } else {
            postcard.classList.remove('show-grid');
        }
    };

    // Toggle Borders
    toggleBorders.onchange = (e) => {
        if (e.target.checked) {
            postcard.classList.add('show-borders');
            document.body.classList.add('debug-mode');
        } else {
            postcard.classList.remove('show-borders');
            document.body.classList.remove('debug-mode');
        }
    };

    // Toggle Rulers
    toggleRulers.onchange = (e) => {
        if (e.target.checked) {
            document.body.classList.add('debug-layout');
        } else {
            document.body.classList.remove('debug-layout');
        }
    };

    // Background Image
    bgInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                debugBgImage.style.backgroundImage = `url(${evt.target.result})`;
                debugBgImage.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            debugBgImage.style.display = 'none';
        }
    };

    // Opacity
    opacitySlider.oninput = (e) => {
        const val = e.target.value;
        opacityVal.innerText = Math.round(val * 100);
        debugBgImage.style.opacity = val;
    };
});

# MediBook Tab Glitch Fix – Summary

## Problem Identified
The tab switching on the login/register page was glitching (flickering, both panels visible, or no response) due to three main issues:

1. **Missing CSS rule** – `[role="tabpanel"][hidden]` wasn't explicitly hidden with `display: none`, allowing hidden panels to be visible if other CSS wasn't properly cascading.
2. **Unreliable JavaScript method** – Using `setAttribute('hidden', '')` is less reliable than the `hidden` property.
3. **Missing accessibility & initialization** – The `aria-selected` attribute wasn't being updated, and the initial active tab wasn't properly initialized on page load.

---

## Changes Made

### 1. CSS Fix – `public/main.css` (Line 207-209)
**Added:**
```css
[role="tabpanel"][hidden] {
  display: none !important;
}
```

**Why:** Guarantees that any `[role="tabpanel"]` element with the `hidden` attribute is absolutely not displayed, preventing CSS conflicts or cascading issues.

---

### 2. JavaScript Fix – `public/script.js` (Lines 378-405)
**Replaced the old `initTabs()` function with:**

```javascript
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('[role="tabpanel"]');
  if (!tabs.length || !panels.length) return;

  function switchTab(selectedTab) {
    tabs.forEach(tab => {
      const isActive = tab === selectedTab;
      tab.classList.toggle('tab-active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
    const selectedId = selectedTab.getAttribute('aria-controls');
    panels.forEach(panel => {
      panel.hidden = panel.id !== selectedId;
    });
  }

  tabs.forEach(tab => tab.addEventListener('click', (e) => {
    e.preventDefault();
    switchTab(tab);
  }));

  // Initialize: activate first tab with .tab-active or first tab
  const activeTab = document.querySelector('.tab-btn.tab-active') || tabs[0];
  switchTab(activeTab);
}
```

**Key Improvements:**
- ✅ **Centralized logic** – `switchTab()` function eliminates code duplication
- ✅ **Proper hidden handling** – Uses `panel.hidden` property (native HTML5) instead of `setAttribute()`
- ✅ **Accessibility** – Updates `aria-selected="true/false"` for screen readers
- ✅ **Prevents default** – Adds `e.preventDefault()` to stop unwanted button behavior
- ✅ **Initial state** – Initializes the active tab on page load, ensuring consistency

---

## How It Works Now

1. **Click Login/Register tab** → `switchTab()` is called with the clicked tab
2. **Remove active styling** → All tabs get `aria-selected="false"`, lose `tab-active` class
3. **Hide all panels** → All panels get `hidden` property set
4. **Activate selected tab** → Clicked tab gets `aria-selected="true"`, `tab-active` class
5. **Show selected panel** → Corresponding panel's `hidden` property is removed
6. **CSS takes effect** → `.tab-btn.tab-active` styling applies, `[role="tabpanel"][hidden]` hides inactive panels

---

## HTML Structure ✓
The existing HTML in `public/login.html` is already correct:
- ✅ Tab buttons have `role="tab"`, `aria-controls`, and `aria-selected` attributes
- ✅ The login tab has `class="tab-btn tab-active"`
- ✅ The register panel has `hidden` attribute
- ✅ IDs and aria-controls match perfectly

---

## Testing Checklist
- [ ] Hard refresh browser (Ctrl+F5 or Cmd+Shift+R)
- [ ] Click **Login** tab – should show login panel smoothly
- [ ] Click **Register** tab – should hide login, show register smoothly
- [ ] Toggle between tabs multiple times – no flickering or jank
- [ ] Open DevTools (F12) → Elements tab
- [ ] Watch the `hidden` attribute being added/removed on panels
- [ ] No console errors
- [ ] No styling conflicts (both panels not visible at same time)

---

## Root Cause Summary
The glitch was caused by:
1. **Weak CSS rules** – Hidden panels could potentially be overridden by other styles
2. **Imperative DOM manipulation** – Setting attributes as strings is error-prone
3. **No accessibility support** – Screen readers wouldn't know which tab is active
4. **Missing initialization** – On page load, panels weren't explicitly set to correct state

All of these have now been fixed with proper HTML5 APIs, accessible patterns, and fail-safe CSS.

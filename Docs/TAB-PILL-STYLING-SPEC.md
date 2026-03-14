# TAB PILL STYLING SPEC — SankalpHub
> Claude Code Instruction File  
> Purpose: Implement consistent tab/pill navigation styling across all tab groups in the project, with full responsiveness for Laptop, iPad/Tablet, and Phone.

---

## 1. VISUAL REFERENCE SUMMARY

Three tab styles observed from screenshots:

| Variant | Active BG | Active Text | Inactive BG | Usage Context |
|---------|-----------|-------------|-------------|---------------|
| **Gold/Tan** | `#C9A96E` | `#1a1a1a` (dark) | `#FFFFFF` | Message angle tabs (One-liner, Pain-focused, ROI angle…) |
| **Dark/Black** | `#1C1C1E` | `#C9A96E` (gold) | `#FFFFFF` | Channel tabs (LinkedIn, WhatsApp, Trade Event…) |
| **Purple** | `#7C3AED` | `#FFFFFF` | `#FFFFFF` | Timeline/Week tabs (Week 1–2, Week 3–4…) |

All variants share:
- Rounded pill shape (`border-radius: 12px`)
- Subtle card-style shadow on inactive tabs
- Light grey page/container background (`#F2F2F7`)
- Horizontal scroll on overflow (mobile)
- Emoji support inside tab labels

---

## 2. CSS VARIABLES — ADD TO `globals.css` or `:root`

```css
:root {
  /* Tab Pill — Shared */
  --tab-bg-inactive: #FFFFFF;
  --tab-border-inactive: #E5E7EB;
  --tab-text-inactive: #3A3A3C;
  --tab-shadow-inactive: 0 1px 4px rgba(0, 0, 0, 0.08);
  --tab-radius: 12px;
  --tab-font-weight-active: 700;
  --tab-font-weight-inactive: 500;
  --tab-container-bg: #F2F2F7;
  --tab-transition: all 0.18s ease;

  /* Gold Variant */
  --tab-gold-active-bg: #C9A96E;
  --tab-gold-active-text: #1A1A1A;

  /* Dark Variant */
  --tab-dark-active-bg: #1C1C1E;
  --tab-dark-active-text: #C9A96E;

  /* Purple Variant */
  --tab-purple-active-bg: #7C3AED;
  --tab-purple-active-text: #FFFFFF;
}
```

---

## 3. BASE TAB CONTAINER & PILL STYLES

Apply these as a shared base. Works for Tailwind projects too — see Section 5.

```css
/* ── Scrollable Tab Row ── */
.tab-group {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 6px 4px 10px 4px;
  background: var(--tab-container-bg);
  border-radius: 16px;
  scrollbar-width: none;            /* Firefox */
  -ms-overflow-style: none;         /* IE/Edge */
  -webkit-overflow-scrolling: touch; /* iOS smooth scroll */
}
.tab-group::-webkit-scrollbar {
  display: none;                    /* Chrome/Safari */
}

/* ── Individual Tab Pill ── */
.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 10px 18px;
  border-radius: var(--tab-radius);
  border: 1.5px solid var(--tab-border-inactive);
  background: var(--tab-bg-inactive);
  color: var(--tab-text-inactive);
  font-size: 15px;
  font-weight: var(--tab-font-weight-inactive);
  line-height: 1.3;
  box-shadow: var(--tab-shadow-inactive);
  cursor: pointer;
  transition: var(--tab-transition);
  user-select: none;
}
.tab-pill:hover {
  border-color: #C5C5C7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

/* ── Emoji inside tab ── */
.tab-pill .tab-emoji {
  font-size: 16px;
  line-height: 1;
}
```

---

## 4. ACTIVE STATE PER VARIANT

```css
/* Gold Active */
.tab-group--gold .tab-pill.active {
  background: var(--tab-gold-active-bg);
  color: var(--tab-gold-active-text);
  border-color: var(--tab-gold-active-bg);
  font-weight: var(--tab-font-weight-active);
  box-shadow: 0 2px 10px rgba(201, 169, 110, 0.35);
}

/* Dark Active */
.tab-group--dark .tab-pill.active {
  background: var(--tab-dark-active-bg);
  color: var(--tab-dark-active-text);
  border-color: var(--tab-dark-active-bg);
  font-weight: var(--tab-font-weight-active);
  box-shadow: 0 2px 10px rgba(28, 28, 30, 0.25);
}

/* Purple Active */
.tab-group--purple .tab-pill.active {
  background: var(--tab-purple-active-bg);
  color: var(--tab-purple-active-text);
  border-color: var(--tab-purple-active-bg);
  font-weight: var(--tab-font-weight-active);
  box-shadow: 0 2px 10px rgba(124, 58, 237, 0.30);
}
```

---

## 5. TAILWIND UTILITY CLASSES (if using Tailwind)

For projects using Tailwind CSS, use these class combinations:

### Inactive pill
```
rounded-xl border border-gray-200 bg-white text-gray-700 font-medium
px-4 py-2.5 text-[15px] shadow-sm whitespace-nowrap flex-shrink-0
cursor-pointer transition-all duration-200 hover:shadow-md
```

### Active pill — Gold
```
rounded-xl bg-[#C9A96E] border-[#C9A96E] text-[#1A1A1A] font-bold
px-4 py-2.5 text-[15px] shadow-[0_2px_10px_rgba(201,169,110,0.35)]
whitespace-nowrap flex-shrink-0
```

### Active pill — Dark
```
rounded-xl bg-[#1C1C1E] border-[#1C1C1E] text-[#C9A96E] font-bold
px-4 py-2.5 text-[15px] shadow-[0_2px_10px_rgba(28,28,30,0.25)]
whitespace-nowrap flex-shrink-0
```

### Active pill — Purple
```
rounded-xl bg-[#7C3AED] border-[#7C3AED] text-white font-bold
px-4 py-2.5 text-[15px] shadow-[0_2px_10px_rgba(124,58,237,0.30)]
whitespace-nowrap flex-shrink-0
```

### Tab row container
```
flex flex-row flex-nowrap gap-2 overflow-x-auto overflow-y-hidden
px-1 py-1.5 bg-[#F2F2F7] rounded-2xl scrollbar-hide
```

> ⚠️ Add `scrollbar-hide` plugin or add this to `globals.css`:
> ```css
> .scrollbar-hide::-webkit-scrollbar { display: none; }
> .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
> ```

---

## 6. RESPONSIVE BREAKPOINTS

### Font Size

| Breakpoint | Tab Font Size | Padding |
|------------|--------------|---------|
| Mobile (`< 640px`) | `13px` | `8px 14px` |
| Tablet (`640px – 1024px`) | `14px` | `9px 16px` |
| Laptop (`> 1024px`) | `15px` | `10px 18px` |

```css
/* Mobile */
@media (max-width: 639px) {
  .tab-pill {
    font-size: 13px;
    padding: 8px 14px;
    gap: 5px;
  }
  .tab-pill .tab-emoji {
    font-size: 14px;
  }
  .tab-group {
    gap: 6px;
    padding: 5px 2px 8px 2px;
  }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .tab-pill {
    font-size: 14px;
    padding: 9px 16px;
  }
}

/* Laptop and up — base styles already apply */

/* ── Phone LANDSCAPE (horizontal phone) ── */
@media (max-width: 900px) and (orientation: landscape) {
  .tab-pill {
    font-size: 13px;
    padding: 7px 13px;   /* slightly slimmer height to save vertical space */
    gap: 5px;
  }
  .tab-group {
    gap: 6px;
    padding: 4px 2px 7px 2px;
    /* Still scrolls horizontally — more tabs visible than portrait */
  }
}
```

### Visibility strategy
- **Phone Portrait**: 1–2 tabs visible, horizontal scroll, first tab always visible, scrollbar hidden
- **Phone Landscape**: 3–4 tabs visible (more width), same horizontal scroll, slimmer pill height to preserve vertical space
- **iPad Portrait**: 3–4 tabs visible, scroll for more
- **iPad Landscape**: 4–5 tabs visible, rarely needs scroll
- **Laptop**: All tabs visible if ≤ 6, scroll if more

---

## 7. HTML USAGE EXAMPLES

### Gold Variant (Message Angles)
```html
<div class="tab-group tab-group--gold">
  <button class="tab-pill active">One-liner</button>
  <button class="tab-pill">Pain-focused</button>
  <button class="tab-pill">ROI angle</button>
  <button class="tab-pill">Social proof angle</button>
</div>
```

### Dark Variant (Channels)
```html
<div class="tab-group tab-group--dark">
  <button class="tab-pill active">
    <span class="tab-emoji">💼</span> LinkedIn
  </button>
  <button class="tab-pill">
    <span class="tab-emoji">📱</span> WhatsApp Cold Outreach
  </button>
  <button class="tab-pill">
    <span class="tab-emoji">🏭</span> Trade Event
  </button>
</div>
```

### Purple Variant (Timeline/Weeks)
```html
<div class="tab-group tab-group--purple">
  <button class="tab-pill active">
    <span class="tab-emoji">🎯</span> Week 1–2
  </button>
  <button class="tab-pill">
    <span class="tab-emoji">📥</span> Week 3–4
  </button>
  <button class="tab-pill">
    <span class="tab-emoji">🤝</span> Week 5–8
  </button>
  <button class="tab-pill">
    <span class="tab-emoji">💰</span> Week 9+
  </button>
</div>
```

---

## 8. REACT / JSX COMPONENT PATTERN

```jsx
// TabGroup.jsx
const TAB_VARIANTS = {
  gold: {
    active: 'bg-[#C9A96E] text-[#1A1A1A] border-[#C9A96E] font-bold shadow-[0_2px_10px_rgba(201,169,110,0.35)]',
    inactive: 'bg-white text-gray-700 border-gray-200 font-medium hover:shadow-md',
  },
  dark: {
    active: 'bg-[#1C1C1E] text-[#C9A96E] border-[#1C1C1E] font-bold shadow-[0_2px_10px_rgba(28,28,30,0.25)]',
    inactive: 'bg-white text-gray-700 border-gray-200 font-medium hover:shadow-md',
  },
  purple: {
    active: 'bg-[#7C3AED] text-white border-[#7C3AED] font-bold shadow-[0_2px_10px_rgba(124,58,237,0.30)]',
    inactive: 'bg-white text-gray-700 border-gray-200 font-medium hover:shadow-md',
  },
};

export function TabGroup({ tabs, activeTab, onTabChange, variant = 'gold' }) {
  const v = TAB_VARIANTS[variant];
  return (
    <div className="flex flex-row flex-nowrap gap-2 overflow-x-auto scrollbar-hide bg-[#F2F2F7] rounded-2xl px-1 py-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0
            px-4 py-2.5 rounded-xl border text-[14px] md:text-[15px]
            transition-all duration-200 cursor-pointer
            ${activeTab === tab.id ? v.active : v.inactive}
          `}
        >
          {tab.emoji && <span className="text-[15px] leading-none">{tab.emoji}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// Usage:
// <TabGroup
//   tabs={[
//     { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
//     { id: 'whatsapp', label: 'WhatsApp Cold Outreach', emoji: '📱' },
//   ]}
//   activeTab={activeTab}
//   onTabChange={setActiveTab}
//   variant="dark"
// />
```

---

## 9. FIELDS IN SANKALPUB TO UPDATE

Apply these styles to the following tab groups (replace existing tab/nav styles):

| Location in Project | Variant to Apply | Notes |
|---------------------|-----------------|-------|
| Message angle selector (One-liner, Pain-focused…) | `gold` | Match Image 1 |
| Outreach channel selector (LinkedIn, WhatsApp…) | `dark` | Match Image 2 |
| Timeline phase selector (Week 1–2, Week 3–4…) | `purple` | Match Image 3 |
| QC Phase tabs (Pre-Production, In-Line…) | `purple` | Consistent with timeline style |
| Inspection stage tabs | `dark` | High contrast for factory floor use |
| AQL level selector | `gold` | Neutral/analytical context |

---

## 10. ACCESSIBILITY NOTES

- Always use `<button>` elements (not `<div>`) for tab pills
- Add `role="tab"` and `aria-selected="true/false"` for screen readers
- Ensure active tab has minimum **3:1 contrast ratio** (all variants above pass WCAG AA)
- Add `tabindex="0"` to active tab and `tabindex="-1"` to others for keyboard nav

---

*Generated for SankalpHub.in — QMS Platform*  
*Reference: Screenshots IMG_6418, IMG_6419, IMG_6420*

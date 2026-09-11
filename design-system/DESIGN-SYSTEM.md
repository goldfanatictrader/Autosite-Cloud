# AutoSite Cloud — Design System Specification

> A mobile-first design system for the AutoSite Cloud website builder.

---

## 1. Color Palette

### Primary Colors

| Token | Hex | Use |
|-------|-----|-----|
| Primary | `#2563EB` (Blue-600) | CTAs, active states, links |
| Primary Hover | `#1D4ED8` (Blue-700) | Hover states for primary elements |
| Primary Light | `#DBEAFE` (Blue-100) | Backgrounds, tags, highlights |

### Secondary Colors

| Token | Hex | Use |
|-------|-----|-----|
| Secondary | `#7C3AED` (Violet-600) | AI features, premium badges |
| Secondary Light | `#EDE9FE` (Violet-100) | AI feature backgrounds |

### Neutral Colors

| Token | Hex | Use |
|-------|-----|-----|
| Gray-50 | `#F9FAFB` | Page background |
| Gray-100 | `#F3F4F6` | Card backgrounds |
| Gray-200 | `#E5E7EB` | Borders, dividers |
| Gray-400 | `#9CA3AF` | Placeholder text, disabled |
| Gray-600 | `#4B5563` | Secondary text |
| Gray-900 | `#111827` | Primary text |

### Semantic Colors

| Token | Hex | Use |
|-------|-----|-----|
| Success | `#10B981` (Green-500) | Live status, success toasts |
| Warning | `#F59E0B` (Amber-500) | Building status, warnings |
| Error | `#EF4444` (Red-500) | Errors, destructive actions |
| Info | `#3B82F6` (Blue-500) | Informational messages |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Draft | `#6B7280` (Gray-500) | Sites not yet published |
| Building | `#F59E0B` (Amber-500) | Site generation in progress |
| Live | `#10B981` (Green-500) | Published, publicly accessible |
| Error | `#EF4444` (Red-500) | Build or deployment failures |

---

## 2. Typography

### Font Family

| Role | Font | Fallback |
|------|------|----------|
| Primary (Body, UI) | Inter | system-ui, sans-serif |
| Monospace (Code, Technical) | JetBrains Mono | monospace |

### Type Scale

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `display-lg` | 36px | 700 (Bold) | 1.2 | Hero headlines |
| `display-md` | 30px | 700 (Bold) | 1.2 | Section headlines |
| `display-sm` | 24px | 600 (SemiBold) | 1.3 | Card titles |
| `heading-lg` | 20px | 600 (SemiBold) | 1.4 | Page titles |
| `heading-md` | 16px | 600 (SemiBold) | 1.4 | Subsection titles |
| `body-lg` | 16px | 400 (Regular) | 1.5 | Body text |
| `body-md` | 14px | 400 (Regular) | 1.5 | Secondary text |
| `body-sm` | 12px | 400 (Regular) | 1.5 | Captions, labels |
| `label-lg` | 14px | 500 (Medium) | 1.4 | Button text |
| `label-md` | 12px | 500 (Medium) | 1.4 | Tab labels |
| `label-sm` | 10px | 500 (Medium) | 1.4 | Badges |

---

## 3. Spacing System (4px base)

| Token | Value |
|-------|-------|
| `space-0` | 0px |
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

---

## 4. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 4px | Badges, small elements |
| `radius-md` | 8px | Cards, inputs |
| `radius-lg` | 12px | Modals, sheets |
| `radius-xl` | 16px | Feature cards |
| `radius-full` | 9999px | Avatars, pills |

---

## 5. Shadows / Elevation

| Token | Value | Use |
|-------|-------|-----|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle cards |
| `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Dropdowns, popovers |
| `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dialogs |
| `shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Floating elements |

---

## 6. Component Specs

### Buttons

| Variant | Background | Text | Border | Notes |
|---------|-----------|------|--------|-------|
| Primary | `#2563EB` | White | none | Default CTA |
| Secondary | White | `#111827` | `#E5E7EB` | Outline style |
| Ghost | Transparent | `#2563EB` | none | Text-only actions |
| Danger | `#EF4444` | White | none | Destructive actions |

**Shared Properties:**
- Font: `label-lg` (14px / 500)
- Height: 48px
- Padding: 0 24px
- Border radius: 8px
- Hover: darken background by 10%

### Cards

| Property | Value |
|----------|-------|
| Background | White |
| Border | 1px solid `#E5E7EB` |
| Border radius | 12px |
| Padding | 16px |
| Shadow | `shadow-sm` |
| Hover | `shadow-md`, border `#2563EB` |

### Inputs

| Property | Value |
|----------|-------|
| Height | 48px |
| Border | 1px solid `#E5E7EB` |
| Border radius | 8px |
| Padding | 0 16px |
| Focus | Border `#2563EB`, ring 3px `rgba(37,99,235,0.1)` |
| Error | Border `#EF4444` |
| Font | `body-lg` (16px / 400) |

### Navigation (Bottom Tab Bar)

| Property | Value |
|----------|-------|
| Height | 64px + safe area |
| Background | White with top border |
| Active icon color | `#2563EB` |
| Inactive icon color | `#9CA3AF` |
| Label font | `body-sm` (12px / 400) |
| Active label color | `#2563EB` |
| Inactive label color | `#9CA3AF` |

### Toast Notifications

| Property | Value |
|----------|-------|
| Position | Top of screen |
| Width | Full width with 16px horizontal margin |
| Height | Auto, min 48px |
| Border radius | 8px |
| Auto-dismiss | 3 seconds |
| Success | Background `#10B981`, text White |
| Error | Background `#EF4444`, text White |
| Info | Background `#3B82F6`, text White |
| Warning | Background `#F59E0B`, text White |

---

## 7. Iconography

| Property | Value |
|----------|-------|
| Style | Outlined |
| Stroke width | 2px |
| Default size | 24px |
| Small size | 20px |
| Large size | 32px |
| Library | Lucide Icons (or Phosphor Icons) |
| Color | Inherit from parent |

---

## 8. Responsive Breakpoints

| Name | Width | Columns | Gutters |
|------|-------|---------|---------|
| Mobile | 0–639px | 4 | 16px |
| Tablet | 640–1023px | 8 | 24px |
| Desktop | 1024px+ | 12 | 32px |

---

## 9. Dark Mode

### Background & Surface

| Token | Hex |
|-------|-----|
| Background | `#0F172A` (Slate-900) |
| Surface | `#1E293B` (Slate-800) |
| Border | `#334155` (Slate-700) |

### Text

| Token | Hex |
|-------|-----|
| Text primary | `#F8FAFC` (Slate-50) |
| Text secondary | `#94A3B8` (Slate-400) |

### Colors Unchanged in Dark Mode

- Primary: `#2563EB`
- Secondary: `#7C3AED`
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`
- Info: `#3B82F6`

---

*Document version: 1.0*
*Last updated: 2026-09-12*

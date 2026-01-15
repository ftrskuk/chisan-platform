# CHISAN Design System Specification

## Overview

This design system aims for a **high-density, professional ERP aesthetic** similar to Linear or modern enterprise tools. The focus is on clarity, data density, and subtle visual cues rather than heavy "app-like" containers.

## Design Tokens

### 1. Typography

- **Font Family**: Inter (`sans`), UI Monospace (`mono`)
- **Base Size**: 14px (0.875rem)
- **Small Size**: 13px (0.8125rem) - _Used for dense data_
- **Heading Scale**: Minimalist. H1 is typically 20px (1.25rem) or 24px (1.5rem).

| Token       | Size | Rem       | Usage                      |
| :---------- | :--- | :-------- | :------------------------- |
| `text-xs`   | 12px | 0.75rem   | Meta text, labels          |
| `text-sm`   | 13px | 0.8125rem | **Default data grid text** |
| `text-base` | 14px | 0.875rem  | Body copy, inputs          |
| `text-lg`   | 16px | 1rem      | Section headers            |
| `text-xl`   | 20px | 1.25rem   | Page titles                |

### 2. Colors

We use a refined palette with a specific primary blue and high-contrast grays.

#### Light Mode (Default)

- **Primary**: `#136dec` (Vivid Blue)
- **Background**: `#ffffff` (Pure White)
- **Surface/Subtle**: `#f6f7f8` (Very Light Gray) - _Used for sidebar, headers_
- **Border**: `#e5e7eb` (Gray 200) - _Standard border_
- **Border Subtle**: `#f3f4f6` (Gray 100) - _Table rows_
- **Text Primary**: `#0d131b` (Almost Black)
- **Text Secondary**: `#5f6b7c` (Cool Gray)

#### Status Colors

- **Success**: Emerald 500 (`#10b981`)
- **Warning**: Orange 400 (`#fb923c`)
- **Error**: Red 500 (`#ef4444`)
- **Neutral**: Gray 400 (`#9ca3af`)

### 3. Spacing & Layout

- **Sidebar Width**: 240px
- **Header Height**: 48px (`h-12`)
- **Global Padding**: `px-6` (24px) for main content area.
- **Component Spacing**: Compact. `gap-2` or `gap-3`.

### 4. Shadows & Effects

- **Shadow Sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (Subtle depth for buttons/cards)
- **Backdrop Blur**: `blur-sm` for sticky headers.

## Component Patterns

### Sidebar

- Background: `#fbfbfc`
- Navigation Items:
  - Height: ~32px
  - Padding: `px-3 py-1.5`
  - Font: `text-sm` (0.8125rem or 0.875rem)
  - **Active State**: White background, subtle border, shadow-sm, blue left accent bar.
  - **Hover State**: `bg-gray-100/50`
- Section Headers: Uppercase, `text-[11px]`, tracking wider, `text-gray-400`.

### Data Table (The Core Component)

- **Density**: High.
- **Header**: Sticky top, `bg-background`, `text-[11px]`, uppercase, tracking-wider.
- **Rows**:
  - Border: `border-b border-gray-100` (Very subtle).
  - Hover: `bg-[#f9fafb]`.
  - Font: `text-sm` (13px).
  - Checkbox: Hidden by default (`opacity-0`), visible on hover (`group-hover:opacity-100`) or when selected.

### Status Indicators

- **Pattern**: Dot + Text (No heavy badges/pills).
- **Dot Size**: 6px (1.5 tailwind spacing).
- **Text**: `text-xs font-medium`.

### Buttons

- **Primary**: Blue background, white text, shadow-sm.
- **Secondary**: White background, border, text-secondary, shadow-sm.
- **Ghost**: Transparent, text-secondary, hover:text-primary.

## Implementation Guidelines

1.  **Avoid Cards**: Do not wrap main content in cards unless necessary. Use the full canvas.
2.  **Subtle Borders**: Use `border-gray-100` for list items to reduce visual noise.
3.  **Monospace Numbers**: Use `font-mono` for IDs, Prices, and numeric data in tables.

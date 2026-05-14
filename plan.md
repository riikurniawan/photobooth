# Neo-brutalist layout plan (Header / Top Navbar / Footer)

## Problem and approach
The app currently has only a basic `App.tsx` starter view and no reusable layout components in `src/components` or page structure in `src/pages`.
Implement a reusable neo-brutalist UI shell using base color `#e63946`, with a top navigation area (header + navbar) and footer, then wire pages through that shell.

Approach:
1. Create reusable layout components in `src/components` (`Header`, `TopNavbar`, `Footer`, optional `Layout` wrapper).
2. Apply neo-brutalist visual language in CSS/Tailwind utility combinations: hard borders, offset shadows, blocky spacing, strong contrast, minimal rounding.
3. Integrate into `App.tsx` and ensure `src/pages` gets at least a starter page consumed by the layout.
4. Keep styles centralized and reusable so additional pages can inherit the same design system.

## Todos
1. Audit current project styling setup and constraints (Solid + Tailwind import path, where global styles should live).
2. Build `Header`, `TopNavbar`, and `Footer` components under `src/components` with semantic markup.
3. Add neo-brutalist styling tokens/utilities using `#e63946` as base and high-contrast support colors.
4. Create/update a page in `src/pages` (e.g., `Home`) and render it through a shared layout in `App.tsx`.
5. Validate visual consistency and responsive behavior for top area and footer across common viewport widths.

## Notes and considerations
- Keep component APIs simple (title, nav items, optional footer text) to avoid overfitting early.
- Preserve accessibility: semantic landmarks (`header`, `nav`, `main`, `footer`), readable contrast, visible focus states.
- Prioritize composition over page-specific styling, so future pages can reuse the same shell.
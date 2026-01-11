# Spec: Header Polish (Dark Luxury)

## Goal
Elevate the existing WordPress theme's header area (Topbar, Main Header, and Navigation Bar) to a "Dark Luxury" aesthetic using Tailwind CSS, gold textures, and glassmorphism effects.

## Scope
- **Topbar:** Invert background to dark, add subtle gold borders, and style icons/text.
- **Main Header:** Replace white background with dark luxury theme, style contact info widgets with gold accents.
- **Navigation Bar:** Apply gold texture to the background, implement glassmorphism (backdrop blur) for the sticky state, and style menu items.

## Visual Requirements
- **Color Palette:** `apfel-black` backgrounds, `apfel-gold` highlights.
- **Texture:** Apply gold textures to the navbar background.
- **Glassmorphism:** backdrop-blur-md and semi-transparent backgrounds for the sticky navigation.
- **Interactivity:** Subtle hover effects using gold pulse or glows.

## Technical Implementation
- Use utility classes from Tailwind CSS where possible.
- Update `src/input.css` for custom textures and animations.
- Modify theme PHP files (`header.php`, `template-parts/header/*`) if utility classes aren't sufficient.

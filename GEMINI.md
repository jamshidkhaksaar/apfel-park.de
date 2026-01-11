# Project Context: Fixtech (WordPress Theme)

## Overview
This is a WordPress theme development project for a theme named **Fixtech**. The project is containerized using Docker and utilizes Tailwind CSS for styling. The design aesthetic appears to be "Dark Luxury" with a custom gold and black color palette (`apfel-gold`, `apfel-black`).

## Infrastructure & Environment
The project uses `docker-compose` to manage the local development stack.

-   **Services:**
    -   **WordPress:** Accessible at `http://localhost:8000`.
    -   **Database:** MariaDB 10.6 (Service name: `db`).
    -   **Database Management:** phpMyAdmin accessible at `http://localhost:8080`.
-   **Credentials (Local):**
    -   **DB User:** `exampleuser`
    -   **DB Password:** `examplepassword`
    -   **DB Name:** `exampledb`
    -   **DB Host:** `db`
-   **Volumes:**
    -   `./wp-content` is mapped to `/var/www/html/wp-content`, meaning theme changes in `wp-content/themes/fixtech` or the root `fixtech` folder (if symlinked or copied) are reflected in the container. **Note:** The `fixtech/` directory at the project root seems to be the primary source for theme development.

## Development Workflow

### 1. Start the Environment
```bash
docker compose up -d
```

### 2. Frontend Development (Tailwind CSS)
The theme uses Tailwind CSS. You must run the build process to generate styles.

**Directory:** `fixtech/`

**Commands:**
-   **Install Dependencies:** `npm install`
-   **Start Watch Mode:** `npm run watch` (Compiles `src/input.css` to `assets/css/tailwind-build.css`)
-   **Build for Production:** `npm run build`

### 3. Theme Structure
-   **Theme Root:** `fixtech/`
-   **Main Styles:** `fixtech/style.css` (Theme metadata & base styles)
-   **Tailwind Config:** `fixtech/tailwind.config.js`
-   **Tailwind Input:** `fixtech/src/input.css`
-   **Tailwind Output:** `fixtech/assets/css/tailwind-build.css`
-   **Templates:** Standard WordPress hierarchy (`index.php`, `header.php`, `footer.php`, `functions.php`, etc.)

## Design System & Conventions
-   **Color Palette (Tailwind):**
    -   `apfel-black`: `#0a0a0a`
    -   `apfel-card`: `#111111`
    -   `apfel-gold-500`: `#D4AF37`
    -   `apfel-gold-600`: `#B8860B`
    -   `apfel-gold-300`: `#FCF6BA`
-   **Styling Strategy:** Use utility classes in PHP templates. Avoid editing `assets/css/tailwind-build.css` directly.
-   **Visual Verification:** Always verify changes visually, ensuring the "Dark Luxury" aesthetic is maintained.

## Key Files
-   `docker-compose.yml`: Infrastructure definition.
-   `fixtech/package.json`: Frontend dependencies and scripts.
-   `fixtech/tailwind.config.js`: Tailwind configuration.
-   `fixtech/functions.php`: Theme logic and hook registration.
-   `AGENTS.md`: Additional project-specific guidelines.

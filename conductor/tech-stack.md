# Tech Stack: Fixtech

## Core Platform
- **WordPress:** The primary Content Management System (CMS), providing the theme architecture, content management, and extensibility.
- **PHP:** The server-side language powering the WordPress backend and template logic.

## E-Commerce & Services
- **WooCommerce:** Powers the online shop functionality for smartphones, consoles, laptops, and accessories.
- **Custom Post Types:** Likely used for managing repair services and technical portfolio items.

## Frontend Architecture
- **Tailwind CSS:** Used for utility-first styling, enabling the custom "Dark Luxury" design system.
- **PostCSS / Autoprefixer:** For modern CSS processing and browser compatibility.
- **Glassmorphism:** To be implemented using Tailwind's backdrop-filter utilities.

## Infrastructure & Environment
- **Docker Compose:** Manages the local development environment.
- **MariaDB 10.6:** The relational database for WordPress.
- **phpMyAdmin:** Web interface for database management.

## Build & Development Tools
- **npm:** Package manager for frontend dependencies.
- **Tailwind CLI:** For compiling `src/input.css` into the production-ready `assets/css/tailwind-build.css`.

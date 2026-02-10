# Contributing to HRMS SaaS 🤝

Thank you for your interest in contributing to our project! To maintain the quality and stability of the code, please follow these guidelines.

## 🌿 Branching Strategy

We use a two-branch main strategy:

- **`main`**: The stable production branch. **No direct commits allowed.**
- **`develop`**: The integration branch for new features and bug fixes.
- **Feature branches**: Create a branch starting with `feat/`, `fix/`, or `chore/` from the `develop` branch for your changes.

## 🚀 How to Contribute

1.  **Fork** the repository on GitHub.
2.  **Clone** your fork locally:
    ```bash
    git clone https://github.com/YOUR_USERNAME/rhms-gestion.git
    ```
3.  **Create a branch** for your feature or fix (always branch out from `develop`):
    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feat/your-feature-name
    ```
4.  **Make your changes** and commit with clear messages.
5.  **Push** your branch to your fork:
    ```bash
    git push origin feat/your-feature-name
    ```
6.  **Open a Pull Request (PR)** against the `develop` branch of the main repository.

## 📏 Code Standards

- Follow the existing project style (React/Tailwind for Frontend, PEP8/DRF for Backend).
- Ensure your code is well-commented and clean.
- Verify your changes locally before submitting a PR.

## ✅ Pull Request Process

- All PRs must be reviewed by the maintainers.
- PRs should be merged into `develop` first.
- Only stable, tested features from `develop` will be merged into `main`.

---
*By contributing, you agree that your code will be licensed under the project's license.*

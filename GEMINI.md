# Gemini CLI Context: MRI Viewer (med3web)

This file provides context and automation instructions for Gemini CLI when working on the `med3web` project.

## Project Information
- **Repository:** [epam/med3web](https://github.com/epam/med3web)
- **Main Stack:** React 17, Three.js, Vite, Vitest.
- **Domain:** Medical 2D/3D volumetric data visualization (DICOM, NIfTI, KTX).

## AI Automation & GitHub Integration
Gemini CLI should use the `gh` CLI to interact with the repository.

### Issue Management
- **List Open Issues:** `gh issue list --repo epam/med3web`
- **View Issue Details:** `gh issue view <id> --repo epam/med3web`
- **Create a New Issue:** `gh issue create --repo epam/med3web --title "Title" --body "Body"`
- **Add Comments:** `gh issue comment <id> --repo epam/med3web --body "Message"`

### Workflows
- **Bug Fixes:** 
    1. Fetch issue details using `gh issue view`.
    2. Reproduce the bug with a test case in `src/`.
    3. Apply the fix.
    4. Run `npm run test` to verify.
- **Feature Development:**
    1. Research existing implementation in `src/engine/` or `src/ui/`.
    2. Implement and add tests.
    3. Verify with `npm run build`.

## Common Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run test`: Run Vitest suites.
- `npm run lint`: Run ESLint.

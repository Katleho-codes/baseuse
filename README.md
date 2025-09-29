# Baseuse — Browser Feature Baseline Analyzer for VS Code

Baseuse is a VS Code extension that scans your CSS, HTML, and JavaScript for web features and functions, checks their browser support against a baseline, and provides inline guidance, tooltips, and quick fixes.

---

## Features

-   **Real-time scanning** of open documents (CSS, SCSS, HTML, JS, TS)
-   **Line-by-line diagnostics** for unsupported or partially supported features
-   **Quick fixes**:

    -   Convert `px` → `rem`
    -   Suggest fallbacks for unsupported CSS functions (e.g., `image-set`)

-   **Hover tooltips**:

    -   Shows feature status, browser support matrix, suggestions, MDN/spec links

-   **Project-wide scan / CI mode**:

    -   Command to scan all workspace files and report unsupported features

-   **Multi-language support**: CSS, HTML, JS/TS
-   **Learning mode**:

    -   Highlights newly available features and suggests modern alternatives

---

## Installation

1. Clone the repository:

    ```bash
    git clone <repo-url>
    cd baseuse
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Build the extension:

    ```bash
    npm run compile
    ```

4. Launch in VS Code: Press `F5` to open a new Extension Development Host window.

---

## Usage

### Commands

-   **Analyze Baseline** (`Ctrl+Shift+P → Baseuse: Analyze Baseline`)
    Scan the entire workspace and view a report in the Output panel.

### Sidebar

-   **Baseline Browser Matrix**:
    Shows feature support per browser and updates as you scan documents.

### Inline Support

-   Open a supported file and hover over a feature (e.g., `calc()`, `image-set`) to see:

    -   Support status
    -   Quick fix suggestions

-   **Quick Fix Example**: Hover over `16px` → click to convert to `1rem`.

---

## Development / Testing

### Unit Tests

```bash
npm install --save-dev jest ts-jest @types/jest
npm test
```

### Integration Tests (VS Code)

```bash
npm install --save-dev @vscode/test-electron @vscode/test-cli
npm run test
```

-   Runs your extension in a sandboxed VS Code instance.
-   You can test:

    -   Document scanning
    -   Diagnostics generation
    -   Quick fixes and hover tooltips

---

## Extension Structure

```
src/
  hooks/
    baseline.ts          # Find element
    css_parser.ts        # Parse css values
    scanner.ts           # Feature scanning per document
    projectScanner.ts    # Workspace/project scan
    pxToRemProvider.ts   # QuickFix provider for px → rem
  extension.ts           # Entry point
package.json            # VS Code extension manifest
```

---

## Notes

-   Currently supports detection of CSS functions, properties, HTML elements, and JS globals.
-   Uses [`web-features`](https://www.npmjs.com/package/web-features) npm package for baseline data.
-   Features with unknown or unsupported baseline are ignored in reports.

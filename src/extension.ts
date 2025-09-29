import * as vscode from "vscode";
import { scanWorkspaceAndShowReport } from "./hooks/projectScanner.js";
import { PxToRemCodeActionProvider } from "./hooks/pxToRemProvider.js";
import { scanDocumentForFeatures } from "./hooks/scanner.js";
import { ScanResult } from "./types.js";

let diagnostics: vscode.DiagnosticCollection;

export async function activate(context: vscode.ExtensionContext) {
    diagnostics = vscode.languages.createDiagnosticCollection("Baseuse");
    context.subscriptions.push(diagnostics);

    // On open/save, scan
    const languages = ["css", "scss", "html", "javascript", "typescript"];
    for (const lang of languages) {
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument((doc) => {
                if (doc.languageId === lang) {
                    scanAndReport(doc);
                }
            })
        );
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (doc.languageId === lang) {
                    scanAndReport(doc);
                }
            })
        );
    }

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand("baseuse.analyzeBaseline", async () => {
            await scanWorkspaceAndShowReport(context);
        })
    );

    // Register providers
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            ["css", "scss", "html", "javascript", "typescript"],
            {
                provideHover(document, position, token) {
                    return provideFeatureHover(document, position);
                },
            }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            ["css", "scss", "html", "javascript", "typescript"],
            new PxToRemCodeActionProvider(),
            {
                providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
            }
        )
    );

    // Register webview view provider
    // context.subscriptions.push(createBrowserMatrixWebview(context));
}

async function scanAndReport(doc: vscode.TextDocument) {
    const results = await scanDocumentForFeatures(doc, 200); // 200ms delay per line
    const diags: vscode.Diagnostic[] = [];

    for (const [lineNum, lineResults] of results.entries()) {
        for (const r of lineResults) {
            const severity =
                r.baselineStatus === "widely"
                    ? vscode.DiagnosticSeverity.Hint
                    : r.baselineStatus === "newly"
                    ? vscode.DiagnosticSeverity.Information
                    : vscode.DiagnosticSeverity.Warning;

            const d = new vscode.Diagnostic(
                r.range,
                `${r.featureId} — ${r.baselineStatus}`,
                severity
            );
            d.source = "Baseuse";
            d.code = r.featureId;
            if (r.suggestion) {
                d.relatedInformation = [
                    new vscode.DiagnosticRelatedInformation(
                        new vscode.Location(doc.uri, r.range),
                        r.suggestion
                    ),
                ];
            }
            diags.push(d);
        }
    }

    diagnostics.set(doc.uri, diags);
}

async function provideFeatureHover(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<vscode.Hover | undefined> {
    const wordRange = document.getWordRangeAtPosition(
        position,
        /[A-Za-z0-9\-\_]+|\d+px/
    );
    if (!wordRange) {
        return;
    }
    // simple lookup
    const detection = await scanDocumentForFeatures(document, 0); // 0 delay for hover
    let r: ScanResult | undefined;

    // find the first result that intersects the hovered word
    for (const lineResults of detection.values()) {
        r = lineResults.find(
            (res) => res.range.intersection(wordRange) !== undefined
        );
        if (r) {
            break;
        }
    }

    if (!r) {
        return;
    }

    const spec = r.specUrl ? `[${r.specUrl}](${r.specUrl})` : "";
    const browsers = Object.entries(r.browsers ?? {})
        .map(([b, v]) => `${b}: ${v ? "✅" : "❌"}`)
        .join(" | ");

    const contents = new vscode.MarkdownString();
    contents.appendMarkdown(
        `**Element**: _${r.featureId}_ — **Support**: _${r.baselineStatus}_\n\n`
    );
    contents.appendMarkdown(`**Browser support**: ${browsers}\n\n`);
    if (r.suggestion) {
        contents.appendMarkdown(`**Suggestion:** _${r.suggestion}_\n\n`);
    }
    if (spec) {
        contents.appendMarkdown(`**Specification:** _${spec}_\n\n`);
    }
    contents.isTrusted = true;

    return new vscode.Hover(contents, wordRange);
}

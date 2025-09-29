import * as vscode from "vscode";
import { scanDocumentForFeatures } from "./scanner.js";

/**
 * Walk all workspace files and run the feature scanner.
 * Show summary report in an output channel.
 */
export async function scanWorkspaceAndShowReport(
    context: vscode.ExtensionContext
) {
    const files = await vscode.workspace.findFiles(
        "**/*.{css,scss,html,js,ts}",
        "**/node_modules/**"
    );

    const allResults: any[] = [];

    for (const file of files) {
        const doc = await vscode.workspace.openTextDocument(file);
        const resultsMap = await scanDocumentForFeatures(doc); // now a Map
        if (resultsMap.size > 0) {
            // flatten map into a list of issues per line
            const issues: any[] = [];
            for (const [lineNum, lineResults] of resultsMap.entries()) {
                for (const r of lineResults) {
                    issues.push(r);
                }
            }
            allResults.push({ file: file.fsPath, issues });
        }
    }

    // Show report
    const output = vscode.window.createOutputChannel("Baseuse Report");
    output.clear();
    output.appendLine("=== Baseuse Project Scan ===");

    if (allResults.length === 0) {
        output.appendLine("No unsupported features found.");
    } else {
        for (const entry of allResults) {
            output.appendLine(`\n${entry.file}`);
            for (const issue of entry.issues) {
                output.appendLine(
                    `Baseline status [${issue.baselineStatus}] - Element ${
                        issue.featureId
                            ? issue.featureId
                            : "Feature ID not found"
                    } at line ${issue.range.start.line + 1}`
                );
            }
        }
    }

    output.show(true);
}

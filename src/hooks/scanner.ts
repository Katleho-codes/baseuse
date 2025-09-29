import * as vscode from "vscode";
import { ScanResult } from "../types.js";
import { findFeatureById } from "./baseline.js";

export async function scanDocumentForFeatures(
    doc: vscode.TextDocument,
    delayMs = 500
): Promise<Map<number, ScanResult[]>> {
    const resultsMap = new Map<number, ScanResult[]>();
    const totalLines = doc.lineCount;

    for (let lineNum = 0; lineNum < totalLines; lineNum++) {
        const lineText = doc.lineAt(lineNum).text;
        const lineResults: ScanResult[] = [];

        // --- CSS PX VALUES ---
        const pxRegex = /(\d+(\.\d+)?)px\b/g;
        let match;
        while ((match = pxRegex.exec(lineText)) !== null) {
            const token = match[0]; // e.g., "16px"
            const featureId = "css-values-px"; // canonical px feature
            const baseline = await findFeatureById(featureId);

            lineResults.push({
                range: new vscode.Range(
                    lineNum,
                    match.index,
                    lineNum,
                    match.index + token.length
                ),
                featureId: "px",
                baselineStatus: "Status not found",
                suggestion: `Use rem: ${token} → ${convertPxToRem(
                    Number(match[1])
                )}rem`,
                browsers: baseline?.browsers ?? {},
                specUrl: baseline?.spec ?? "Not found",
            });
        }

        // --- CSS FUNCTIONS ---
        const funcRegex = /\b([a-zA-Z0-9_-]+)\(/g;
        while ((match = funcRegex.exec(lineText)) !== null) {
            const token = match[1]; // e.g., "image-set"
            const baseline = await findFeatureById(token); // search everything

            // skip if no match OR status unknown OR featureId missing
            if (!baseline) {
                continue;
            }
            lineResults.push({
                range: new vscode.Range(
                    lineNum,
                    match.index,
                    lineNum,
                    match.index + token.length
                ),
                featureId: baseline?.featureId,
                baselineStatus: baseline?.status,
                suggestion:
                    baseline?.browsers?.safari === false
                        ? `Fallback for Safari: e.g., -webkit-${token} or alternative`
                        : "OK",
                browsers: baseline?.browsers,
                specUrl: baseline?.spec,
            });
        }

        // --- HTML ELEMENTS ---
        const htmlTagRegex = /<([a-zA-Z0-9_-]+)/g;
        while ((match = htmlTagRegex.exec(lineText)) !== null) {
            const token = match[1]; // e.g., "dialog"
            const baseline = await findFeatureById(token);
            // skip if no match OR status unknown OR featureId missing
            if (!baseline) {
                continue;
            }
            lineResults.push({
                range: new vscode.Range(
                    lineNum,
                    match.index,
                    lineNum,
                    match.index + token.length + 1
                ),
                featureId: baseline?.featureId,
                baselineStatus: baseline?.status,
                // suggestion: "Check browser support",
                browsers: baseline?.browsers,
                specUrl: baseline?.spec,
            });
        }

        // --- JS GLOBALS ---
        const jsGlobalRegex = /\b(fetch|AbortController)\b/g;
        while ((match = jsGlobalRegex.exec(lineText)) !== null) {
            const token = match[1];
            const baseline = await findFeatureById(token);
            // skip if no match OR status unknown OR featureId missing
            if (
                !baseline ||
                baseline.status === "unknown" ||
                !baseline.featureId
            ) {
                continue;
            }

            lineResults.push({
                range: new vscode.Range(
                    lineNum,
                    match.index,
                    lineNum,
                    match.index + token.length
                ),
                featureId: baseline?.featureId,
                baselineStatus: baseline?.status,
                // suggestion: "Check browser support",
                browsers: baseline?.browsers,
                specUrl: baseline?.spec,
            });
        }

        if (lineResults.length > 0) {
            resultsMap.set(lineNum, lineResults);
        }

        // wait before scanning next line
        await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return resultsMap;
}
export function convertPxToRem(px: number, base = 16) {
    const rem = px / base;
    // round to 4 decimals
    return Math.round(rem * 10000) / 10000;
}

/**
 * Map a raw token / AST node to a web-features ID.
 * @param type The node type, e.g. 'css-property', 'css-function', 'html-element', 'js-global'
 * @param name The identifier, e.g. 'backdrop-filter', 'image-set', 'dialog', 'fetch'
 */
export function featureIdForNode(type: string, name: string): string | null {
    // Normalize
    const key = name.toLowerCase();

    // Simple example mappings – in production, expand this table
    const map: Record<string, Record<string, string>> = {
        "css-property": {
            "backdrop-filter": "css-properties.backdrop-filter",
            "contain-intrinsic-size": "css-properties.contain-intrinsic-size",
        },
        "css-function": {
            "image-set": "css-functions.image-set",
            env: "css-functions.env",
        },
        "html-element": {
            dialog: "html-elements.dialog",
            picture: "html-elements.picture",
        },
        "js-global": {
            fetch: "api.fetch",
            abortcontroller: "api.AbortController",
        },
    };

    const group = map[type];
    if (!group) {
        return null;
    }
    return group[key] ?? null;
}

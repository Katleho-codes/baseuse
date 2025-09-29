import * as vscode from "vscode";
import { convertPxToRem } from "./scanner.js";

export class PxToRemCodeActionProvider implements vscode.CodeActionProvider {
    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction[] | undefined {
        const text = document.getText(range);
        const m = /(\d+(\.\d+)?)px\b/.exec(text);
        if (!m) {
            return;
        }

        const px = Number(m[1]);
        const rem = convertPxToRem(px);
        const title = `Convert ${px}px → ${rem}rem`;

        const action = new vscode.CodeAction(
            title,
            vscode.CodeActionKind.QuickFix
        );
        action.edit = new vscode.WorkspaceEdit();
        action.edit.replace(document.uri, range, `${rem}rem`);
        action.isPreferred = true;

        return [action];
    }
}

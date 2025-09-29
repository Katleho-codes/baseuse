import * as vscode from "vscode";
export type ScanResult = {
    range: vscode.Range;
    featureId?: string;
    baselineStatus?: string;
    suggestion?: string;
    browsers?: Record<string, boolean>;
    mdnUrl?: string;
    specUrl?: string;
};

export type TFeatureResult = {
    status: string;
    browsers: Record<string, boolean>;
    mdn?: string;
    spec?: string;
    featureId?: string;
};

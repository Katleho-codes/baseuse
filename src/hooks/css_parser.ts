/**
 * Extracts CSS function names from a value string.
 * e.g. "linear-gradient(red, blue) image-set(url.png 1x)"
 * → ["linear-gradient", "image-set"]
 */
export function extractCssFunctions(value: string): string[] {
    const functionRegex = /([a-zA-Z-]+)\s*\(/g;
    const matches: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = functionRegex.exec(value)) !== null) {
        matches.push(match[1]); // capture function name only
    }

    return matches;
}

/**
 * Extracts @rules from a line.
 * e.g. "@container (min-width: 300px)" → ["@container"]
 */
export function extractAtRules(line: string): string[] {
    const atRuleRegex = /@([a-zA-Z-]+)/g;
    const matches: string[] = [];

    let match: RegExpExecArray | null;
    while ((match = atRuleRegex.exec(line)) !== null) {
        matches.push(`@${match[1]}`);
    }

    return matches;
}

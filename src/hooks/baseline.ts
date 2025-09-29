import { features } from "web-features";
import { TFeatureResult } from "../types.js";

// find a feature by its ID
export const findFeatureById = async (id: string): Promise<TFeatureResult> => {
    const feature = Object.entries(features).find(
        ([featureId]) => featureId.toLowerCase() === id.toLowerCase()
    );

    if (!feature) {
        return {
            status: "Status not found",
            browsers: {},
            spec: undefined,
        };
    }

    const [, data] = feature;
    const status = data.status?.baseline;
    const browsers = data.status?.support;
    // Take first spec link if it's an array
    const spec = Array.isArray(data?.spec) ? data?.spec[0] : undefined;
    return {
        featureId: id,
        status: status ?? "Status not found",
        browsers: browsers,
        spec: spec,
    };
};

export interface SystemPreferences {
  detect: boolean;
  axonic: boolean;
  gridManager: boolean;
  recentProfiles: string[];
  lastProfile: string;
}
export const preferencesKey = "pole-insights-system-preferences-v1";
export function readPreferences(legacyDetect = true): SystemPreferences {
  try {
    const v = JSON.parse(localStorage.getItem(preferencesKey) ?? "null");
    if (v && typeof v === "object") return {
      detect: typeof v.detect === "boolean" ? v.detect : legacyDetect,
      axonic: v.axonic === true,
      gridManager: v.gridManager === true,
      recentProfiles: Array.isArray(v.recentProfiles) ? v.recentProfiles.filter((s: unknown): s is string => typeof s === "string" && validProfile(s)).slice(0, 12) : [],
      lastProfile: typeof v.lastProfile === "string" && validProfile(v.lastProfile) ? v.lastProfile : "",
    };
  } catch {}
  return {detect: legacyDetect, axonic: false, gridManager: false, recentProfiles: [], lastProfile: ""};
}
export function validProfile(value: string) {
  return /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}
export function axonicUrl(profile: string, assetId: string): string | null {
  return validProfile(profile) && assetId.trim() ? `axonic://${profile}/${encodeURIComponent(assetId.trim())}` : null;
}

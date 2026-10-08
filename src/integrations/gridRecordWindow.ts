let recordWindow: Window | null = null;

export function openGridRecord(url: string): boolean {
  const previous = recordWindow;
  try {
    if (previous && !previous.closed) {
      previous.location.replace(url);
      previous.focus();
      return true;
    }
  } catch { /* Cross-site isolation can prevent navigating a disowned tab. */ }
  const opened = window.open("about:blank", "PoleInsightsGridManager");
  if (!opened) return false;
  try {
    // Remove reverse navigation access before loading the external application.
    opened.opener = null;
    opened.location.replace(url);
    recordWindow = opened;
    opened.focus();
  } catch {opened.close(); return false;}
  try {if (previous && previous !== opened && !previous.closed) previous.close();} catch { /* Leave browser-managed tabs alone if closing is denied. */ }
  return true;
}

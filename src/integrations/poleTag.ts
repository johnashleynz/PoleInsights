export function poleTagTone(tag: string | null): "green" | "yellow" | "red" | "neutral" {
  const value = tag?.trim().toLowerCase().replace(/\s+/g, " ");
  if (value === "ok" || value === "green" || value === "green tag") return "green";
  if (value === "red" || value === "red tag") return "red";
  if (value === "reinspect" || /^reinspect in \d+ years?$/.test(value ?? "")) return "yellow";
  return "neutral";
}

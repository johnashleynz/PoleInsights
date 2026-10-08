import {SPECIES, type PoleSpecies} from "../domain/species.ts";
import type {CountryCode} from "../domain/countries.ts";

const normalize = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const aliases: Record<string, string[]> = {"southern-pine": ["southern yellow pine", "southern pine"]};
function distance(a: string, b: string) {
  let row = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    row = next;
  }
  return row[b.length];
}
export function matchGridSpecies(value: string | null, country: CountryCode): PoleSpecies | null {
  const input = normalize(value ?? "");
  if (!input) return null;
  const region = country === "US" ? "US" : country === "AU" ? "Australia" : "New Zealand";
  const names = (s: PoleSpecies) => (s.baseSpeciesId ? [s.id,s.name] : [s.id, s.name, s.name.split(" · ")[0], s.botanical, ...(aliases[s.id] ?? [])]).map(normalize);
  const unique = (items: PoleSpecies[]) => {
    const local = items.filter(s => s.regions === region);
    return local.length === 1 ? local[0] : items.length === 1 ? items[0] : null;
  };
  const exact = SPECIES.filter(s => names(s).includes(input));
  if (exact.length) return unique(exact);
  if (input.length < 8 || input.split(" ").length < 2) return null;
  const scores = SPECIES.map(s => ({s, score: Math.min(...names(s).map(name => distance(input, name)))}));
  const best = Math.min(...scores.map(s => s.score));
  return best <= Math.min(2, Math.floor(input.length / 10)) ? unique(scores.filter(s => s.score === best).map(s => s.s)) : null;
}

import { createHash } from "crypto";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

export function jobHash(
  title: string,
  company: string,
  city: string,
  state: string
): string {
  const normalized = [
    normalize(title),
    normalize(company),
    normalize(city),
    normalize(state),
  ].join("|");

  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function queryHash(
  searchTerm: string,
  location: string,
  sites: string[]
): string {
  const normalized = [
    normalize(searchTerm),
    normalize(location),
    sites.sort().join(",").toLowerCase(),
  ].join("|");

  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

import { getDb } from "@/lib/db";
import { queryHash } from "@/lib/dedup";

interface CacheRow {
  query_hash: string;
  search_term: string;
  location: string | null;
  sites: string | null;
  last_scraped: string;
  result_count: number;
}

export function shouldScrape(
  searchTerm: string,
  location: string,
  sites: string[]
): boolean {
  const db = getDb();
  const hash = queryHash(searchTerm, location, sites);

  const cached = db
    .prepare("SELECT * FROM scrape_cache WHERE query_hash = ?")
    .get(hash) as CacheRow | undefined;

  if (!cached) return true;

  const hoursSinceLastScrape =
    (Date.now() - new Date(cached.last_scraped).getTime()) / 3_600_000;

  return hoursSinceLastScrape >= 1;
}

export function updateScrapeCache(
  searchTerm: string,
  location: string,
  sites: string[],
  resultCount: number
): void {
  const db = getDb();
  const hash = queryHash(searchTerm, location, sites);

  db.prepare(
    `INSERT INTO scrape_cache (query_hash, search_term, location, sites, last_scraped, result_count)
     VALUES (?, ?, ?, ?, datetime('now'), ?)
     ON CONFLICT(query_hash) DO UPDATE SET
       last_scraped = datetime('now'),
       result_count = ?`
  ).run(hash, searchTerm, location || null, sites.join(","), resultCount, resultCount);
}

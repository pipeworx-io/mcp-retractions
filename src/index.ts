interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Retractions / research-integrity MCP.
 *
 * Keyless: check whether a paper (by DOI) has been retracted and search the
 * retracted literature, via Crossref — which hosts the Retraction Watch
 * database (~73k retracted works, update-type:retraction). Free, no key.
 *
 * Honest scope: Crossref's retraction coverage depends on publishers depositing
 * the metadata, so a "not retracted" is "no retraction on record", not proof —
 * the tools say so. Complements the scholarly stack (crossref/openalex/pubmed).
 */


const BASE = 'https://api.crossref.org';
const UA = 'pipeworx-mcp-retractions/1.0 (+https://pipeworx.io; mailto:hi@pipeworx.io)';

function cleanDoi(doi: string): string {
  return doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').replace(/^doi:/i, '');
}

async function cr(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 404) return { _notFound: true };
  if (!res.ok) throw new Error(`Crossref error: ${res.status} ${await res.text().then((t) => t.slice(0, 160))}`);
  return res.json();
}

const tools: McpToolExport['tools'] = [
  {
    name: 'check_retraction',
    description:
      "Check whether a paper (by DOI) has been retracted, according to Crossref/Retraction Watch (keyless). Returns retracted:true/false with the evidence (title marker + retraction-notice link). NOTE: 'not retracted' means no retraction is on record — coverage depends on the publisher, so it is not definitive proof the paper is clean.",
    inputSchema: { type: 'object', properties: { doi: { type: 'string', description: 'A DOI, e.g. "10.1016/j.micpro.2020.103768" (or a doi.org URL).' } }, required: ['doi'] },
  },
  {
    name: 'search_retractions',
    description: 'Search the retracted literature (Crossref update-type:retraction, ~73k works) by keyword, optionally filtered by subject and publication year range. Returns retracted works with DOI, title, journal and date.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword(s) to search retracted works (title/abstract/author).' },
        from_year: { type: 'number', description: 'Only retractions published from this year onward.' },
        until_year: { type: 'number', description: 'Only retractions published up to this year.' },
        rows: { type: 'number', description: 'Max results (1-100, default 20).' },
      },
      required: ['query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'check_retraction': {
      const doi = cleanDoi(reqStr(args, 'doi', '"10.1016/j.micpro.2020.103768"'));
      const j = await cr(`/works/${doi}`);
      if (j._notFound) return { doi, found: false, reason: 'DOI not found in Crossref.' };
      const m = j.message ?? {};
      const title = m.title?.[0] ?? '';
      const updateTo = (m['update-to'] ?? []).filter((u: any) => /retract/i.test(u.type || ''));
      const titleFlag = /RETRACTED|^\s*(retraction|withdrawn)\b/i.test(title);
      const relRetracted = !!(m.relation?.['is-retracted-by']);
      const retracted = titleFlag || updateTo.length > 0 || relRetracted;
      return {
        doi, found: true, retracted,
        title,
        journal: m['container-title']?.[0] ?? null,
        published: (m.published?.['date-parts']?.[0] ?? []).join('-') || null,
        evidence: { title_marked_retracted: titleFlag, has_retraction_notice: updateTo.length > 0, crossref_relation: relRetracted },
        retraction_notice: updateTo.length ? updateTo.map((u: any) => ({ doi: u.DOI, label: u.label })) : null,
        note: retracted ? 'Retraction is on record.' : 'No retraction on record in Crossref — coverage depends on the publisher, so this is not definitive proof the paper is clean.',
      };
    }
    case 'search_retractions': {
      const query = reqStr(args, 'query', '"stem cells"');
      const rows = clamp(numArg(args.rows, 20), 1, 100);
      const p = new URLSearchParams({ filter: 'update-type:retraction', query, rows: String(rows), select: 'DOI,title,container-title,published,subject,author' });
      const filters: string[] = ['update-type:retraction'];
      if (typeof args.from_year === 'number') filters.push(`from-pub-date:${args.from_year}-01-01`);
      if (typeof args.until_year === 'number') filters.push(`until-pub-date:${args.until_year}-12-31`);
      p.set('filter', filters.join(','));
      const j = await cr(`/works?${p}`);
      const items = j.message?.items ?? [];
      return {
        query,
        total_matches: j.message?.['total-results'] ?? null,
        count: items.length,
        retractions: items.map((it: any) => ({
          doi: it.DOI,
          title: it.title?.[0] ?? null,
          journal: it['container-title']?.[0] ?? null,
          published: (it.published?.['date-parts']?.[0] ?? []).join('-') || null,
          subjects: it.subject ?? null,
          authors: (it.author ?? []).slice(0, 5).map((a: any) => `${a.given ?? ''} ${a.family ?? ''}`.trim()),
        })),
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}
function numArg(v: unknown, d: number): number { const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN; return Number.isFinite(n) ? n : d; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, Math.trunc(n))); }

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Search, Users, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Candidate, Vacancy } from '@/lib/types';

interface SearchData {
  candidates: Pick<Candidate, 'id' | 'name' | 'stage' | 'recruiter' | 'finalStatus' | 'vacancyId'>[];
  vacancies: Pick<Vacancy, 'id' | 'title' | 'area' | 'status'>[];
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [data, setData] = React.useState<SearchData>({ candidates: [], vacancies: [] });
  const [loading, setLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [c, v] = await Promise.all([
          fetch('/api/candidates').then((r) => r.json()),
          fetch('/api/vacancies').then((r) => r.json()),
        ]);
        setData({ candidates: c.data || [], vacancies: v.data || [] });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const q = query.toLowerCase().trim();
  const matchedCandidates = q
    ? data.candidates
        .filter((c) =>
          `${c.name} ${c.id} ${c.recruiter || ''} ${c.vacancyId || ''}`
            .toLowerCase()
            .includes(q),
        )
        .slice(0, 6)
    : [];
  const matchedVacancies = q
    ? data.vacancies
        .filter((v) =>
          `${v.title} ${v.id} ${v.area}`.toLowerCase().includes(q),
        )
        .slice(0, 6)
    : [];

  const empty = q && !matchedCandidates.length && !matchedVacancies.length;
  const showResults = open && q;

  function navigate(path: string) {
    setOpen(false);
    setQuery('');
    router.push(path);
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Buscar candidatos, vacantes... (Ctrl+K)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="bg-muted/40 pl-10 pr-9"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Limpiar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 max-h-[480px] overflow-y-auto rounded-xl border border-border bg-popover/95 p-2 shadow-2xl backdrop-blur-xl scrollbar-thin"
          >
            {loading && (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                Cargando datos…
              </p>
            )}
            {!loading && empty && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Sin resultados para “{query}”
              </p>
            )}
            {!loading && matchedCandidates.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Candidatos
                </p>
                {matchedCandidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/dashboard/candidatos?q=${encodeURIComponent(c.name)}`)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
                  >
                    <Users className="h-4 w-4 shrink-0 text-brand-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.id} · {c.recruiter || 'Sin reclutador'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {c.stage}
                    </Badge>
                  </button>
                ))}
              </>
            )}
            {!loading && matchedVacancies.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vacantes
                </p>
                {matchedVacancies.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => navigate(`/dashboard/vacantes`)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
                  >
                    <Briefcase className="h-4 w-4 shrink-0 text-brand-aqua-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{v.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {v.id} · {v.area}
                      </p>
                    </div>
                    <Badge
                      variant={v.status === 'Abierta' ? 'success' : 'outline'}
                      className="text-[10px]"
                    >
                      {v.status}
                    </Badge>
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

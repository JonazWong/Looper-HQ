'use client';

/**
 * FacetPanel — shows facet counts for court / year / category / judge
 * and lets users toggle individual facet values on/off.
 */

import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';

export interface FacetBucket {
  value: string;
  count: number;
}

export interface Facets {
  courts: FacetBucket[];
  years: FacetBucket[];
  categories: FacetBucket[];
  judges: FacetBucket[];
}

export interface ActiveFacets {
  court?: string;
  year?: string;
  category?: string;
  judge?: string;
}

interface FacetGroupProps {
  title: string;
  buckets: FacetBucket[];
  activeValue?: string;
  onToggle: (value: string) => void;
  /** Show at most this many items before "Show more" */
  maxVisible?: number;
}

function FacetGroup({ title, buckets, activeValue, onToggle, maxVisible = 6 }: FacetGroupProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  if (!buckets.length) return null;

  const visible = showAll ? buckets : buckets.slice(0, maxVisible);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left text-sm font-semibold text-premier-pearl mb-2"
      >
        <span>{title}</span>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-premier-pearl-gray" />
        ) : (
          <ChevronRight className="h-4 w-4 text-premier-pearl-gray" />
        )}
      </button>

      {expanded && (
        <ul className="space-y-1">
          {visible.map((b) => {
            const isActive = activeValue === b.value;
            return (
              <li key={b.value}>
                <button
                  type="button"
                  onClick={() => onToggle(b.value)}
                  className={`flex items-center justify-between w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-premier-gold/20 text-premier-gold border border-premier-gold/40'
                      : 'text-premier-pearl-gray hover:bg-premier-pearl-gray/10 hover:text-premier-pearl'
                  }`}
                >
                  <span className="truncate flex-1 mr-2">{b.value}</span>
                  <span
                    className={`text-xs flex-shrink-0 ${
                      isActive ? 'text-premier-gold' : 'text-premier-pearl-dark'
                    }`}
                  >
                    {b.count}
                  </span>
                  {isActive && <X className="h-3 w-3 ml-1 flex-shrink-0" />}
                </button>
              </li>
            );
          })}

          {!showAll && buckets.length > maxVisible && (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-xs text-premier-gold hover:underline px-2 py-1"
              >
                顯示全部 {buckets.length} 項
              </button>
            </li>
          )}

          {showAll && buckets.length > maxVisible && (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                className="text-xs text-premier-pearl-gray hover:underline px-2 py-1"
              >
                收起
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

interface FacetPanelProps {
  facets: Facets;
  active: ActiveFacets;
  onChange: (key: keyof ActiveFacets, value: string) => void;
}

export function FacetPanel({ facets, active, onChange }: FacetPanelProps) {
  const toggle = (key: keyof ActiveFacets) => (value: string) => {
    // Toggle: if already active, clear; otherwise set
    onChange(key, active[key] === value ? '' : value);
  };

  return (
    <div className="space-y-1">
      <FacetGroup
        title="法院"
        buckets={facets.courts}
        activeValue={active.court}
        onToggle={toggle('court')}
      />
      <FacetGroup
        title="年份"
        buckets={facets.years}
        activeValue={active.year}
        onToggle={toggle('year')}
      />
      <FacetGroup
        title="類別"
        buckets={facets.categories}
        activeValue={active.category}
        onToggle={toggle('category')}
      />
      <FacetGroup
        title="法官"
        buckets={facets.judges}
        activeValue={active.judge}
        onToggle={toggle('judge')}
      />
    </div>
  );
}

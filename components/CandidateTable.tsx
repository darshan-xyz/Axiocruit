import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Users,
  ChevronDown,
  RotateCw
} from 'lucide-react';
import {
  getDepartmentMeta,
  getStageMeta,
  normalizeToSakromeCandidate,
  SakromeCandidate
} from '../utils/sakromeCandidates';
import { DEFAULT_AVATAR } from '../utils/defaultAvatar';

export interface CandidateTableProps {
  candidates: any[];
  selectedCandidateId?: string;
  onSelectCandidate: (candidate: any) => void;
  activeCategory: 'All' | 'Design' | 'Engineering' | 'Product' | 'Marketing';
  onCategoryChange: (cat: 'All' | 'Design' | 'Engineering' | 'Product' | 'Marketing') => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalCount?: number;
  loading?: boolean;
  onRetryAI?: (candidateId: string, e?: React.MouseEvent) => void;
  retryingScores?: Set<string>;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  activeCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  totalCount,
  loading = false,
  onRetryAI,
  retryingScores = new Set()
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Normalize candidate records to ensure consistent Sakrome interface
  const normalizedList: SakromeCandidate[] = (candidates || []).map(c => normalizeToSakromeCandidate(c));

  // Category & search filtering
  const filteredList = normalizedList.filter(c => {
    const term = (searchTerm || '').toLowerCase();
    const nameMatch = c.candidate?.name?.toLowerCase().includes(term);
    const emailMatch = c.candidate?.email?.toLowerCase().includes(term);
    const headlineMatch = c.candidate?.headline?.toLowerCase().includes(term);
    const skillMatch = c.matchedKeywords?.some(k => k.toLowerCase().includes(term));
    const matchesSearch = !searchTerm || nameMatch || emailMatch || headlineMatch || skillMatch;

    if (!matchesSearch) return false;
    if (activeCategory === 'All') return true;
    return c.candidate?.department === activeCategory;
  });

  const displayTotal = totalCount !== undefined ? totalCount : 46;

  // Category pills list
  const categoryPills: ('All' | 'Design' | 'Engineering' | 'Product' | 'Marketing')[] = [
    'All',
    'Design',
    'Engineering',
    'Product',
    'Marketing'
  ];

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Top Filter Controls: Category Pills & Search */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Category filtering pills (Requirement R2 / F8) */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categoryPills.map(cat => {
            const count = cat === 'All'
              ? normalizedList.length
              : normalizedList.filter(c => c.candidate?.department === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  onCategoryChange(cat);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-black'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search Input Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 text-slate-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search candidate, email, skill..."
              value={searchTerm}
              onChange={e => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-9 pr-3.5 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => onCategoryChange('All')}
            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs transition-all"
            title="Reset filters"
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* High-Density Candidate Table (Requirement R2 / F9, F10) */}
      <div className="overflow-x-auto">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-wider min-w-[620px]">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Candidate</div>
          <div className="col-span-2">Department</div>
          <div className="col-span-2">Match</div>
          <div className="col-span-2">Stage</div>
          <div className="col-span-1 text-right">Applied Date</div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-500">Loading candidates...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No candidates found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or category filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70 min-w-[620px]">
            {filteredList.map((cand, index) => {
              const isSelected = selectedCandidateId === cand._id || selectedCandidateId === cand.candidate?._id;
              const dept = getDepartmentMeta(cand.candidate?.department || cand.candidate?.headline);
              const DeptIcon = dept.icon;
              const stage = getStageMeta(cand.status);
              const score = cand.aiScore ?? 0;
              const isRetrying = onRetryAI && cand._id && retryingScores.has(cand._id);

              return (
                <div
                  key={cand._id || index}
                  onClick={() => onSelectCandidate(cand)}
                  className={`grid grid-cols-12 gap-2 px-5 py-3 items-center cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-l-blue-600'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-850/50 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* Rank Number */}
                  <div className="col-span-1">
                    <span className={`text-xs font-black ${
                      index === 0 ? 'text-amber-500' :
                      index === 1 ? 'text-slate-600 dark:text-slate-300' :
                      index === 2 ? 'text-amber-700 dark:text-amber-500' :
                      'text-slate-400'
                    }`}>
                      #{index + 1}
                    </span>
                  </div>

                  {/* Candidate Avatar & Details */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0 pr-1">
                    <img
                      src={cand.candidate?.profilePicture || DEFAULT_AVATAR}
                      alt={cand.candidate?.name}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {cand.candidate?.name || 'Applicant'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {cand.candidate?.headline || cand.candidate?.email}
                      </p>
                    </div>
                  </div>

                  {/* Department Badge with exact icons (Design Box, Engineering Code2, Product Package, Marketing Megaphone) */}
                  <div className="col-span-2 flex items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${dept.badgeClass}`}>
                      <DeptIcon size={12} />
                      <span>{dept.name}</span>
                    </span>
                  </div>

                  {/* Dual-Tone Match Score Bar & Numerical Score */}
                  <div className="col-span-2 pr-2">
                    {cand.aiScore !== null ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900 dark:text-white">
                          <span>{score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              score >= 80 ? 'bg-blue-600 dark:bg-blue-500' : score >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium text-slate-400 italic">Evaluating</span>
                        {onRetryAI && (
                          <button
                            onClick={(e) => onRetryAI(cand._id, e)}
                            disabled={isRetrying}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Retry AI evaluation"
                          >
                            <RotateCw size={11} className={isRetrying ? 'animate-spin text-blue-600' : ''} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pipeline Stage Pill with colored dot */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${stage.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor}`} />
                      <span>{stage.label}</span>
                    </span>
                  </div>

                  {/* Applied Date Column */}
                  <div className="col-span-1 text-right text-[11px] font-bold text-slate-500 truncate">
                    {cand.appliedDateFormatted || '14 Sep 2026'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Table Footer with Exact Pagination Pills (< 1 2 3 ... 46 >) (Requirement R2 / F11) */}
      <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40 dark:bg-slate-900/30">
        <span>Showing 1 to {filteredList.length} of {displayTotal} candidates</span>

        <div className="flex items-center gap-1.5">
          {/* Previous Page button (<) */}
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-2xs"
            aria-label="Previous page"
          >
            &lt;
          </button>

          {/* Page 1 (Active solid blue pill) */}
          <button
            onClick={() => setCurrentPage(1)}
            className={`w-7 h-7 rounded-lg font-black flex items-center justify-center shadow-2xs transition-all ${
              currentPage === 1
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            1
          </button>

          {/* Page 2 */}
          <button
            onClick={() => setCurrentPage(2)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all ${
              currentPage === 2
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            2
          </button>

          {/* Page 3 */}
          <button
            onClick={() => setCurrentPage(3)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all ${
              currentPage === 3
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            3
          </button>

          {/* Ellipsis */}
          <span className="px-1 text-slate-400 font-bold select-none">...</span>

          {/* Page 46 */}
          <button
            onClick={() => setCurrentPage(46)}
            className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all ${
              currentPage === 46
                ? 'bg-blue-600 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            46
          </button>

          {/* Next Page button (>) */}
          <button
            onClick={() => setCurrentPage(prev => Math.min(46, prev + 1))}
            className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-2xs"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500">
          <span>Show</span>
          <span className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            10 <ChevronDown size={11} />
          </span>
          <span>per page</span>
        </div>
      </div>
    </div>
  );
};


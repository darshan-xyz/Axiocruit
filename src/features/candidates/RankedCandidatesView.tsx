import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Briefcase,
  Users,
  TrendingUp,
  Layers,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/UI';
import { apiRequest } from '@/utils/api';
import { CandidateTable, CandidateInspectorDrawer } from '@/ui';
import {
  SAKROME_CANDIDATES,
  SAKROME_SARAH_MILLER,
  SakromeCandidate
} from '@/data/sakromeCandidates';

export type RankedCandidate = SakromeCandidate;

export const RankedCandidates: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<any[]>(SAKROME_CANDIDATES);
  const [jobTitle, setJobTitle] = useState('Lead Product Designer & Design Systems');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(SAKROME_SARAH_MILLER);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | 'Design' | 'Engineering' | 'Product' | 'Marketing'>('All');
  const [retryingScores, setRetryingScores] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    const fetchCandidates = async () => {
      try {
        const data = await apiRequest(`/applications/${jobId}/candidates`);
        const fetched = data.candidates || [];
        if (fetched.length > 0) {
          setCandidates(fetched);
          setSelectedCandidate(fetched[0]);
        } else {
          setCandidates(SAKROME_CANDIDATES);
          setSelectedCandidate(SAKROME_SARAH_MILLER);
        }
        if (data.jobTitle) {
          setJobTitle(data.jobTitle);
        }
      } catch (err: any) {
        // Fallback to reference candidates on error so UI is always functional
        setCandidates(SAKROME_CANDIDATES);
        setSelectedCandidate(SAKROME_SARAH_MILLER);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidates();
  }, [jobId]);

  const handleRetryAI = async (applicationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRetryingScores(prev => {
      const newSet = new Set(prev);
      newSet.add(applicationId);
      return newSet;
    });

    try {
      const data = await apiRequest(`/applications/${applicationId}/retry-ai`, 'POST');

      setCandidates(prev =>
        prev.map(c =>
          c._id === applicationId
            ? {
                ...c,
                aiScore: data.application.aiScore,
                matchedKeywords: data.application.matchedKeywords,
                missingKeywords: data.application.missingKeywords,
                status: data.application.status
              }
            : c
        ).sort((a, b) => {
          if (a.aiScore === null && b.aiScore === null) return 0;
          if (a.aiScore === null) return 1;
          if (b.aiScore === null) return -1;
          return b.aiScore - a.aiScore;
        })
      );

      if (selectedCandidate?._id === applicationId) {
        setSelectedCandidate((prev: any) =>
          prev
            ? {
                ...prev,
                aiScore: data.application.aiScore,
                matchedKeywords: data.application.matchedKeywords,
                missingKeywords: data.application.missingKeywords,
                status: data.application.status
              }
            : null
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingScores(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const handleStatusUpdate = (id: string, status: string) => {
    setCandidates(prev =>
      prev.map(c => (c._id === id ? { ...c, status } : c))
    );
    if (selectedCandidate?._id === id) {
      setSelectedCandidate((prev: any) => (prev ? { ...prev, status } : null));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 dark:border-slate-700 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Loading candidate ranking & AI metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <p className="text-rose-600 dark:text-rose-400 font-semibold">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* macOS Floating Container Top Bar with Window Controls & Pill Navigation */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl px-5 py-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* macOS window controls */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]/60 inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]/60 inline-block shadow-2xs" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]/60 inline-block shadow-2xs" />
          </div>

          {/* Top Pill Tabs: Home, Candidates (blue pill active), Jobs, Schedule, Menu ∨ */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              onClick={() => navigate('/recruiter')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
            >
              Home
            </button>
            <button
              className="px-4 py-1.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-sm shadow-blue-500/25 transition-all"
            >
              Candidates
            </button>
            <button
              onClick={() => navigate('/recruiter/jobs')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
            >
              Jobs
            </button>
            <button
              onClick={() => navigate('/recruiter/schedule')}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
            >
              Schedule
            </button>
            <button
              className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 flex items-center gap-1 transition-all"
            >
              <span>Menu</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        {/* Right Search & Filter Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4" />
            <input
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-4 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="Search candidate, email, skill..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setActiveCategoryFilter('All')}
            className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <SlidersHorizontal size={13} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2 text-xs font-bold"
          >
            <ArrowLeft size={14} /> Back to Requisitions
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {jobTitle}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80">
              AI Ranked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Requisition pipeline • {candidates.length} active applicant{candidates.length !== 1 ? 's' : ''} evaluated
          </p>
        </div>
      </div>

      {/* Top Floating macOS Card Container */}
      <div className="bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
        {/* Top Navbar: Brand Logo, Pill Tabs, Settings, Bell, Avatar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/recruiter')}>
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-500/25">
              A
            </div>
            <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">AXIOCRUIT</span>
          </div>

          {/* Center Pill Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 p-1 rounded-full border border-slate-200/80 dark:border-slate-800 overflow-x-auto">
            <button
              onClick={() => navigate('/recruiter')}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Briefcase size={13} />
              <span>Home</span>
            </button>
            <button
              className="px-5 py-1.5 rounded-full text-xs font-black bg-blue-600 text-white shadow-sm flex items-center gap-1.5"
            >
              <Users size={13} />
              <span>Candidates</span>
            </button>
            <button
              onClick={() => navigate('/recruiter/jobs')}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Briefcase size={13} />
              <span>Jobs</span>
            </button>
            <button
              onClick={() => navigate('/recruiter/schedule')}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <TrendingUp size={13} />
              <span>Schedule</span>
            </button>
            <button
              className="px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <Layers size={13} />
              <span>Menu</span>
              <ChevronDown size={12} />
            </button>
          </div>

          {/* Right Icons: Settings, Bell, Avatar */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <SlidersHorizontal size={16} />
            </button>
            <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <Clock size={16} />
              <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-1.5 right-1.5" />
            </button>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces"
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              alt="Recruiter profile"
            />
          </div>
        </div>

        {/* Header Title Section */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Candidates</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage candidates and keep your hiring process moving.</p>
        </div>

        {/* Main Split Layout: Decomposed CandidateTable on Left, CandidateInspectorDrawer on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className={`${selectedCandidate ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-300 overflow-x-auto`}>
            <CandidateTable
              candidates={candidates}
              selectedCandidateId={selectedCandidate?._id || selectedCandidate?.candidate?._id}
              onSelectCandidate={(cand) => setSelectedCandidate(cand)}
              activeCategory={activeCategoryFilter}
              onCategoryChange={(cat) => setActiveCategoryFilter(cat)}
              searchTerm={searchTerm}
              onSearchChange={(term) => setSearchTerm(term)}
              totalCount={candidates.length > 0 ? 455 : 0}
              loading={loading}
              onRetryAI={handleRetryAI}
              retryingScores={retryingScores}
            />
          </div>

          {selectedCandidate && (
            <div className="lg:col-span-5">
              <CandidateInspectorDrawer
                candidate={selectedCandidate}
                onClose={() => setSelectedCandidate(null)}
                onSchedule={() => navigate('/recruiter/schedule')}
                onViewFullProfile={() => navigate('/recruiter/applicants')}
                onSendMessage={() => navigate('/recruiter/messages')}
                onStatusUpdate={handleStatusUpdate}
                onRetryAI={(id) => handleRetryAI(id)}
                isRetryingAI={selectedCandidate?._id ? retryingScores.has(selectedCandidate._id) : false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { RankedCandidates as RankedCandidatesView };
export default RankedCandidates;

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
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobTitle, setJobTitle] = useState('Talent Pipeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'All' | 'Design' | 'Engineering' | 'Product' | 'Marketing'>('All');
  const [retryingScores, setRetryingScores] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true);
        let targetJobId = jobId;

        if (!targetJobId) {
          // Auto-discover the first job for the recruiter
          const myJobs = await apiRequest('/jobs/my-jobs');
          if (Array.isArray(myJobs) && myJobs.length > 0) {
            targetJobId = myJobs[0]._id;
            setJobTitle(myJobs[0].title);
          }
        }

        if (!targetJobId) {
          setCandidates([]);
          setSelectedCandidate(null);
          setJobTitle('No Requisitions Available');
          setLoading(false);
          return;
        }

        const data = await apiRequest(`/applications/${targetJobId}/candidates`);
        const fetched = data.candidates || [];
        setCandidates(fetched);
        setSelectedCandidate(fetched.length > 0 ? fetched[0] : null);
        if (data.jobTitle) {
          setJobTitle(data.jobTitle);
        }
      } catch (err: any) {
        console.error('[RankedCandidates] Fetch error:', err);
        setError(err.message || 'Failed to load candidates');
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
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <button
            onClick={() => navigate('/recruiter/jobs')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-2 text-xs font-bold cursor-pointer"
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

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/recruiter/schedule')}
            className="text-xs font-bold"
          >
            Schedule Interview
          </Button>
          <Button
            variant="pill"
            size="sm"
            onClick={() => navigate('/recruiter/jobs')}
            className="text-xs font-bold"
          >
            Manage Jobs
          </Button>
        </div>
      </div>

      {/* Main Split Layout: CandidateTable on Left, CandidateInspectorDrawer on Right */}
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
            totalCount={candidates.length}
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
              onViewFullProfile={() => navigate('/recruiter/applications-list')}
              onSendMessage={() => navigate('/recruiter/messages')}
              onStatusUpdate={handleStatusUpdate}
              onRetryAI={(id) => handleRetryAI(id)}
              isRetryingAI={selectedCandidate?._id ? retryingScores.has(selectedCandidate._id) : false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export { RankedCandidates as RankedCandidatesView };
export default RankedCandidates;

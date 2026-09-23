import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@/ui';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { apiRequest } from '@/core/api';
import { useToast } from '@/ui';

export const SubmitFeedbackView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast, ToastContainer } = useToast();

  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [technicalScore, setTechnicalScore] = useState<number | ''>('');
  const [communicationScore, setCommunicationScore] = useState<number | ''>('');
  const [recommendation, setRecommendation] = useState<'Strong Hire' | 'Hire' | 'No Hire'>('Hire');
  const [detailedFeedback, setDetailedFeedback] = useState('');

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const data = await apiRequest(`/interviews/${id}`);
        setInterview(data);
      } catch (err: any) {
        addToast('error', err.message || 'Failed to fetch interview details.');
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id, addToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (technicalScore === '' || communicationScore === '' || !detailedFeedback.trim()) {
      addToast('error', 'Please fill out all fields before submitting.');
      return;
    }

    if (
      Number(technicalScore) < 0 ||
      Number(technicalScore) > 100 ||
      Number(communicationScore) < 0 ||
      Number(communicationScore) > 100
    ) {
      addToast('error', 'Scores must be between 0 and 100.');
      return;
    }

    try {
      setSubmitting(true);
      await apiRequest(`/interviews/${id}/feedback`, 'POST', {
        technicalScore: Number(technicalScore),
        communicationScore: Number(communicationScore),
        detailedFeedback,
        recommendation,
      });

      addToast('success', 'Feedback submitted successfully!');
      setTimeout(() => {
        navigate('/interviewer');
      }, 1000);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to submit feedback.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-3 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="text-center p-20 text-neutral-400">
        Interview not found or you do not have access.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Submit Candidate Feedback</h1>
      <p className="text-neutral-400 mb-8">
        Evaluating candidate:{' '}
        <span className="text-slate-900 dark:text-white font-semibold">
          {interview.candidateId?.name || 'Candidate'}
        </span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-8 space-y-6 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <Star className="text-blue-600 dark:text-blue-400" size={20} /> Scores (0-100)
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Technical Score</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 85"
                  value={technicalScore}
                  onChange={(e) => setTechnicalScore(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Communication Score</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 90"
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <ThumbsUp className="text-blue-600 dark:text-blue-400" size={20} /> Recommendation
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(['Strong Hire', 'Hire', 'No Hire'] as const).map((rec) => (
                <button
                  type="button"
                  key={rec}
                  onClick={() => setRecommendation(rec)}
                  className={`p-4 rounded-xl border text-center font-medium transition-all ${
                    recommendation === rec
                      ? rec === 'Strong Hire'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold'
                        : rec === 'Hire'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-slate-900 dark:text-white">
              <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} /> Detailed Evaluation & Remarks
            </h3>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 min-h-[140px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-sm"
              placeholder="Detail the candidate's strengths, weaknesses, problem-solving approach, and overall suitability..."
              value={detailedFeedback}
              onChange={(e) => setDetailedFeedback(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" type="button" onClick={() => navigate('/interviewer')}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default SubmitFeedbackView;

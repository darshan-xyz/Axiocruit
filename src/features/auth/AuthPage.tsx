import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/UI';
import { Eye, EyeOff } from 'lucide-react';
import { UserRole, normalizeRole, getRoleHome } from '@/types';
import { apiRequest } from '@/utils/api';
import { useTheme } from '@/core/ThemeContext';
import { useAuth } from '@/core/AuthContext';

export interface AuthPageProps {
  type: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ type }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('CANDIDATE');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (type === 'signup' && formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '/auth/login';
      if (type === 'signup') {
        if (role === 'CANDIDATE') endpoint = '/auth/register-candidate';
        else if (role === 'RECRUITER') endpoint = '/auth/register-org';
        else if (role === 'INTERVIEWER') endpoint = '/auth/register-freelancer';
      }

      const payload = type === 'login'
        ? { email: formData.email.toLowerCase(), password: formData.password }
        : { ...formData, email: formData.email.toLowerCase(), role };

      const data = await apiRequest(endpoint, 'POST', payload);

      const canonicalRole = normalizeRole(data.role);
      data.role = canonicalRole;

      login(data.token, { ...data, role: canonicalRole });

      navigate(getRoleHome(canonicalRole));

    } catch (err: any) {
      console.error('Auth Failed:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-[100dvh] w-full flex items-center justify-center px-4 py-16 font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0A0E1A] text-slate-100' : 'bg-[#EDF2F7] text-slate-900'
    }`}>
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-8 flex flex-col items-center">
          <div
            className={`mb-3 cursor-pointer w-12 h-12 rounded-2xl ${
              isDark ? 'bg-blue-600 border border-blue-500 text-white shadow-blue-500/20' : 'bg-[#D4F882] border-2 border-[#111111] text-[#111111]'
            } flex items-center justify-center font-black text-xl shadow-md transition-colors`}
            onClick={() => navigate('/')}
          >
            P
          </div>
          <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#111111]'}`}>
            {type === 'login' ? 'Sign in to Procruit' : 'Create an Account'}
          </h2>
          <p className={`mt-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {type === 'login' ? 'Access your intelligence hiring workspace.' : 'Join the next-generation talent platform.'}
          </p>
        </div>

        <div className={`${
          isDark ? 'bg-[#111726] border-slate-700 text-slate-100 shadow-black/60' : 'bg-white border-slate-300 text-slate-900'
        } rounded-[28px] p-6 sm:p-8 border shadow-xl transition-colors`}>
          <form onSubmit={handleSubmit} className="space-y-4">

            {type === 'signup' && (
              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>Select Your Role</label>
                <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-2xl ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'} border transition-colors`}>
                  {(['CANDIDATE', 'RECRUITER', 'INTERVIEWER'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`text-xs font-extrabold py-2 rounded-xl transition-all cursor-pointer ${
                        role === r
                          ? (isDark ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-[#111111] shadow-sm')
                          : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')
                      }`}
                    >
                      {r === 'INTERVIEWER' ? 'Freelancer' : r === 'RECRUITER' ? 'Organization' : 'Candidate'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {type === 'signup' && (
              <Input
                label="Full Name"
                placeholder="Alex Morgan"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="name@company.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              endIcon={showPassword ? EyeOff : Eye}
              onEndIconClick={() => setShowPassword(!showPassword)}
            />

            {type === 'signup' && (
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                endIcon={showConfirmPassword ? EyeOff : Eye}
                onEndIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' : 'bg-[#111111] text-white hover:bg-black shadow-md'
              } font-extrabold py-3 rounded-full transition-all text-sm mt-2 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer`}
            >
              {loading ? 'Processing...' : (type === 'login' ? 'Sign In ↗' : 'Create Account ↗')}
            </button>
          </form>

          <div className={`mt-6 text-center text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {type === 'login' ? (
              <>Don't have an account? <span onClick={() => navigate('/signup')} className={`${isDark ? 'text-blue-400' : 'text-[#111111]'} font-black cursor-pointer hover:underline`}>Sign up</span></>
            ) : (
              <>Already have an account? <span onClick={() => navigate('/login')} className={`${isDark ? 'text-blue-400' : 'text-[#111111]'} font-black cursor-pointer hover:underline`}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

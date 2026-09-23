import React from 'react';
import { useTheme } from '@/core/ThemeContext';
import { PublicNavbar } from './PublicNavbar';
import { HeroHerbSection } from './HeroHerbSection';
import { FeatureComparisonMatrix } from './FeatureComparisonMatrix';
import { PublicFooterCTA } from './PublicFooterCTA';

export const HomePage: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className={`space-y-0 overflow-x-hidden min-h-[100dvh] font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-[#0A0E1A] text-slate-100' : 'text-[#111111]'}`}>
      <PublicNavbar />
      <HeroHerbSection />
      <FeatureComparisonMatrix />
      <PublicFooterCTA />
    </div>
  );
};

export default HomePage;

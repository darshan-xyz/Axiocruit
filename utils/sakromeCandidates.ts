import React from 'react';
import { Box, Code2, Package, Megaphone } from 'lucide-react';

export type SakromeDepartment = 'Design' | 'Engineering' | 'Product' | 'Marketing';
export type SakromeStage = 'Interview' | 'Screening' | 'Assessment' | 'New';

export interface SakromeExperience {
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface SakromeEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface SakromeNote {
  id: string;
  author: string;
  date: string;
  content: string;
}

export interface SakromeFile {
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface SakromeCandidate {
  _id: string;
  candidate: {
    _id: string;
    name: string;
    email: string;
    headline: string;
    department: SakromeDepartment;
    location: string;
    yearsOfExperience: number;
    phone: string;
    profilePicture: string;
    availability: string;
    salaryExpected: string;
    source: string;
    bio: string;
    skills: string[];
    experience: SakromeExperience[];
    education: SakromeEducation[];
    notes?: SakromeNote[];
    files?: SakromeFile[];
  };
  aiScore: number | null;
  matchLabel: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  status: SakromeStage | string;
  appliedAt: string;
  appliedDateFormatted: string;
  aiSummary: string;
  nextInterviewSlot?: {
    date: string;
    time: string;
    interviewer: string;
    roomLink: string;
  };
  resumeUrl: string;
  jobTitle?: string;
}

/**
 * Canonical Sarah Miller candidate profile matching Requirement R2 / Sakrome reference:
 * Senior Product Designer, 83% AI match score, stage 'Interview', Design department, applied date '14 Sep 2026'.
 */
export const SAKROME_SARAH_MILLER: SakromeCandidate = {
  _id: 'cand-sarah-miller',
  candidate: {
    _id: 'user-sarah-miller',
    name: 'Sarah Miller',
    email: 'sarahmiller@gmail.com',
    headline: 'Senior Product Designer',
    department: 'Design',
    location: 'San Francisco, CA',
    yearsOfExperience: 5,
    phone: '+1 (415) 555-0134',
    profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    availability: 'Available in 2 weeks',
    salaryExpected: ' - ',
    source: 'LinkedIn',
    bio: 'Senior Product Designer with 5+ years of experience leading UI/UX initiatives for high-growth SaaS and enterprise design systems. Deep expertise in multi-platform design tokens, design research, accessibility (WCAG 2.1 AAA), and close engineering partnership.',
    skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'User Flow', 'Wireframing'],
    experience: [
      {
        role: 'Senior Product Designer',
        company: 'Vanguard Design Studio',
        period: '2023 – Present (2 yrs)',
        description: 'Led end-to-end design of modular design system adopted by 14 product squads. Reduced cross-functional UI turnaround by 38%.'
      },
      {
        role: 'Product Designer',
        company: 'Apex Cloud Platforms',
        period: '2021 – 2023 (2 yrs)',
        description: 'Architected self-serve onboarding flow increasing 30-day conversion by 24%. Conducted 60+ moderated usability tests.'
      },
      {
        role: 'UI/UX Designer',
        company: 'Forma Interactive',
        period: '2019 – 2021 (2 yrs)',
        description: 'Created comprehensive mobile application design specs for iOS and Android, focusing on micro-interactions and atomic design.'
      }
    ],
    education: [
      {
        degree: 'B.S. Human-Computer Interaction',
        institution: 'Stanford University',
        year: '2015 – 2019'
      }
    ],
    notes: [
      {
        id: 'note-1',
        author: 'Kevin Nunez',
        date: '14 Sep 2026',
        content: 'Exceptional visual polish and systematic thinking during screening. Recommended for team presentation on design tokens.'
      },
      {
        id: 'note-2',
        author: 'Russel Sims',
        date: '12 Sep 2026',
        content: 'Strong cultural fit. Passionate about developer handoff and Figma Variables automation.'
      }
    ],
    files: [
      {
        name: 'Sarah_Miller_Resume_2026.pdf',
        size: '1.8 MB',
        type: 'PDF Document',
        url: '#'
      },
      {
        name: 'Design_System_Portfolio_CaseStudy.pdf',
        size: '14.2 MB',
        type: 'PDF Presentation',
        url: '#'
      }
    ]
  },
  aiScore: 83,
  matchLabel: 'Strong match',
  matchedKeywords: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'User Flow', 'Wireframing'],
  missingKeywords: ['3D Spline', 'Framer Motion'],
  status: 'Interview',
  appliedAt: '2026-09-14T10:30:00.000Z',
  appliedDateFormatted: '14 Sep 2026',
  aiSummary: 'Strong product design background with excellent experience in design systems, user research, and cross-functional collaboration.',
  nextInterviewSlot: {
    date: 'Tomorrow, 15 Sep 2026',
    time: '10:30 AM – 11:15 AM EST',
    interviewer: 'Kevin Nunez',
    roomLink: '#/interview/room/sarah-miller-m2'
  },
  resumeUrl: '#',
  jobTitle: 'Senior Product Designer'
};

/**
 * Peer department candidates across Design, Engineering, Product, and Marketing
 */
export const SAKROME_PEER_CANDIDATES: SakromeCandidate[] = [
  {
    _id: 'cand-robert-fernandez',
    candidate: {
      _id: 'user-robert-fernandez',
      name: 'Robert Fernandez',
      email: 'fernandez.rob@gmail.com',
      headline: 'Graphic Designer',
      department: 'Design',
      location: 'New York, NY',
      yearsOfExperience: 4,
      phone: '+1 (212) 555-0182',
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 3 weeks',
      salaryExpected: ' - ',
      source: 'Behance',
      bio: 'Graphic designer specialized in corporate visual identity, high-conversion vector art, brand guideline decks, and marketing collateral.',
      skills: ['Graphic Design', 'Figma', 'Brand Identity', 'Adobe Creative Cloud', 'Typography'],
      experience: [
        {
          role: 'Senior Graphic Designer',
          company: 'Studio Pixel Co',
          period: '2022 – Present',
          description: 'Designed international brand assets and comprehensive typography sets for high-profile clients.'
        }
      ],
      education: [
        {
          degree: 'B.F.A. Graphic Communications',
          institution: 'Rhode Island School of Design',
          year: '2018 – 2022'
        }
      ],
      notes: [
        {
          id: 'note-rf-1',
          author: 'Kevin Nunez',
          date: '13 Sep 2026',
          content: 'Strong vector asset library and typography sensibilities.'
        }
      ]
    },
    aiScore: 80,
    matchLabel: 'Strong match',
    matchedKeywords: ['Graphic Design', 'Figma', 'Brand Identity', 'Adobe Creative Cloud'],
    missingKeywords: ['3D Modeling'],
    status: 'Interview',
    appliedAt: '2026-09-13T09:15:00.000Z',
    appliedDateFormatted: '13 Sep 2026',
    aiSummary: 'Proven track record in brand development with robust visual composition skills across print and digital media.',
    nextInterviewSlot: {
      date: 'Wed, 16 Sep 2026',
      time: '02:00 PM – 02:45 PM EST',
      interviewer: 'Kevin Nunez',
      roomLink: '#/interview/room/robert-fernandez-m2'
    },
    resumeUrl: '#'
  },
  {
    _id: 'cand-david-kim',
    candidate: {
      _id: 'user-david-kim',
      name: 'David Kim',
      email: 'david.kim69@gmail.com',
      headline: 'Frontend Engineer',
      department: 'Engineering',
      location: 'San Jose, CA',
      yearsOfExperience: 5,
      phone: '+1 (408) 555-0149',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      availability: 'Available immediately',
      salaryExpected: ' - ',
      source: 'GitHub',
      bio: 'Frontend engineer with extensive experience in React 19, TypeScript, Next.js, and performance tuning for high-throughput enterprise portals.',
      skills: ['React', 'TypeScript', 'TailwindCSS', 'Next.js', 'WebSockets'],
      experience: [
        {
          role: 'Staff Frontend Engineer',
          company: 'OmniStack Technologies',
          period: '2021 – Present',
          description: 'Migrated monolithic dashboard to Vite-based microfrontends, improving bundle size by 44%.'
        }
      ],
      education: [
        {
          degree: 'B.S. Computer Science',
          institution: 'UC Berkeley',
          year: '2016 – 2020'
        }
      ],
      notes: [
        {
          id: 'note-dk-1',
          author: 'Russel Sims',
          date: '12 Sep 2026',
          content: 'Passed preliminary coding screener with top 5% score in algorithmic efficiency.'
        }
      ]
    },
    aiScore: 77,
    matchLabel: 'Good match',
    matchedKeywords: ['React', 'TypeScript', 'TailwindCSS', 'Next.js'],
    missingKeywords: ['GraphQL'],
    status: 'Screening',
    appliedAt: '2026-09-12T14:20:00.000Z',
    appliedDateFormatted: '12 Sep 2026',
    aiSummary: 'Strong TypeScript engineering fundamentals with demonstrated mastery of modern component architecture.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-emma-wilson',
    candidate: {
      _id: 'user-emma-wilson',
      name: 'Emma Wilson',
      email: 'e.wilson@gmail.com',
      headline: 'Product Manager',
      department: 'Product',
      location: 'Seattle, WA',
      yearsOfExperience: 7,
      phone: '+1 (206) 555-0199',
      profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 1 month',
      salaryExpected: ' - ',
      source: 'Direct Application',
      bio: 'Customer-focused Product Manager with 7+ years of experience leading cross-functional squads in B2B SaaS, developer tools, and analytics.',
      skills: ['Product Strategy', 'Agile', 'Scrum', 'Data Analysis', 'Roadmapping'],
      experience: [
        {
          role: 'Lead Product Manager',
          company: 'PulseMetrics',
          period: '2020 – Present',
          description: 'Launched real-time analytics product generating .2M ARR in Year 1.'
        }
      ],
      education: [
        {
          degree: 'B.A. Economics & Computer Science',
          institution: 'University of Washington',
          year: '2014 – 2018'
        }
      ],
      notes: [
        {
          id: 'note-ew-1',
          author: 'Kevin Nunez',
          date: '11 Sep 2026',
          content: 'Exceptional strategic vision. Highest rubric score on product discovery.'
        }
      ]
    },
    aiScore: 95,
    matchLabel: 'Strong match',
    matchedKeywords: ['Product Strategy', 'Agile', 'Scrum', 'Data Analysis', 'Roadmapping'],
    missingKeywords: [],
    status: 'Assessment',
    appliedAt: '2026-09-11T11:00:00.000Z',
    appliedDateFormatted: '11 Sep 2026',
    aiSummary: 'Exceptional product leader with end-to-end lifecycle ownership from 0-to-1 discovery to enterprise scale.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-thomas-wellbeck',
    candidate: {
      _id: 'user-thomas-wellbeck',
      name: 'Thomas Wellbeck',
      email: 'thomas.w@gmail.com',
      headline: 'Backend Engineer',
      department: 'Engineering',
      location: 'Austin, TX',
      yearsOfExperience: 3,
      phone: '+1 (512) 555-0163',
      profilePicture: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 2 weeks',
      salaryExpected: ' - ',
      source: 'Hired.com',
      bio: 'Backend developer focused on Node.js, Express, MongoDB, Redis caching layers, and high-concurrency RESTful APIs.',
      skills: ['Node.js', 'MongoDB', 'REST APIs', 'Express', 'Docker'],
      experience: [
        {
          role: 'Backend Software Developer',
          company: 'FinFlow Systems',
          period: '2022 – Present',
          description: 'Engineered payment reconciliation pipeline processing 100k daily transactions.'
        }
      ],
      education: [
        {
          degree: 'B.S. Software Engineering',
          institution: 'UT Austin',
          year: '2018 – 2022'
        }
      ]
    },
    aiScore: 55,
    matchLabel: 'Standard match',
    matchedKeywords: ['Node.js', 'MongoDB', 'REST APIs'],
    missingKeywords: ['Microservices', 'Kubernetes', 'Redis'],
    status: 'New',
    appliedAt: '2026-09-10T15:45:00.000Z',
    appliedDateFormatted: '10 Sep 2026',
    aiSummary: 'Solid core backend fundamentals, but limited cloud orchestration and distributed systems experience.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-lala-hermansyah',
    candidate: {
      _id: 'user-lala-hermansyah',
      name: 'Lala Hermansyah',
      email: 'lalala.h@gmail.com',
      headline: 'Digital Marketing',
      department: 'Marketing',
      location: 'Chicago, IL',
      yearsOfExperience: 5,
      phone: '+1 (312) 555-0177',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 2 weeks',
      salaryExpected: ' - ',
      source: 'LinkedIn',
      bio: 'Growth and performance marketing leader with expertise in organic SEO, programmatic display campaigns, and B2B lifecycle funnels.',
      skills: ['Digital Marketing', 'PPC', 'SEO', 'Content Strategy', 'HubSpot'],
      experience: [
        {
          role: 'Growth Marketing Manager',
          company: 'HyperGrowth Media',
          period: '2021 – Present',
          description: 'Scaled organic acquisition by 180% over 18 months through programmatic content pipelines.'
        }
      ],
      education: [
        {
          degree: 'B.A. Marketing & Communications',
          institution: 'Northwestern University',
          year: '2016 – 2020'
        }
      ]
    },
    aiScore: 84,
    matchLabel: 'Strong match',
    matchedKeywords: ['Digital Marketing', 'PPC', 'SEO', 'Content Strategy'],
    missingKeywords: ['Affiliate Management'],
    status: 'Assessment',
    appliedAt: '2026-09-09T16:00:00.000Z',
    appliedDateFormatted: '09 Sep 2026',
    aiSummary: 'Data-driven marketing strategist with consistent results in multi-channel paid and organic user acquisition.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-kintaro-hamada',
    candidate: {
      _id: 'user-kintaro-hamada',
      name: 'Kintaro Hamada',
      email: 'kintaro.hamada@gmail.com',
      headline: 'Product Research',
      department: 'Product',
      location: 'Boston, MA',
      yearsOfExperience: 4,
      phone: '+1 (617) 555-0128',
      profilePicture: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 3 weeks',
      salaryExpected: ' - ',
      source: 'Referral',
      bio: 'UX & Product Researcher skilled at qualitative user discovery, behavioral analysis, customer journey mapping, and usability scoring.',
      skills: ['Product Research', 'User Interviews', 'Usability Testing', 'Survey Design'],
      experience: [
        {
          role: 'Senior UX Researcher',
          company: 'Catalyst Labs',
          period: '2022 – Present',
          description: 'Conducted over 120 customer interviews inform design system accessibility and workflow optimizations.'
        }
      ],
      education: [
        {
          degree: 'M.S. Applied Psychology',
          institution: 'Boston University',
          year: '2018 – 2020'
        }
      ]
    },
    aiScore: 72,
    matchLabel: 'Good match',
    matchedKeywords: ['Product Research', 'User Interviews', 'Usability Testing'],
    missingKeywords: ['Quantitative Modeling'],
    status: 'Screening',
    appliedAt: '2026-09-08T13:45:00.000Z',
    appliedDateFormatted: '08 Sep 2026',
    aiSummary: 'High proficiency in qualitative interview syntheses and generative product research methodologies.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-tony-cooper',
    candidate: {
      _id: 'user-tony-cooper',
      name: 'Tony Cooper',
      email: 'tony.cooper@gmail.com',
      headline: 'SEO Specialist',
      department: 'Marketing',
      location: 'Denver, CO',
      yearsOfExperience: 6,
      phone: '+1 (303) 555-0155',
      profilePicture: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      availability: 'Available immediately',
      salaryExpected: ' - ',
      source: 'LinkedIn',
      bio: 'Technical SEO and organic content architect with a focus on web performance, Core Web Vitals, and programmatic indexing.',
      skills: ['SEO Strategy', 'Keyword Optimization', 'Technical SEO', 'Google Analytics'],
      experience: [
        {
          role: 'Lead SEO Strategist',
          company: 'Summit Media',
          period: '2020 – Present',
          description: 'Drove 2.4M monthly organic visits through schema markup optimization and content clusters.'
        }
      ],
      education: [
        {
          degree: 'B.S. Information Systems',
          institution: 'Colorado State University',
          year: '2015 – 2019'
        }
      ]
    },
    aiScore: 86,
    matchLabel: 'Strong match',
    matchedKeywords: ['SEO Strategy', 'Keyword Optimization', 'Technical SEO', 'Google Analytics'],
    missingKeywords: ['A/B Testing'],
    status: 'Screening',
    appliedAt: '2026-09-07T15:20:00.000Z',
    appliedDateFormatted: '07 Sep 2026',
    aiSummary: 'Deep technical SEO expertise combined with solid data analytics and keyword clustering capability.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-willo-bennington',
    candidate: {
      _id: 'user-willo-bennington',
      name: 'Willo Bennington',
      email: 'willo.bennington@gmail.com',
      headline: 'Marketing Lead',
      department: 'Marketing',
      location: 'Atlanta, GA',
      yearsOfExperience: 8,
      phone: '+1 (404) 555-0112',
      profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 1 month',
      salaryExpected: ' - ',
      source: 'Referral',
      bio: 'Versatile marketing lead specializing in brand awareness campaigns, executive communications, and sponsor activations.',
      skills: ['Campaign Strategy', 'Brand Marketing', 'Team Leadership'],
      experience: [
        {
          role: 'Director of Marketing',
          company: 'Solstice Group',
          period: '2018 – Present',
          description: 'Managed a .5M annual marketing budget across digital, event, and affiliate channels.'
        }
      ],
      education: [
        {
          degree: 'B.A. Public Relations',
          institution: 'Emory University',
          year: '2012 – 2016'
        }
      ]
    },
    aiScore: 64,
    matchLabel: 'Standard match',
    matchedKeywords: ['Campaign Strategy', 'Brand Marketing', 'Team Leadership'],
    missingKeywords: ['Performance Marketing'],
    status: 'New',
    appliedAt: '2026-09-06T08:50:00.000Z',
    appliedDateFormatted: '06 Sep 2026',
    aiSummary: 'Strong brand leadership credentials, though lacking in quantitative attribution and PPC tracking.',
    resumeUrl: '#'
  },
  {
    _id: 'cand-nicole-famungkas',
    candidate: {
      _id: 'user-nicole-famungkas',
      name: 'Nicole Famungkas',
      email: 'famungkas.n@gmail.com',
      headline: 'Network Security',
      department: 'Engineering',
      location: 'Portland, OR',
      yearsOfExperience: 6,
      phone: '+1 (503) 555-0188',
      profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      availability: 'Available in 2 weeks',
      salaryExpected: ' - ',
      source: 'Direct Application',
      bio: 'Cybersecurity engineer with extensive knowledge of zero-trust architecture, cloud infrastructure hardening, SIEM, and SOC 2 compliance.',
      skills: ['Network Security', 'Firewalls', 'Threat Detection', 'Penetration Testing'],
      experience: [
        {
          role: 'Senior Security Engineer',
          company: 'Aegis Cyber Defense',
          period: '2020 – Present',
          description: 'Protected AWS cloud infrastructure supporting 10M+ active users against persistent threat vectors.'
        }
      ],
      education: [
        {
          degree: 'B.S. Cybersecurity',
          institution: 'Oregon State University',
          year: '2015 – 2019'
        }
      ]
    },
    aiScore: 88,
    matchLabel: 'Strong match',
    matchedKeywords: ['Network Security', 'Firewalls', 'Threat Detection', 'Penetration Testing'],
    missingKeywords: ['Cloud Compliance'],
    status: 'Assessment',
    appliedAt: '2026-09-05T12:10:00.000Z',
    appliedDateFormatted: '05 Sep 2026',
    aiSummary: 'Exceptional security analyst with proven defense against modern attack surfaces and enterprise compliance audits.',
    resumeUrl: '#'
  }
];

export const SAKROME_CANDIDATES: SakromeCandidate[] = [
  SAKROME_SARAH_MILLER,
  ...SAKROME_PEER_CANDIDATES
];

export interface DepartmentMeta {
  name: SakromeDepartment;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  textColor: string;
  bgColor: string;
  borderColor: string;
  badgeClass: string;
}

export const getDepartmentMeta = (departmentOrHeadline?: string): DepartmentMeta => {
  const text = (departmentOrHeadline || '').toLowerCase();
  if (text.includes('design') || text.includes('graphic') || text.includes('ux') || text.includes('ui') || text.includes('figma')) {
    return {
      name: 'Design',
      icon: Box,
      textColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      borderColor: 'border-purple-200/60 dark:border-purple-800/40',
      badgeClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200/60 dark:border-purple-800/40'
    };
  }
  if (text.includes('product') || text.includes('research') || text.includes('manager') || text.includes('scrum') || text.includes('owner')) {
    return {
      name: 'Product',
      icon: Package,
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderColor: 'border-emerald-200/60 dark:border-emerald-800/40',
      badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/40'
    };
  }
  if (text.includes('market') || text.includes('seo') || text.includes('growth') || text.includes('digital') || text.includes('sales')) {
    return {
      name: 'Marketing',
      icon: Megaphone,
      textColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/50',
      borderColor: 'border-blue-200/60 dark:border-blue-800/40',
      badgeClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-800/40'
    };
  }
  return {
    name: 'Engineering',
    icon: Code2,
    textColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/50',
    borderColor: 'border-orange-200/60 dark:border-orange-800/40',
    badgeClass: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 border-orange-200/60 dark:border-orange-800/40'
  };
};

export interface StageMeta {
  label: string;
  dotColor: string;
  badgeClass: string;
}

export const getStageMeta = (status?: string): StageMeta => {
  const s = (status || '').toLowerCase();
  if (s.includes('interview')) {
    return {
      label: 'Interview',
      dotColor: 'bg-blue-500',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60'
    };
  }
  if (s.includes('assessment') || s.includes('test') || s.includes('pending ai')) {
    return {
      label: 'Assessment',
      dotColor: 'bg-purple-500',
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60'
    };
  }
  if (s.includes('screening') || s.includes('review')) {
    return {
      label: 'Screening',
      dotColor: 'bg-amber-500',
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
    };
  }
  return {
    label: 'New',
    dotColor: 'bg-slate-400',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  };
};

export const normalizeToSakromeCandidate = (app: any): SakromeCandidate => {
  if (!app) return SAKROME_SARAH_MILLER;
  if (app.candidate?.department && app.appliedDateFormatted && app.candidate?.name && !app._id?.startsWith?.('cand-')) {
    return app as SakromeCandidate;
  }
  const candUser = app.candidate || {};
  const profile = candUser.profile || {};
  const headline = candUser.headline || profile.headline || 'Applicant';
  const deptMeta = getDepartmentMeta(candUser.department || profile.department || headline || app.job?.department);
  
  const score = typeof app.aiScore === 'number' ? app.aiScore : (app.aiScore ? Number(app.aiScore) : null);
  const matchLabel = score !== null ? (score >= 80 ? 'Strong match' : score >= 60 ? 'Good match' : 'Fair match') : 'Evaluating';

  let appliedDateStr = '';
  if (app.appliedDateFormatted) {
    appliedDateStr = app.appliedDateFormatted;
  } else if (app.appliedAt) {
    const d = new Date(app.appliedAt);
    if (!isNaN(d.getTime())) {
      appliedDateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  if (!appliedDateStr) {
    appliedDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const rawExp = app.experience?.length ? app.experience : (profile.experience?.length ? profile.experience : (candUser.experience || []));
  const mappedExp = (rawExp || []).map((e: any) => ({
    role: e.role || e.designation || headline || 'Role',
    company: e.company || 'Organization',
    period: e.period || (e.from ? `${e.from} – ${e.to || 'Present'}` : ''),
    description: e.description || e.work || ''
  }));

  const rawEdu = app.education?.length ? app.education : (profile.education?.length ? profile.education : (candUser.education || []));
  const mappedEdu = (rawEdu || []).map((e: any) => ({
    degree: e.degree || (e.fieldOfStudy ? `${e.fieldOfStudy} Degree` : 'Degree'),
    institution: e.institution || 'University',
    year: e.year || (e.from ? `${e.from} – ${e.to || 'Present'}` : '')
  }));

  const realResumeUrl = app.resumeUrl || app.resume || candUser.resumeUrl || profile.resume || '';

  const mappedFiles: SakromeFile[] = realResumeUrl ? [
    {
      name: `${(candUser.name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`,
      size: '1.2 MB',
      type: 'PDF Document',
      url: realResumeUrl
    }
  ] : [];

  return {
    _id: app._id || ('cand-' + (candUser._id || 'generic')),
    candidate: {
      _id: candUser._id || 'user-generic',
      name: candUser.name || 'Candidate',
      email: candUser.email || '',
      headline: headline,
      department: deptMeta.name,
      location: candUser.location || profile.location || 'Remote',
      yearsOfExperience: candUser.yearsOfExperience || (profile.yearsOfExperience ? parseInt(profile.yearsOfExperience) : 0) || mappedExp.length || 1,
      phone: candUser.phone || profile.phone || '',
      profilePicture: candUser.profilePicture || profile.profilePicture || '',
      availability: candUser.availability || (Array.isArray(profile.availability) ? profile.availability.join(', ') : profile.availability) || 'Available',
      salaryExpected: candUser.salaryExpected || profile.salaryExpected || (profile.hourlyRate ? `$${profile.hourlyRate}/hr` : ''),
      source: candUser.source || 'Direct Application',
      bio: candUser.bio || profile.bio || 'Applicant profile in review.',
      skills: Array.isArray(app.skills) && app.skills.length ? app.skills : (Array.isArray(profile.skills) && profile.skills.length ? profile.skills : (Array.isArray(candUser.skills) ? candUser.skills : [])),
      experience: Array.isArray(mappedExp) ? mappedExp : [],
      education: Array.isArray(mappedEdu) ? mappedEdu : [],
      notes: Array.isArray(app.notes) ? app.notes : (Array.isArray(candUser.notes) ? candUser.notes : []),
      files: Array.isArray(app.files) ? app.files : (Array.isArray(candUser.files) ? candUser.files : (mappedFiles || []))
    },
    aiScore: score,
    matchLabel,
    matchedKeywords: app.matchedKeywords || [],
    missingKeywords: app.missingKeywords || [],
    status: app.status || 'Applied',
    appliedAt: app.appliedAt || new Date().toISOString(),
    appliedDateFormatted: appliedDateStr,
    aiSummary: app.aiSummary || (score !== null ? `Evaluated applicant with AI match score of ${score}%.` : 'Pending evaluation.'),
    nextInterviewSlot: app.nextInterviewSlot || undefined,
    resumeUrl: realResumeUrl,
    jobTitle: app.job?.title || app.jobTitle || ''
  };
};

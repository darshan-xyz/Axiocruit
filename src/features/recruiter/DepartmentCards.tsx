import React from 'react';

export const EmployeeDepartmentCards: React.FC = () => {
  const depts = [
    {
      name: 'Design Team',
      count: 26,
      avatars: [
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+24'
    },
    {
      name: 'Development Team',
      count: 16,
      avatars: [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+13'
    },
    {
      name: 'Finance Team',
      count: 10,
      avatars: [
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+6'
    },
    {
      name: 'Sales Team',
      count: 30,
      avatars: [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=faces',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces',
      ],
      extra: '+27'
    },
  ];

  return (
    <div className="bg-white dark:bg-[#111726] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
          Employee
        </h3>
        <button
          onClick={() => window.location.href = '#/recruiter/applicants'}
          className="text-xs font-black text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
        >
          VIEW ALL &gt;
        </button>
      </div>

      <div className="space-y-3">
        {depts.map(d => (
          <div
            key={d.name}
            className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
          >
            <div>
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">{d.name}</h4>
              <span className="text-[10px] font-black uppercase text-slate-400">TOTAL MEMBER {d.count}</span>
            </div>
            <div className="flex items-center -space-x-1.5">
              {d.avatars.map((url, i) => (
                <img key={i} src={url} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 object-cover" alt="Member" />
              ))}
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-2xs">
                {d.extra}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDepartmentCards;


import React from 'react';
import { SUBJECTS } from '../constants';
import { Subject } from '../types';

interface SubjectGridProps {
  onSelect: (subject: Subject) => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({ onSelect }) => {
  return (
    <div className="p-4 space-y-3">
      {SUBJECTS.map((subject) => (
        <button
          key={subject.id}
          onClick={() => onSelect(subject)}
          className="w-full bg-white p-3.5 rounded-2xl shadow-sm border border-emerald-50 flex items-center gap-4 hover:shadow-md hover:border-emerald-200 transition-all active:scale-[0.98] group text-left"
        >
          {/* Distinct Icon Container */}
          <div className="flex-shrink-0 w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
            {subject.icon}
          </div>
          
          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base mb-0.5 flex items-center gap-2">
              {subject.title}
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">Active</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-tight line-clamp-1">
              {subject.description}
            </p>
          </div>

          {/* Action Indicator */}
          <div className="flex-shrink-0 text-emerald-200 group-hover:text-emerald-500 transition-colors pr-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SubjectGrid;

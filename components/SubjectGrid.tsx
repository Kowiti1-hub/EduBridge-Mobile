
import React from 'react';
import { SUBJECTS } from '../constants';
import { Subject } from '../types';

interface SubjectGridProps {
  onSelect: (subject: Subject) => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({ onSelect }) => {
  return (
    <div className="p-4 grid grid-cols-2 gap-4">
      {SUBJECTS.map((subject) => (
        <button
          key={subject.id}
          onClick={() => onSelect(subject)}
          className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex flex-col items-center text-center hover:shadow-md hover:border-emerald-200 transition-all active:scale-95 group"
        >
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform">
            {subject.icon}
          </div>
          <h3 className="font-bold text-gray-800 text-sm mb-1">{subject.title}</h3>
          <p className="text-[10px] text-gray-400 font-medium leading-tight line-clamp-2 px-1">
            {subject.description}
          </p>
        </button>
      ))}
    </div>
  );
};

export default SubjectGrid;

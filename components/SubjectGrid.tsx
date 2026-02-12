
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
          className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
        >
          <span className="text-4xl mb-2">{subject.icon}</span>
          <h3 className="font-bold text-gray-800 text-sm">{subject.title}</h3>
          <p className="text-[10px] text-gray-500 mt-1 leading-tight">{subject.description}</p>
        </button>
      ))}
    </div>
  );
};

export default SubjectGrid;

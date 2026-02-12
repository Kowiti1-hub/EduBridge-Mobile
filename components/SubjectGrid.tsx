
import React, { useState, useEffect } from 'react';
import { SUBJECTS } from '../constants';
import { Subject } from '../types';

interface SubjectGridProps {
  onSelect: (subject: Subject) => void;
}

const SubjectGrid: React.FC<SubjectGridProps> = ({ onSelect }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('edubridge_favorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('edubridge_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering onSelect
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 space-y-3">
      {SUBJECTS.map((subject) => {
        const isFavorite = favorites.includes(subject.id);
        
        return (
          <button
            key={subject.id}
            onClick={() => onSelect(subject)}
            className={`w-full p-3.5 rounded-2xl shadow-sm border transition-all active:scale-[0.98] group text-left flex items-center gap-4 relative overflow-hidden ${
              isFavorite 
                ? 'bg-amber-50 border-amber-200 shadow-md ring-1 ring-amber-100' 
                : 'bg-white border-emerald-50 hover:shadow-md hover:border-emerald-200'
            }`}
          >
            {/* Favorite Indicator Overlay */}
            {isFavorite && (
              <div className="absolute top-0 right-0 w-12 h-12 bg-amber-400/10 rounded-bl-full pointer-events-none" />
            )}

            {/* Distinct Icon Container */}
            <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner ${
              isFavorite ? 'bg-amber-100' : 'bg-emerald-50'
            }`}>
              {subject.icon}
            </div>
            
            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 text-base mb-0.5 flex items-center gap-2">
                {subject.title}
                {isFavorite && (
                  <span className="text-[9px] bg-amber-400 text-amber-900 px-1.5 py-0.5 rounded-full uppercase font-black tracking-widest shadow-sm">
                    Fav
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 font-medium leading-tight line-clamp-1">
                {subject.description}
              </p>
            </div>

            {/* Favorite Toggle Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={(e) => toggleFavorite(e, subject.id)}
                className={`p-2 rounded-full transition-all hover:scale-110 active:scale-90 ${
                  isFavorite 
                    ? 'text-rose-500 bg-rose-50' 
                    : 'text-gray-300 hover:text-rose-300 bg-gray-50'
                }`}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  viewBox="0 0 24 24" 
                  fill={isFavorite ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              </button>
              
              <div className={`flex-shrink-0 transition-colors ${
                isFavorite ? 'text-amber-500' : 'text-emerald-200 group-hover:text-emerald-500'
              }`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SubjectGrid;

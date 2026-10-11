import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Compass, Orbit, ArrowRight, Sparkles, Globe2, Radio } from 'lucide-react';
import { useAstronomy } from '../../app/providers/AstronomyContext';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { searchCatalogue } = useAstronomy();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchCatalogue(query);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (id: string, viewMode?: 'details' | 'universe' | 'explore') => {
    onClose();
    if (viewMode === 'universe') {
      navigate(`/universe?focus=${id}`);
    } else if (viewMode === 'explore') {
      navigate(`/explore?target=${id}`);
    } else {
      navigate(`/object/${id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'planet':
      case 'sun':
      case 'moon':
        return <Globe2 className="w-4 h-4 text-[#F59E0B]" />;
      case 'constellation':
        return <Sparkles className="w-4 h-4 text-[#48D7FF]" />;
      case 'satellite':
        return <Radio className="w-4 h-4 text-[#8B5CF6]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#EDF5FF]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl rounded-2xl glass-panel-glow border border-white/15 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#48D7FF]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search celestial objects (e.g. Jupiter, Betelgeuse, Orion, ISS)..."
            className="w-full bg-transparent text-[#EDF5FF] text-base placeholder-[#9EACC4]/60 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-white/10 text-[#9EACC4]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-mono text-[#9EACC4] hover:text-[#EDF5FF] bg-white/5 rounded border border-white/10"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
          {results.length > 0 ? (
            results.map((item, index) => {
              const isHighlighted = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    isHighlighted ? 'bg-[#163B70]/60 border border-[#48D7FF]/30' : 'hover:bg-white/5'
                  }`}
                  onClick={() => handleSelect(item.id, 'details')}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#071126] border border-white/10 flex items-center justify-center shrink-0">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[#EDF5FF] truncate font-display">
                        {item.name}
                      </div>
                      <div className="text-xs text-[#9EACC4] truncate font-mono">
                        {item.secondary}
                      </div>
                    </div>
                  </div>

                  {/* Context Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item.id, 'universe');
                      }}
                      title="Focus in 3D Universe"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#48D7FF]/20 text-[#48D7FF] text-xs font-mono flex items-center gap-1 border border-white/10"
                    >
                      <Orbit className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">3D</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item.id, 'explore');
                      }}
                      title="Track in AR Sky"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-mono flex items-center gap-1 border border-white/10"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">AR</span>
                    </button>
                    <div className="p-1 text-[#9EACC4]">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : query ? (
            <div className="p-8 text-center text-[#9EACC4]">
              <p className="text-sm">No celestial objects found matching "{query}"</p>
              <p className="text-xs mt-1 text-[#9EACC4]/60">
                Try searching for planets (Mars, Saturn), bright stars (Sirius, Vega), constellations (Orion, Ursa Major), or satellites (ISS).
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="text-xs font-mono uppercase text-[#9EACC4] tracking-wider mb-3">
                Suggested Celestial Searches
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['body-mars', 'body-jupiter', 'star-sirius', 'ori', 'sat-iss', 'body-saturn', 'star-betelgeuse', 'uma'].map((id) => (
                  <button
                    key={id}
                    onClick={() => handleSelect(id, 'details')}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-left text-xs font-mono text-[#EDF5FF] border border-white/5 truncate"
                  >
                    → {id.replace('body-', '').replace('star-', '').replace('sat-', '').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

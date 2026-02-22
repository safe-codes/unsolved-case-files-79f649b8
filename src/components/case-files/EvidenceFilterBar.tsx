import { FileText, Image, Video, Music, File, Filter, Search } from 'lucide-react';

const filters = [
  { key: 'all', label: 'All Files', icon: <Filter className="w-3 h-3" /> },
  { key: 'image', label: 'Photos', icon: <Image className="w-3 h-3" /> },
  { key: 'video', label: 'Video', icon: <Video className="w-3 h-3" /> },
  { key: 'audio', label: 'Audio', icon: <Music className="w-3 h-3" /> },
  { key: 'text', label: 'Text', icon: <FileText className="w-3 h-3" /> },
  { key: 'document', label: 'Docs', icon: <File className="w-3 h-3" /> },
];

interface Props {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function EvidenceFilterBar({ activeFilter, onFilterChange, counts, totalCount, searchQuery, onSearchChange }: Props) {
  return (
    <div className="space-y-4 mb-6 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search case files..."
          className="w-full sm:w-72 h-9 pl-9 pr-3 bg-card/30 border border-border/40 rounded-lg font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 focus:shadow-[0_0_12px_hsl(38_70%_50%/0.08)] transition-all"
        />
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((f) => {
          const count = f.key === 'all' ? totalCount : (counts[f.key] || 0);
          const isActive = activeFilter === f.key;

          if (f.key !== 'all' && count === 0) return null;

          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] sm:text-xs uppercase tracking-wider
                border transition-all duration-200
                ${isActive
                  ? 'bg-primary/15 border-primary/40 text-primary shadow-[0_0_12px_hsl(38_70%_50%/0.1)]'
                  : 'bg-card/30 border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }
              `}
            >
              {f.icon}
              {f.label}
              <span className={`ml-0.5 text-[9px] ${isActive ? 'text-primary/70' : 'text-muted-foreground/50'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

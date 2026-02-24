import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { FileText, Image, Video, Music, File, BookOpen, FolderOpen, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Tables } from '@/integrations/supabase/types';
import CaseFileModal from '@/components/case-files/CaseFileModal';
import EvidenceFilterBar from '@/components/case-files/EvidenceFilterBar';
import DustParticles from '@/components/case-files/DustParticles';

type CaseFile = Tables<'case_files'>;

const fileTypeIcons: Record<string, React.ReactNode> = {
  image: <Image className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  document: <File className="w-5 h-5" />,
  text: <FileText className="w-5 h-5" />,
};

const fileTypeLabels: Record<string, string> = {
  image: 'PHOTOGRAPH',
  video: 'VIDEO EVIDENCE',
  audio: 'AUDIO RECORDING',
  document: 'DOCUMENT',
  text: 'TEXT FILE',
};

export default function MainSite() {
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<CaseFile | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  useAudioPlayer(musicUrl);

  useEffect(() => {
    async function load() {
      const [filesRes, configRes] = await Promise.all([
        supabase.from('case_files').select('*').order('display_order', { ascending: true }),
        supabase.from('site_config').select('music_url').limit(1).single(),
      ]);
      setCaseFiles(filesRes.data || []);
      setMusicUrl(configRes.data?.music_url || null);
      setLoading(false);
    }
    load();
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    caseFiles.forEach((f) => { c[f.file_type] = (c[f.file_type] || 0) + 1; });
    return c;
  }, [caseFiles]);

  const filteredFiles = useMemo(() => {
    let files = activeFilter === 'all' ? caseFiles : caseFiles.filter((f) => f.file_type === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      files = files.filter((f) =>
        f.title.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.text_content?.toLowerCase().includes(q)
      );
    }
    return files;
  }, [caseFiles, activeFilter, searchQuery]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!filteredFiles.length) return;
    const cols = window.innerWidth >= 768 ? 4 : window.innerWidth >= 640 ? 3 : 2;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filteredFiles.length - 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + cols, filteredFiles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - cols, 0));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      setSelectedFile(filteredFiles[focusedIndex]);
    }
  }, [filteredFiles, focusedIndex]);

  // Focus the active button when focusedIndex changes
  useEffect(() => {
    if (focusedIndex >= 0 && gridRef.current) {
      const buttons = gridRef.current.querySelectorAll('button');
      buttons[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <div className="min-h-screen bg-background relative">
      <DustParticles />

      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(hsl(38 70% 50% / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(38 70% 50% / 0.4) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="px-4 sm:container sm:max-w-5xl py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="font-mono text-sm sm:text-lg tracking-wider text-foreground uppercase">
              Unsolved Case Files
            </h1>
          </div>
          {!loading && caseFiles.length > 0 && (
            <span className="font-mono text-[10px] sm:text-xs text-muted-foreground/50 uppercase tracking-widest">
              {caseFiles.length} file{caseFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="px-3 sm:container sm:max-w-5xl py-6 sm:py-10 relative z-[1]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : caseFiles.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-mono text-sm">No case files available</p>
            <p className="text-muted-foreground/50 text-xs mt-2 font-mono">Check back later for updates</p>
          </div>
        ) : (
          <>
            <EvidenceFilterBar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
              totalCount={caseFiles.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {filteredFiles.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <p className="text-muted-foreground font-mono text-sm">No files match this filter</p>
              </div>
            ) : (
              <div
                ref={gridRef}
                onKeyDown={handleKeyDown}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in"
                role="grid"
                tabIndex={0}
              >
                {filteredFiles.map((file, i) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    onFocus={() => setFocusedIndex(i)}
                    className={`evidence-folder group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border bg-card/50 hover:bg-card hover:border-primary/40 hover:shadow-[0_0_24px_hsl(38_70%_50%/0.12)] transition-all duration-300 cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 ${
                      focusedIndex === i ? 'border-primary/40 ring-1 ring-primary/30' : 'border-border/60'
                    }`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-3 flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 sm:w-14 sm:h-14 text-primary/70 group-hover:text-primary transition-all duration-300 drop-shadow-md group-hover:drop-shadow-lg group-hover:scale-105" strokeWidth={1.2} />
                      <div className="absolute inset-0 flex items-center justify-center pt-1.5">
                        <span className="text-primary-foreground/80 group-hover:text-primary-foreground transition-colors">
                          {fileTypeIcons[file.file_type] || <File className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-mono text-xs sm:text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                      {file.title}
                    </h3>

                    <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-1.5 opacity-60 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(file.created_at).toLocaleDateString()}
                    </span>

                    <span className="mt-2 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                      {fileTypeLabels[file.file_type] || file.file_type}
                    </span>

                    <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-500 pointer-events-none" />
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-primary/20 bg-card shadow-2xl gap-0 [&>button]:z-10 [&>button]:text-foreground [&>button]:opacity-100 [&>button]:hover:opacity-70">
          <DialogTitle className="sr-only">{selectedFile?.title}</DialogTitle>
          {selectedFile && <CaseFileModal file={selectedFile} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

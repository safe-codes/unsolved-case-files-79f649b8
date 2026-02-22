import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { FileText, Image, Video, Music, File, BookOpen, FolderOpen, X, Calendar, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Tables } from '@/integrations/supabase/types';

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-md">
        <div className="px-4 sm:container sm:max-w-5xl py-4 sm:py-6 flex items-center gap-3">
          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="font-mono text-sm sm:text-lg tracking-wider text-foreground uppercase">
            Unsolved Case Files
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="px-3 sm:container sm:max-w-5xl py-6 sm:py-10">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
            {caseFiles.map((file, i) => (
              <button
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className="evidence-folder group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 hover:shadow-[0_0_24px_hsl(38_70%_50%/0.12)] transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Folder icon */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-3 flex items-center justify-center">
                  <FolderOpen className="w-12 h-12 sm:w-14 sm:h-14 text-primary/70 group-hover:text-primary transition-all duration-300 drop-shadow-md group-hover:drop-shadow-lg group-hover:scale-105" strokeWidth={1.2} />
                  <div className="absolute inset-0 flex items-center justify-center pt-1.5">
                    <span className="text-primary-foreground/80 group-hover:text-primary-foreground transition-colors">
                      {fileTypeIcons[file.file_type] || <File className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-mono text-xs sm:text-sm text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300">
                  {file.title}
                </h3>

                {/* Date */}
                <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-1.5 opacity-60 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {new Date(file.created_at).toLocaleDateString()}
                </span>

                {/* Type badge */}
                <span className="mt-2 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                  {fileTypeLabels[file.file_type] || file.file_type}
                </span>

                {/* Hover glow overlay */}
                <div className="absolute inset-0 rounded-xl bg-primary/0 group-hover:bg-primary/[0.02] transition-colors duration-500 pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Case File Modal */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-primary/20 bg-transparent shadow-2xl gap-0">
          <DialogTitle className="sr-only">{selectedFile?.title}</DialogTitle>
          {selectedFile && <CaseFileModal file={selectedFile} onClose={() => setSelectedFile(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CaseFileModal({ file, onClose }: { file: CaseFile; onClose: () => void }) {
  return (
    <div className="case-file-paper rounded-xl overflow-hidden relative">
      {/* CLASSIFIED stamp */}
      <div className="classified-stamp" aria-hidden="true">
        Classified
      </div>

      {/* Paper-textured header */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-primary/10 relative z-[1]">
        {/* Classification stamp */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] text-destructive/70 border border-destructive/30 px-2 py-0.5 rounded flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 animate-pulse-slow" />
            Evidence File
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            {new Date(file.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Title */}
        <h2 className="font-mono text-lg sm:text-xl text-foreground font-semibold leading-snug">
          {file.title}
        </h2>

        {/* Type tag */}
        <div className="flex items-center gap-2 mt-3">
          <Tag className="w-3 h-3 text-primary/60" />
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-primary/70">
            {fileTypeLabels[file.file_type] || file.file_type}
          </span>
        </div>
      </div>

      {/* Content body */}
      <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5 relative z-[1]">
        {/* Description */}
        {file.description && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Description</p>
            <p className="font-mono text-xs sm:text-sm text-foreground/80 leading-relaxed">{file.description}</p>
          </div>
        )}

        {file.description && (file.text_content || file.file_url) && (
          <hr className="evidence-divider" />
        )}

        {/* Text content */}
        {file.text_content && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Content</p>
            <div className="p-4 bg-secondary/40 rounded-lg border border-border/50">
              <p className="font-mono text-xs sm:text-sm text-secondary-foreground whitespace-pre-wrap leading-relaxed break-words">
                {file.text_content}
              </p>
            </div>
          </div>
        )}

        {/* Image - Polaroid style */}
        {file.file_url && file.file_type === 'image' && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Photographic Evidence</p>
            <div className="flex justify-center py-2">
              <div className="polaroid-frame inline-block">
                <img
                  src={file.file_url}
                  alt={file.title}
                  className="w-full max-h-72 sm:max-h-96 object-cover"
                />
                <p className="polaroid-caption mt-2">
                  EV-{file.id.slice(0, 6).toUpperCase()} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Video */}
        {file.file_url && file.file_type === 'video' && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Video Evidence</p>
            <video src={file.file_url} controls className="rounded-lg w-full max-h-72 sm:max-h-96 bg-secondary/30" />
          </div>
        )}

        {/* Audio */}
        {file.file_url && file.file_type === 'audio' && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Audio Recording</p>
            <div className="p-4 bg-secondary/30 rounded-lg border border-border/40">
              <audio src={file.file_url} controls className="w-full" />
            </div>
          </div>
        )}

        {/* Document link */}
        {file.file_url && file.file_type === 'document' && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Attached Document</p>
            <a
              href={file.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-primary hover:underline font-mono p-3 bg-secondary/30 rounded-lg border border-border/40 hover:border-primary/30 transition-colors"
            >
              <File className="w-4 h-4" /> Open Document
            </a>
          </div>
        )}
      </div>

      {/* Footer stamp */}
      <div className="px-5 sm:px-8 pb-5 sm:pb-6 relative z-[1]">
        <div className="border-t border-border/30 pt-3 flex items-center justify-between">
          <span className="font-mono text-[9px] text-muted-foreground/40 uppercase tracking-widest">
            Case #{file.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/40">
            CONFIDENTIAL
          </span>
        </div>
      </div>
    </div>
  );
}

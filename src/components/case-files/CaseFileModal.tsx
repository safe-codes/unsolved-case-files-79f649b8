import { Calendar, Tag, File } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';
import PhotoStack from './PhotoStack';

type CaseFile = Tables<'case_files'>;

interface CaseFilePhoto {
  id: string;
  photo_url: string;
  display_order: number;
}

const fileTypeLabels: Record<string, string> = {
  image: 'PHOTOGRAPH',
  video: 'VIDEO EVIDENCE',
  audio: 'AUDIO RECORDING',
  document: 'DOCUMENT',
  text: 'TEXT FILE',
};

export default function CaseFileModal({ file, photos = [] }: { file: CaseFile; photos?: CaseFilePhoto[] }) {
  return (
    <div className="case-file-paper rounded-xl overflow-hidden relative">
      {/* CLASSIFIED stamp */}
      <div className="classified-stamp" aria-hidden="true">
        Classified
      </div>

      {/* Header */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-primary/10 relative z-[1]">
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

        <h2 className="font-mono text-lg sm:text-xl text-foreground font-semibold leading-snug">
          {file.title}
        </h2>

        <div className="flex items-center gap-2 mt-3">
          <Tag className="w-3 h-3 text-primary/60" />
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-wider text-primary/70">
            {fileTypeLabels[file.file_type] || file.file_type}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 sm:px-8 py-5 sm:py-6 space-y-5 relative z-[1]">
        {file.description && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Description</p>
            <p className="font-mono text-xs sm:text-sm text-foreground/80 leading-relaxed">{file.description}</p>
          </div>
        )}

        {file.description && (file.text_content || file.file_url) && (
          <hr className="evidence-divider" />
        )}

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

        {/* Photos - stacked card display */}
        {photos.length > 0 && (
          <PhotoStack photos={photos} />
        )}

        {/* Single legacy image fallback */}
        {file.file_url && file.file_type === 'image' && photos.length === 0 && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Photographic Evidence</p>
            <div className="flex justify-center py-2">
              <div className="polaroid-frame inline-block">
                <img src={file.file_url} alt={file.title} className="w-full max-h-72 sm:max-h-96 object-cover" />
                <p className="polaroid-caption mt-2">
                  EV-{file.id.slice(0, 6).toUpperCase()} • {new Date(file.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {file.file_url && file.file_type === 'video' && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Video Evidence</p>
            <video src={file.file_url} controls className="rounded-lg w-full max-h-72 sm:max-h-96 bg-secondary/30" />
          </div>
        )}

        {file.file_url && file.file_type === 'audio' && (
          <div className="space-y-1.5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Audio Recording</p>
            <div className="p-4 bg-secondary/30 rounded-lg border border-border/40">
              <audio src={file.file_url} controls className="w-full" />
            </div>
          </div>
        )}

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

      {/* Footer */}
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

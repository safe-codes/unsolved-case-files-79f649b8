import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { FileText, Image, Video, Music, File, BookOpen } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type CaseFile = Tables<'case_files'>;

const fileTypeIcons: Record<string, React.ReactNode> = {
  image: <Image className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  audio: <Music className="w-5 h-5" />,
  document: <File className="w-5 h-5" />,
  text: <FileText className="w-5 h-5" />,
};

export default function MainSite() {
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      <header className="border-b border-border">
        <div className="container max-w-5xl py-6 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="font-mono text-lg tracking-wider text-foreground uppercase">
            Unsolved Case Files
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-5xl py-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : caseFiles.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground font-mono text-sm">No case files available</p>
            <p className="text-muted-foreground/50 text-xs mt-2 font-mono">Check back later for updates</p>
          </div>
        ) : (
          <div className="grid gap-4 animate-fade-in">
            {caseFiles.map((file, i) => (
              <div
                key={file.id}
                className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-primary shrink-0">
                    {fileTypeIcons[file.file_type] || <File className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground">{file.title}</h3>
                    {file.description && (
                      <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                    )}
                    {file.text_content && (
                      <div className="mt-3 p-4 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-secondary-foreground font-mono whitespace-pre-wrap">{file.text_content}</p>
                      </div>
                    )}
                    {file.file_url && file.file_type === 'image' && (
                      <img src={file.file_url} alt={file.title} className="mt-3 rounded-lg max-h-80 object-cover" />
                    )}
                    {file.file_url && file.file_type === 'video' && (
                      <video src={file.file_url} controls className="mt-3 rounded-lg max-h-80 w-full" />
                    )}
                    {file.file_url && file.file_type === 'audio' && (
                      <audio src={file.file_url} controls className="mt-3 w-full" />
                    )}
                    {file.file_url && file.file_type === 'document' && (
                      <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline font-mono">
                        <File className="w-4 h-4" /> View Document
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {new Date(file.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

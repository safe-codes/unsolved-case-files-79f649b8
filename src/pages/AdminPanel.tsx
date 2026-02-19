import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, Trash2, Music, Eye, Settings, FileText, Plus } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type CaseFile = Tables<'case_files'>;
type AccessAttempt = Tables<'access_attempts'>;

export default function AdminPanel() {
  const [tab, setTab] = useState<'cases' | 'attempts' | 'settings'>('cases');
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [attempts, setAttempts] = useState<AccessAttempt[]>([]);
  const [sitePassword, setSitePassword] = useState('');
  const [musicUrl, setMusicUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  // New case file form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('text');
  const [newText, setNewText] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    checkAdmin();
    loadData();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/ctrl-access'); return; }
    const { data } = await supabase.from('admins').select('id').eq('user_id', user.id).maybeSingle();
    if (!data) { await supabase.auth.signOut(); navigate('/ctrl-access'); }
  }

  async function loadData() {
    setLoading(true);
    const [filesRes, attemptsRes, configRes] = await Promise.all([
      supabase.from('case_files').select('*').order('display_order'),
      supabase.from('access_attempts').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('site_config').select('*').limit(1).single(),
    ]);
    setCaseFiles(filesRes.data || []);
    setAttempts(attemptsRes.data || []);
    setSitePassword(configRes.data?.site_password || '');
    setMusicUrl(configRes.data?.music_url || '');
    setLoading(false);
  }

  async function handleUploadCase(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setUploading(true);

    let fileUrl: string | undefined;

    if (newFile && newType !== 'text') {
      const ext = newFile.name.split('.').pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('case-files').upload(path, newFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from('case-files').getPublicUrl(path);
        fileUrl = urlData.publicUrl;
      }
    }

    await supabase.from('case_files').insert({
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      file_type: newType,
      file_url: fileUrl || null,
      text_content: newType === 'text' ? newText : null,
      display_order: caseFiles.length,
    });

    setNewTitle('');
    setNewDesc('');
    setNewText('');
    setNewFile(null);
    setUploading(false);
    loadData();
  }

  async function deleteCase(id: string) {
    await supabase.from('case_files').delete().eq('id', id);
    loadData();
  }

  async function updateSitePassword() {
    await supabase.from('site_config').update({ site_password: sitePassword }).neq('id', '');
  }

  async function uploadMusic(file: File) {
    const path = `bg-music-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('music').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('music').getPublicUrl(path);
      await supabase.from('site_config').update({ music_url: data.publicUrl }).neq('id', '');
      setMusicUrl(data.publicUrl);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/ctrl-access');
  }

  const tabs = [
    { id: 'cases' as const, label: 'Cases', icon: FileText },
    { id: 'attempts' as const, label: 'Access Log', icon: Eye },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-6xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <span className="font-mono text-sm tracking-wider text-foreground uppercase">Admin Panel</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="container max-w-6xl flex gap-1 py-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-colors ${tab === t.id ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container max-w-6xl py-8">
        {/* Cases Tab */}
        {tab === 'cases' && (
          <div className="space-y-6 animate-fade-in">
            {/* Upload form */}
            <form onSubmit={handleUploadCase} className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-mono text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Case File
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="h-11 px-4 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <select value={newType} onChange={e => setNewType(e.target.value)} className="h-11 px-4 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full h-11 px-4 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {newType === 'text' ? (
                <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Text content" rows={4} className="w-full px-4 py-3 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono" />
              ) : (
                <input type="file" onChange={e => setNewFile(e.target.files?.[0] || null)} className="text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground file:cursor-pointer" />
              )}
              <button type="submit" disabled={uploading || !newTitle.trim()} className="h-11 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-all hover:brightness-110 disabled:opacity-40 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>

            {/* Existing cases */}
            <div className="space-y-2">
              {caseFiles.map(file => (
                <div key={file.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{file.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">{file.file_type} · {new Date(file.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => deleteCase(file.id)} className="text-muted-foreground hover:text-destructive transition-colors p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Log Tab */}
        {tab === 'attempts' && (
          <div className="animate-fade-in">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Time</th>
                      <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Password</th>
                      <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Device</th>
                      <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">Browser</th>
                      <th className="text-left p-4 font-mono text-xs text-muted-foreground uppercase tracking-wider">OS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map(a => {
                      const info = a.device_info as any;
                      return (
                        <tr key={a.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="p-4 font-mono text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                          <td className="p-4 font-mono text-xs text-foreground">{a.password_tried}</td>
                          <td className="p-4">
                            <span className={`text-xs font-mono px-2 py-1 rounded ${a.success ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                              {a.success ? 'SUCCESS' : 'DENIED'}
                            </span>
                          </td>
                          <td className="p-4 text-xs text-muted-foreground">{info?.deviceType || '-'}{info?.phoneModel ? ` (${info.phoneModel})` : ''}</td>
                          <td className="p-4 text-xs text-muted-foreground">{info?.browser || '-'}</td>
                          <td className="p-4 text-xs text-muted-foreground">{info?.os || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {attempts.length === 0 && (
                <p className="text-center py-10 text-muted-foreground text-sm">No access attempts logged yet</p>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="space-y-6 max-w-lg animate-fade-in">
            {/* Site Password */}
            <div className="glass-card rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-mono text-muted-foreground tracking-wider uppercase">Site Password</h3>
              <div className="flex gap-2">
                <input value={sitePassword} onChange={e => setSitePassword(e.target.value)} className="flex-1 h-11 px-4 bg-input border border-border rounded-lg text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <button onClick={updateSitePassword} className="h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all">
                  Save
                </button>
              </div>
            </div>

            {/* Background Music */}
            <div className="glass-card rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-mono text-muted-foreground tracking-wider uppercase flex items-center gap-2">
                <Music className="w-4 h-4" /> Background Music
              </h3>
              {musicUrl && (
                <div className="text-xs text-muted-foreground font-mono truncate">
                  Current: {musicUrl.split('/').pop()}
                </div>
              )}
              <input
                type="file"
                accept="audio/*"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) uploadMusic(f);
                }}
                className="text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-secondary file:text-secondary-foreground file:cursor-pointer"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

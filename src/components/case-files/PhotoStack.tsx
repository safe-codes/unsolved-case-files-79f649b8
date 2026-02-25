import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Photo {
  id: string;
  photo_url: string;
  display_order: number;
}

export default function PhotoStack({ photos }: { photos: Photo[] }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!photos.length) return null;

  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);

  const openViewer = (index: number) => setViewerIndex(index);
  const closeViewer = () => setViewerIndex(null);
  const goPrev = () => setViewerIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  const goNext = () => setViewerIndex((i) => (i !== null && i < sorted.length - 1 ? i + 1 : i));

  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Photographic Evidence ({photos.length})
      </p>

      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
        {sorted.map((photo, i) => (
          <button
            key={photo.id}
            className="polaroid-frame p-1.5 hover:scale-105 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-sm"
            onClick={() => openViewer(i)}
          >
            <img
              src={photo.photo_url}
              alt={`Evidence ${i + 1}`}
              className="w-full h-20 sm:h-24 object-cover rounded-sm"
              draggable={false}
            />
            <p className="polaroid-caption mt-1 text-center text-[8px]">
              {i + 1} / {sorted.length}
            </p>
          </button>
        ))}
      </div>

      {/* Full-screen viewer */}
      <AnimatePresence>
        {viewerIndex !== null && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeViewer}
          >
            {/* Close button */}
            <button
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
              onClick={closeViewer}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-xs text-muted-foreground">
              {viewerIndex + 1} / {sorted.length}
            </div>

            {/* Image */}
            <motion.img
              key={sorted[viewerIndex].id}
              src={sorted[viewerIndex].photo_url}
              alt={`Evidence photo ${viewerIndex + 1}`}
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation arrows */}
            {viewerIndex > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {viewerIndex < sorted.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

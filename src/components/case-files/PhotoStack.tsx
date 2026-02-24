import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Photo {
  id: string;
  photo_url: string;
  display_order: number;
}

// Deterministic random-ish values based on index
function getCardTransform(index: number, total: number) {
  const rotations = [-3, 2.5, -1.8, 3.2, -2.1, 1.5, -2.8, 3.5, -1.2, 2];
  const xOffsets = [0, 2, -1, 3, -2, 1, -3, 2, -1, 3];
  const yOffsets = [0, 1, 2, -1, 1, -2, 1, 0, 2, -1];
  return {
    rotate: rotations[index % rotations.length],
    x: xOffsets[index % xOffsets.length],
    y: yOffsets[index % yOffsets.length] - index * 2,
  };
}

// Disperse positions — fly outward in different directions
function getDisperseTransform(index: number, total: number) {
  const angle = (index / total) * 360 + (index * 37); // spread evenly-ish
  const rad = (angle * Math.PI) / 180;
  const distance = 120 + index * 30;
  return {
    x: Math.cos(rad) * distance,
    y: Math.sin(rad) * distance,
    rotate: (index % 2 === 0 ? 1 : -1) * (15 + index * 8),
    scale: 0.7,
    opacity: 0,
  };
}

export default function PhotoStack({ photos }: { photos: Photo[] }) {
  const [dispersed, setDispersed] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  if (!photos.length) return null;

  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Photographic Evidence ({photos.length})
      </p>

      {/* Stack view */}
      <div className="flex justify-center py-4">
        <div
          className="relative cursor-pointer"
          style={{ width: '260px', height: '300px' }}
          onClick={() => setDispersed(!dispersed)}
        >
          <AnimatePresence>
            {sorted.map((photo, i) => {
              const stackPos = getCardTransform(i, sorted.length);
              const dispersePos = getDisperseTransform(i, sorted.length);

              return (
                <motion.div
                  key={photo.id}
                  className="absolute inset-0 polaroid-frame"
                  style={{ zIndex: dispersed ? sorted.length - i : sorted.length - i }}
                  initial={stackPos}
                  animate={
                    dispersed
                      ? {
                          ...dispersePos,
                          transition: {
                            type: 'spring',
                            stiffness: 200,
                            damping: 20,
                            delay: i * 0.04,
                          },
                        }
                      : {
                          ...stackPos,
                          scale: 1,
                          opacity: 1,
                          transition: {
                            type: 'spring',
                            stiffness: 300,
                            damping: 25,
                            delay: i * 0.03,
                          },
                        }
                  }
                  whileHover={!dispersed ? { y: stackPos.y - 8, scale: 1.02 } : {}}
                  onClick={(e) => {
                    if (!dispersed) {
                      e.stopPropagation();
                      setDispersed(true);
                    }
                  }}
                >
                  <img
                    src={photo.photo_url}
                    alt={`Evidence photo ${i + 1}`}
                    className="w-full h-56 object-cover rounded-sm"
                    draggable={false}
                  />
                  <p className="polaroid-caption mt-2 text-center">
                    PHOTO {i + 1} of {sorted.length}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Click hint */}
          {!dispersed && sorted.length > 1 && (
            <motion.div
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest whitespace-nowrap"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Click to spread • {sorted.length} photos
            </motion.div>
          )}
        </div>
      </div>

      {/* Dispersed gallery — show individual clickable thumbnails */}
      <AnimatePresence>
        {dispersed && (
          <motion.div
            className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-12 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.3 }}
          >
            {sorted.map((photo, i) => (
              <motion.button
                key={photo.id}
                className="polaroid-frame p-1.5 hover:scale-105 transition-transform cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhoto(photo);
                }}
              >
                <img
                  src={photo.photo_url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-20 sm:h-24 object-cover rounded-sm"
                />
              </motion.button>
            ))}
            <motion.button
              className="col-span-full text-center font-mono text-[10px] text-primary/60 hover:text-primary transition-colors uppercase tracking-widest py-2"
              onClick={(e) => {
                e.stopPropagation();
                setDispersed(false);
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              ← Stack photos
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img
              src={selectedPhoto.photo_url}
              alt="Evidence full view"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

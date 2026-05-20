'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './logo';

export function BrandLoader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-brand-blue-700 via-brand-blue-600 to-brand-aqua-700"
        >
          <div className="absolute inset-0 mesh-brand opacity-50" />
          <div className="absolute inset-0 grid-bg opacity-10" />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-6"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-3xl bg-white/10 p-5 shadow-2xl backdrop-blur-xl border border-white/20"
            >
              <Logo variant="mark" size={64} />
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <motion.h1
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-2xl font-bold tracking-tight text-white font-display"
              >
                Baldecash Recruitment
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-xs uppercase tracking-[0.3em] text-white/70"
              >
                Talent intelligence
              </motion.p>
              <div className="mt-4 h-1 w-40 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-gold-300 via-brand-aqua-300 to-brand-blue-200"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

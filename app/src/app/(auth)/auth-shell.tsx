'use client';

import { motion } from 'framer-motion';
import { Logo } from '@/components/brand/logo';

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(440px,540px)]">
      {/* ===== Lado izquierdo: branding con fondo oscuro premium ===== */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
        {/* Capa de fondo oscuro brand */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#2b2f8a_0%,#151744_45%,#0a0c2e_100%)]" />
        {/* Mesh decorativo */}
        <div
          className="absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(at 20% 20%, rgba(104,115,215,0.35) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0,162,155,0.25) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(253,202,86,0.18) 0px, transparent 50%)',
          }}
        />
        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Orbes animados */}
        <motion.div
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-brand-aqua-500/35 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 24, 0], x: [0, -12, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-brand-gold-400/25 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute left-1/3 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-brand-blue-300/25 blur-3xl"
        />

        {/* Contenido: logo arriba, headline al centro, copy abajo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center gap-3"
        >
          <div className="rounded-xl bg-white/15 p-2.5 ring-1 ring-white/30 backdrop-blur">
            <Logo variant="mark" size={28} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-bold tracking-tight">
              Baldecash
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-white/75">
              Recruitment
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="relative max-w-xl"
        >
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.25)] xl:text-6xl">
            Lleva tu reclutamiento <br />
            <span className="bg-gradient-to-r from-brand-gold-300 via-brand-aqua-300 to-white bg-clip-text text-transparent">
              al siguiente nivel.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
            Tu pipeline de talento, sincronizado con Airtable en tiempo real.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative flex items-center justify-between text-xs text-white/55"
        >
          <p>© {new Date().getFullYear()} Baldecash · Plataforma interna</p>
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-aqua-300 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-aqua-300" />
            </span>
            Talent intelligence
          </span>
        </motion.div>
      </div>

      {/* ===== Lado derecho: form sobre fondo claro sólido ===== */}
      <div className="relative flex items-center justify-center bg-background p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

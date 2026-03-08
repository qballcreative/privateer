import { motion } from 'framer-motion';
import heroBg from '@/assets/hero-bg.jpg';
import privateerLogo from '@/assets/Privateer.png';

export const HeroSection = () => {
  return (
    <section className="relative w-full h-[40vh] md:h-[50vh] lg:h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* Medallion Logo */}
        <motion.img
          src={privateerLogo}
          alt="Privateer: Letters of Marque"
          className="w-28 h-28 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain drop-shadow-[0_0_20px_hsl(var(--brass)/0.5)]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          style={{ animation: 'float 4s ease-in-out infinite' }}
        />

        {/* Title */}
        <motion.h1
          className="font-pirate text-5xl md:text-7xl lg:text-8xl text-primary mt-4 drop-shadow-[0_0_30px_hsl(var(--gold)/0.5)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Plunder
        </motion.h1>

        <motion.p
          className="text-base md:text-lg text-foreground/60 font-serif mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          A Trading Duel
        </motion.p>
      </div>
    </section>
  );
};

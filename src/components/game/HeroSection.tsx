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
          className="w-[55vw] max-w-[22rem] md:w-[40vw] md:max-w-[26rem] lg:w-[30vw] lg:max-w-[30rem] object-contain drop-shadow-[0_0_30px_hsl(var(--brass)/0.5)]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          style={{ animation: 'float 4s ease-in-out infinite' }}
        />
      </div>
    </section>
  );
};

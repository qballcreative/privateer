import { motion } from 'framer-motion';
const heroBg = '/images/hero-bg.jpg';
import privateerLogo from '@/assets/Privateer.png';
import { Users, Clock, Dices } from 'lucide-react';

const infoBadges = [
{ icon: Users, label: '2 Players' },
{ icon: Clock, label: '20–30 min' },
{ icon: Dices, label: 'Ages 10+' }];


export const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[40vh] md:min-h-[44vh] lg:min-h-[50vh] flex items-center justify-center overflow-hidden mb-8 md:mb-12 py-8">
      {/* Background - using img for LCP discoverability + fetchPriority */}
      <div className="absolute inset-0">
        <img
          src={heroBg}
          alt=""
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover object-center"
          ref={(el) => { if (el) el.setAttribute('fetchpriority', 'high'); }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 gap-4">
        {/* Logo */}
        <motion.img
          src={privateerLogo}
          alt="Privateer: Letters of Marque"
          width={448}
          height={448}
          // @ts-ignore - fetchPriority is valid HTML but not in React types yet
          fetchPriority="high"
          decoding="async"
          className="w-[50vw] max-w-[20rem] md:w-[35vw] md:max-w-[24rem] lg:w-[28vw] lg:max-w-[28rem] aspect-square object-contain drop-shadow-[0_0_30px_hsl(var(--brass)/0.5)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }} />
        

        {/* Tagline */}
        <motion.p
          className="text-sm md:text-base text-foreground/70 font-semibold tracking-wide uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}>
          
          A Strategic Trading Game
        </motion.p>

        {/* Info badges */}
        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}>
          
          {infoBadges.map(({ icon: Icon, label }) =>
          <div
            key={label}
            className="game-box-badge flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold">
            
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          )}
        </motion.div>
      </div>
    </section>);

};
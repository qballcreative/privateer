import { motion } from 'framer-motion';
import { Trophy, Target, AlertTriangle } from 'lucide-react';

const conditions = [
  { icon: Trophy, text: 'Most doubloons wins the voyage' },
  { icon: Target, text: 'Win 2 of 3 voyages to become Privateer Lord' },
  { icon: AlertTriangle, text: 'Voyage ends when Supply Ship empties or 3 cargo stacks are depleted' },
];

export const VictoryConditions = () => {
  return (
    <section className="relative py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="game-box-card p-6 md:p-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary text-center mb-6">
            How to Win
          </h2>

          <div className="flex flex-col gap-2">
            {conditions.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 border border-border"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-foreground/80 text-sm md:text-base">{text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

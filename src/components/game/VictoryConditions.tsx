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
          className="rounded-xl border-2 border-[hsl(var(--brass-light)/0.4)] bg-card/90 p-6 md:p-8 shadow-[var(--shadow-brass)]"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-pirate text-2xl md:text-3xl text-primary text-center mb-6">
            Victory Conditions
          </h2>

          <div className="space-y-4">
            {conditions.map(({ icon: Icon, text }, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/15 border border-primary/20">
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

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
          className="cargo-slot p-6 md:p-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="font-pirate text-2xl md:text-3xl text-primary text-center mb-6">
            Victory Conditions
          </h2>

          <div className="flex flex-col">
            {conditions.map(({ icon: Icon, text }, i) => (
              <div key={i}>
                {i > 0 && <hr className="wood-separator my-1" />}
                <motion.div
                  className="flex items-center gap-4 p-3 cargo-slot"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-[hsl(var(--brass)/0.2)] border border-[hsl(var(--brass-light)/0.3)] shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-foreground/80 text-sm md:text-base">{text}</p>
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

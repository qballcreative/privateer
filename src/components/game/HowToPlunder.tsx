import { motion } from 'framer-motion';
import { Package, ArrowLeftRight, Coins } from 'lucide-react';

const steps = [
  {
    icon: Package,
    title: 'Claim Cargo',
    description: 'Take goods from the Trading Post to fill your Ship\'s Hold, or commandeer all ships at once.',
  },
  {
    icon: ArrowLeftRight,
    title: 'Trade Goods',
    description: 'Exchange 2+ goods between your Hold and the Trading Post. Ships act as wildcards!',
  },
  {
    icon: Coins,
    title: 'Unload Cargo',
    description: 'Sell matching cargo for doubloons. Larger shipments earn bonus Commission Medallions!',
  },
];

export const HowToPlunder = () => {
  return (
    <section className="relative py-12 px-4 bg-card/80 backdrop-blur-sm border-t border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-pirate text-3xl md:text-4xl text-primary text-center mb-8">
          How to Plunder
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="p-6 rounded-xl border-2 border-[hsl(var(--rope))] bg-card/80 text-center hover:border-primary/40 transition-colors"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-[hsl(var(--brass)/0.15)] border border-[hsl(var(--brass-light)/0.3)]">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-pirate text-xl text-primary mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

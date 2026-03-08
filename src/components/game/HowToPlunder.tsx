import { motion } from 'framer-motion';
import { Package, ArrowLeftRight, Coins } from 'lucide-react';

const steps = [
  {
    icon: Package,
    num: 1,
    title: 'Claim Cargo',
    description: 'Take goods from the Trading Post to fill your Ship\'s Hold, or commandeer all ships at once.',
  },
  {
    icon: ArrowLeftRight,
    num: 2,
    title: 'Trade Goods',
    description: 'Exchange 2+ goods between your Hold and the Trading Post. Ships act as wildcards!',
  },
  {
    icon: Coins,
    num: 3,
    title: 'Sell Cargo',
    description: 'Sell matching cargo for doubloons. Larger shipments earn bonus Commission Medallions!',
  },
];

export const HowToPlunder = () => {
  return (
    <section className="relative py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-center mb-8">
          How to Play
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              className="game-box-card p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Step number */}
              <div className="step-badge mx-auto mb-3">
                {step.num}
              </div>

              {/* Icon */}
              <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-primary/10 border border-primary/20">
                <step.icon className="w-6 h-6 text-primary" />
              </div>

              <h3 className="font-serif text-xl font-bold text-primary mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

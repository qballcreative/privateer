import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
const steps = [
  {
    img: '/Icons/Claim.png',
    num: 1,
    title: 'Claim Cargo',
    description: 'Take goods from the Trading Post to fill your Ship\'s Hold, or commandeer all ships at once.',
  },
  {
    img: '/Icons/Trade.png',
    num: 2,
    title: 'Trade Goods',
    description: 'Exchange 2+ goods between your Hold and the Trading Post. Ships act as wildcards!',
  },
  {
    img: '/Icons/Sell.png',
    num: 3,
    title: 'Sell Cargo',
    description: 'Sell matching cargo for doubloons. Larger shipments earn bonus Commission Medallions!',
  },
];

export const HowToPlunder = () => {
  const navigate = useNavigate();
  return (
    <section className="relative py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-primary text-center mb-2">
          How to Play
        </h2>
        <p className="text-center mb-8">
          <button
            onClick={() => navigate('/how-to-play')}
            className="text-sm text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
          >
            Full instructions &amp; interactive tutorial →
          </button>
        </p>
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

              {/* Icon image */}
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-3">
                <img src={step.img} alt={step.title} className="w-14 h-14 object-contain" />
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

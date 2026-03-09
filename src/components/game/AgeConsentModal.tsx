import { useState } from 'react';
import { motion } from 'framer-motion';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useConsentStore, AgeGroup } from '@/store/consentStore';
import { Shield, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import privateerLogo from '@/assets/Privateer.png';

interface AgeConsentModalProps {
  onComplete?: () => void;
}

const ageOptions: { value: AgeGroup; label: string }[] = [
  { value: 'under13', label: 'Under 13' },
  { value: '13-15', label: '13–15' },
  { value: '16-17', label: '16–17' },
  { value: '18+', label: '18+' },
];

export const AgeConsentModal = ({ onComplete }: AgeConsentModalProps) => {
  const { setConsent } = useConsentStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [personalized, setPersonalized] = useState(false);

  const handleNext = () => {
    if (!selectedAge) return;

    if (selectedAge === 'under13') {
      // Under 13 — restricted, no ads, no personalization
      setConsent(selectedAge, false);
      onComplete?.();
      return;
    }

    // 13+ — go to step 2
    setStep(2);
  };

  const handleFinish = () => {
    if (!selectedAge) return;
    // For 13-17, personalization is forced off regardless of checkbox state
    const allowPersonalized = selectedAge === '18+' ? personalized : false;
    setConsent(selectedAge, allowPersonalized);
    onComplete?.();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex flex-col items-center mb-6">
          <img src={privateerLogo} alt="Privateer" width="192" height="192" className="w-48 mb-4" />
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h2 className="font-pirate text-2xl text-primary">Welcome Aboard</h2>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <Label className="text-sm text-foreground mb-3 block">
                Please select your age group to continue:
              </Label>
              <RadioGroup
                value={selectedAge ?? ''}
                onValueChange={(v) => setSelectedAge(v as AgeGroup)}
                className="space-y-3"
              >
                {ageOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedAge === opt.value
                        ? 'border-primary/50 bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <RadioGroupItem value={opt.value} id={`age-${opt.value}`} />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {selectedAge === 'under13' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 rounded-lg bg-muted/50 border border-border"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A simplified version is available for younger players. Full gameplay, multiplayer,
                  advanced rules, and ad‑supported features are available for players 13+.
                </p>
              </motion.div>
            )}

            <Button
              onClick={handleNext}
              disabled={!selectedAge}
              className="w-full"
              variant="gold"
            >
              Continue
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-foreground mb-2">
                This game includes ads to keep it free. You can choose how ads are shown:
              </p>

              {selectedAge === '18+' ? (
                <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/30 cursor-pointer transition-colors">
                  <Checkbox
                    checked={personalized}
                    onCheckedChange={(c) => setPersonalized(c === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">Personalized ads</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Ads may be tailored based on your activity. You can change this anytime in Settings.
                    </p>
                  </div>
                </label>
              ) : (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    For your age group, only non-personalized ads will be shown.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleFinish} variant="gold" className="flex-1">
                Start Playing
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

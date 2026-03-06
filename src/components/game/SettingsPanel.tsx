import { useState } from 'react';
import { Settings, Volume2, VolumeX, Music, Clock, Scroll, CloudLightning, Crosshair, Gift, Shield, Eye } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useConsentStore, AgeGroup } from '@/store/consentStore';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OptionalRules } from '@/types/game';
import { cn } from '@/lib/utils';
import { AgeConsentModal } from './AgeConsentModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

const optionalRulesConfig = [
  {
    key: 'stormRule' as keyof OptionalRules,
    icon: CloudLightning,
    label: 'Storm Rule',
    description: 'Every 3rd turn, discard 2 random market cards',
    color: 'text-blue-400',
  },
  {
    key: 'pirateRaid' as keyof OptionalRules,
    icon: Crosshair,
    label: 'Pirate Raid',
    description: 'Steal one card from opponent once per game',
    color: 'text-red-400',
  },
  {
    key: 'treasureChest' as keyof OptionalRules,
    icon: Gift,
    label: 'Treasure Chest',
    description: 'Hidden bonus tokens revealed at round end',
    color: 'text-amber-400',
  },
];

const AGE_LABELS: Record<AgeGroup, string> = {
  'under13': 'Under 13',
  '13-15': '13–15',
  '16-17': '16–17',
  '18+': '18+',
};

export const SettingsPanel = () => {
  const {
    soundEnabled,
    musicEnabled,
    soundVolume,
    musicVolume,
    actionNotificationDuration,
    optionalRules,
    setSoundEnabled,
    setMusicEnabled,
    setSoundVolume,
    setMusicVolume,
    setActionNotificationDuration,
    setOptionalRule,
  } = useSettingsStore();

  const {
    ageGroup,
    adsEnabled,
    personalizedAds,
    paidAdFree,
    restrictedMode,
    hasConsented,
    setPaidAdFree,
    resetConsent,
  } = useConsentStore();

  const [showConsentModal, setShowConsentModal] = useState(false);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Settings className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-card border-primary/20 p-0">
        <ScrollArea className="h-full">
          <div className="p-6">
            <SheetHeader>
              <SheetTitle className="font-pirate text-primary">Settings</SheetTitle>
              <SheetDescription>Customize your game experience</SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 mt-6">
              {/* Sound Effects */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-muted-foreground" />
                    )}
                    <Label htmlFor="sound-enabled">Sound Effects</Label>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                  />
                </div>
                
                {soundEnabled && (
                  <div className="pl-7 space-y-2">
                    <Label className="text-xs text-muted-foreground">Volume</Label>
                    <Slider
                      value={[soundVolume * 100]}
                      onValueChange={([value]) => setSoundVolume(value / 100)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Background Music */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className={`w-5 h-5 ${musicEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <Label htmlFor="music-enabled">Background Music</Label>
                  </div>
                  <Switch
                    id="music-enabled"
                    checked={musicEnabled}
                    onCheckedChange={setMusicEnabled}
                  />
                </div>
                
                {musicEnabled && (
                  <div className="pl-7 space-y-2">
                    <Label className="text-xs text-muted-foreground">Volume</Label>
                    <Slider
                      value={[musicVolume * 100]}
                      onValueChange={([value]) => setMusicVolume(value / 100)}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Action Notification Duration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <Label>Action Notification Duration</Label>
                </div>
                <div className="pl-7 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      {actionNotificationDuration} second{actionNotificationDuration !== 1 ? 's' : ''}
                    </Label>
                  </div>
                  <Slider
                    value={[actionNotificationDuration]}
                    onValueChange={([value]) => setActionNotificationDuration(value)}
                    min={1}
                    max={10}
                    step={0.5}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border" />

              {/* Game Rules Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Scroll className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Game Rules</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Optional rules to add variety to your games
                </p>
                
                <div className="space-y-3">
                  {optionalRulesConfig.map((rule) => (
                    <div
                      key={rule.key}
                      className={cn(
                        'p-3 rounded-lg border transition-all duration-200',
                        optionalRules[rule.key]
                          ? 'border-primary/30 bg-primary/5'
                          : 'border-border bg-muted/30'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <rule.icon
                            className={cn(
                              'w-5 h-5',
                              optionalRules[rule.key] ? rule.color : 'text-muted-foreground'
                            )}
                          />
                          <div>
                            <Label className="text-sm font-medium">{rule.label}</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={optionalRules[rule.key]}
                          onCheckedChange={(checked) => setOptionalRule(rule.key, checked)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

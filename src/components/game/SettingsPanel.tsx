import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Volume2, VolumeX, Music, Clock, Scroll, Shield, Eye, BookOpen, Sun, Moon, GraduationCap } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useConsentStore, AgeGroup } from '@/store/consentStore';
import { useGameStore } from '@/store/gameStore';
import { useTutorialStore } from '@/store/tutorialStore';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { OptionalRules } from '@/types/game';
import { cn } from '@/lib/utils';
import { AgeConsentModal } from './AgeConsentModal';
import { RemoveAdsButton } from './RemoveAdsButton';
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
    image: '/Icons/storm.webp',
    label: 'Storm Rule',
    description: 'Every 3rd turn, discard 2 random market cards',
  },
  {
    key: 'pirateRaid' as keyof OptionalRules,
    image: '/Icons/raid.webp',
    label: 'Pirate Raid',
    description: 'Steal one card from opponent once per game',
  },
  {
    key: 'treasureChest' as keyof OptionalRules,
    image: '/Icons/treasure.webp',
    label: 'Treasure Chest',
    description: 'Hidden bonus tokens revealed at round end',
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
    theme,
    setSoundEnabled,
    setMusicEnabled,
    setSoundVolume,
    setMusicVolume,
    setActionNotificationDuration,
    setOptionalRule,
    setTheme,
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

  const { phase } = useGameStore();
  const { start: startTutorial } = useTutorialStore();

  const navigate = useNavigate();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" aria-label="Settings">
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

              {/* Theme Toggle */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'flex items-center justify-center gap-2 min-h-[44px] rounded-lg border font-semibold text-sm transition-all',
                      theme === 'dark'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                    )}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                  <button
                    onClick={() => setTheme('parchment')}
                    className={cn(
                      'flex items-center justify-center gap-2 min-h-[44px] rounded-lg border font-semibold text-sm transition-all',
                      theme === 'parchment'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
                    )}
                  >
                    <Sun className="w-4 h-4" />
                    Parchment
                  </button>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border" />

              {/* Separator */}
              <div className="border-t border-border" />

              {/* Privacy & Ads Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Privacy & Ads</Label>
                </div>

                {hasConsented && ageGroup && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-muted/50 border border-border">
                        <span className="text-muted-foreground">Age Group</span>
                        <p className="font-medium text-foreground">{AGE_LABELS[ageGroup]}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 border border-border">
                        <span className="text-muted-foreground">Ads</span>
                        <p className="font-medium text-foreground">
                          {paidAdFree ? 'Removed' : adsEnabled ? 'On' : 'Off'}
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 border border-border">
                        <span className="text-muted-foreground">Personalization</span>
                        <p className="font-medium text-foreground">{personalizedAds ? 'On' : 'Off'}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50 border border-border">
                        <span className="text-muted-foreground">Mode</span>
                        <p className="font-medium text-foreground">{restrictedMode ? 'Simplified' : 'Full'}</p>
                      </div>
                    </div>

                    {/* Remove Ads — mobile/tablet IAP */}
                    <RemoveAdsButton />
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    resetConsent();
                    setShowConsentModal(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Change Age & Ad Preferences
                </Button>
              </div>

              {/* How to Play link */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate('/how-to-play')}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                How to Play
              </Button>

              {/* Replay Tutorial — only during a game */}
              {phase === 'playing' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    startTutorial();
                    setOpen(false);
                  }}
                >
                  <GraduationCap className="w-4 h-4 mr-1" />
                  Replay Tutorial
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>

      {/* Consent modal overlay */}
      {showConsentModal && (
        <AgeConsentModal onComplete={() => setShowConsentModal(false)} />
      )}
    </Sheet>
  );
};

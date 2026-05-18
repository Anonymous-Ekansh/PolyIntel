'use client';

import { useAppStore } from '@/store/useAppStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, Clock, Fish, Save } from 'lucide-react';

export default function SettingsModal() {
  const isOpen = useAppStore(s => s.isSettingsOpen);
  const setSettingsOpen = useAppStore(s => s.setSettingsOpen);
  const settings = useAppStore(s => s.settings);
  const updateSettings = useAppStore(s => s.updateSettings);

  return (
    <Dialog open={isOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-[#1e1e3a] bg-[#0f0f1a] text-[#c8c8d4] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            <Settings className="h-5 w-5 text-[#00ff88]" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-5">
          {/* API Keys */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-[#ffaa00]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>API Keys</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block font-mono text-xs text-[#c8c8d4]/60">RSS2JSON Key</Label>
                <Input type="text" value={settings.rss2jsonKey} onChange={(e) => updateSettings({ rss2jsonKey: e.target.value })}
                  placeholder="Loaded from .env" className="border-[#1e1e3a] bg-[#0a0a0f] font-mono text-xs text-white placeholder:text-[#c8c8d4]/20 focus:border-[#00ff88]/50" />
              </div>
              <div>
                <Label className="mb-1 block font-mono text-xs text-[#c8c8d4]/60">NewsData.io Key</Label>
                <Input type="text" value={settings.newsdataKey} onChange={(e) => updateSettings({ newsdataKey: e.target.value })}
                  placeholder="Loaded from .env" className="border-[#1e1e3a] bg-[#0a0a0f] font-mono text-xs text-white placeholder:text-[#c8c8d4]/20 focus:border-[#00ff88]/50" />
              </div>
              <div>
                <Label className="mb-1 block font-mono text-xs text-[#c8c8d4]/60">Anthropic Key (for AI Verdict)</Label>
                <Input type="password" value={settings.anthropicKey} onChange={(e) => updateSettings({ anthropicKey: e.target.value })}
                  placeholder="sk-ant-..." className="border-[#1e1e3a] bg-[#0a0a0f] font-mono text-xs text-white placeholder:text-[#c8c8d4]/20 focus:border-[#00ff88]/50" />
              </div>
            </div>
          </section>

          <Separator className="bg-[#1e1e3a]" />

          {/* Refresh */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#ffaa00]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>Refresh Interval</h3>
            </div>
            <div className="flex gap-2">
              {[30, 60, 120].map((v) => (
                <Button key={v} variant="outline" onClick={() => updateSettings({ refreshInterval: v as 30 | 60 | 120 })}
                  className={`flex-1 font-mono text-xs ${settings.refreshInterval === v ? 'border-[#00ff88]/50 bg-[#00ff88]/10 text-[#00ff88]' : 'border-[#1e1e3a] bg-transparent text-[#c8c8d4]/50'}`}>
                  {v}s
                </Button>
              ))}
            </div>
          </section>

          <Separator className="bg-[#1e1e3a]" />

          {/* Whale Threshold */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Fish className="h-4 w-4 text-[#ffaa00]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white" style={{ fontFamily: 'var(--font-heading)' }}>Whale Threshold</h3>
            </div>
            <div className="flex gap-2">
              {[5000, 10000, 25000].map((v) => (
                <Button key={v} variant="outline" onClick={() => updateSettings({ whaleThreshold: v })}
                  className={`flex-1 font-mono text-xs ${settings.whaleThreshold === v ? 'border-[#00ff88]/50 bg-[#00ff88]/10 text-[#00ff88]' : 'border-[#1e1e3a] bg-transparent text-[#c8c8d4]/50'}`}>
                  ${(v / 1000).toFixed(0)}K
                </Button>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#1e1e3a] pt-4">
          <p className="font-mono text-[10px] text-[#c8c8d4]/30">Auto-saves to localStorage</p>
          <Button onClick={() => setSettingsOpen(false)} className="bg-[#00ff88]/10 font-mono text-xs font-bold text-[#00ff88] hover:bg-[#00ff88]/20">
            <Save className="mr-1 h-3 w-3" /> Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

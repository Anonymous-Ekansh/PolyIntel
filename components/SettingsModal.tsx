"use client";

import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAppStore } from "@/store/useAppStore";

export default function SettingsModal() {
  const isOpen = useAppStore((state) => state.isSettingsOpen);
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen);
  const settings = useAppStore((state) => state.settings);
  const setSettings = useAppStore((state) => state.setSettings);

  return (
    <Dialog open={isOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border border-[#1e1e3a] bg-[#0f0f1a] text-[#c8c8d4] sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings2 className="size-5 text-[#00ff88]" />
            Terminal Settings
          </DialogTitle>
          <DialogDescription className="text-[#8b8ba3]">
            Stored locally in your browser. High-frequency panels keep their own fixed cadences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#6d6d84]">API Keys</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-[#a7a7bb]">RSS2JSON API Key</Label>
                <Input
                  value={settings.rss2jsonKey}
                  onChange={(event) => setSettings({ rss2jsonKey: event.target.value })}
                  placeholder="Optional but recommended"
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#a7a7bb]">NewsData API Key</Label>
                <Input
                  value={settings.newsdataKey}
                  onChange={(event) => setSettings({ newsdataKey: event.target.value })}
                  placeholder="Legacy optional feed key"
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs text-[#a7a7bb]">Anthropic API Key</Label>
                <Input
                  type="password"
                  value={settings.anthropicKey}
                  onChange={(event) => setSettings({ anthropicKey: event.target.value })}
                  placeholder="Optional direct browser call"
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
            </div>
          </section>

          <Separator className="bg-[#1e1e3a]" />

          <section className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#6d6d84]">Refresh Interval</div>
            <div className="flex flex-wrap gap-2">
              {[30, 60, 120].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  className={
                    settings.refreshInterval === value
                      ? "border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]"
                      : "border-[#1e1e3a] bg-[#0a0b14] text-[#b9b9c9]"
                  }
                  onClick={() => setSettings({ refreshInterval: value as 30 | 60 | 120 })}
                >
                  {value}s
                </Button>
              ))}
            </div>
          </section>

          <Separator className="bg-[#1e1e3a]" />

          <section className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#6d6d84]">Whale Threshold</div>
            <div className="flex flex-wrap gap-2">
              {[5000, 10000, 25000].map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  className={
                    settings.whaleThreshold === value
                      ? "border-[#ffaa00]/40 bg-[#ffaa00]/10 text-[#ffaa00]"
                      : "border-[#1e1e3a] bg-[#0a0b14] text-[#b9b9c9]"
                  }
                  onClick={() => setSettings({ whaleThreshold: value })}
                >
                  ${value / 1000}k
                </Button>
              ))}
            </div>
          </section>

          <Separator className="bg-[#1e1e3a]" />

          <section className="space-y-3">
            <div className="text-xs uppercase tracking-[0.24em] text-[#6d6d84]">Risk Limits</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-[#a7a7bb]">Max Portfolio Exposure</Label>
                <Input
                  type="number"
                  value={settings.riskLimits.maxPortfolioExposure}
                  onChange={(event) =>
                    setSettings({
                      riskLimits: {
                        ...settings.riskLimits,
                        maxPortfolioExposure: Number(event.target.value),
                      },
                    })
                  }
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#a7a7bb]">Max Single Market</Label>
                <Input
                  type="number"
                  value={settings.riskLimits.maxSingleMarket}
                  onChange={(event) =>
                    setSettings({
                      riskLimits: {
                        ...settings.riskLimits,
                        maxSingleMarket: Number(event.target.value),
                      },
                    })
                  }
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#a7a7bb]">Max Category %</Label>
                <Input
                  type="number"
                  value={settings.riskLimits.maxCategoryPercent}
                  onChange={(event) =>
                    setSettings({
                      riskLimits: {
                        ...settings.riskLimits,
                        maxCategoryPercent: Number(event.target.value),
                      },
                    })
                  }
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#a7a7bb]">Daily Loss Limit</Label>
                <Input
                  type="number"
                  value={settings.riskLimits.dailyLossLimit}
                  onChange={(event) =>
                    setSettings({
                      riskLimits: {
                        ...settings.riskLimits,
                        dailyLossLimit: Number(event.target.value),
                      },
                    })
                  }
                  className="border-[#1e1e3a] bg-[#0a0b14] text-white"
                />
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

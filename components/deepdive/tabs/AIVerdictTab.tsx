'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIVerdictTab() {
  const selectedMarket = useAppStore(s => s.selectedMarket);
  const allNews = useAppStore(s => s.news);
  const anthropicKey = useAppStore(s => s.settings.anthropicKey);
  
  const [verdict, setVerdict] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateVerdict = async () => {
    if (!selectedMarket || !anthropicKey) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const articles = allNews[selectedMarket.conditionId] || [];
      const headlines = articles.slice(0, 10).map(a => `- ${a.title}`).join('\n');
      
      const res = await fetch('/api/ai-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: anthropicKey,
          question: selectedMarket.question,
          yesPrice: (selectedMarket.yesPrice * 100).toFixed(1),
          volume: selectedMarket.volume24hr.toFixed(0),
          headlines
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate verdict');
      
      setVerdict(data.verdict);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedMarket) return null;

  return (
    <div className="p-4 lg:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#8b5cf6]" />
            <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              AI Analysis
            </h3>
          </div>
          
          <Button 
            onClick={generateVerdict} 
            disabled={!anthropicKey || isLoading}
            className="bg-[#8b5cf6]/10 text-[#8b5cf6] hover:bg-[#8b5cf6]/20 font-mono text-xs font-bold"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {verdict ? 'Regenerate' : 'Analyze Market'}
          </Button>
        </div>

        {!anthropicKey && (
          <div className="rounded-lg border border-[#ffaa00]/20 bg-[#ffaa00]/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-[#ffaa00] flex-shrink-0" />
            <div>
              <p className="font-mono text-xs font-semibold text-[#ffaa00] mb-1">Anthropic API Key Required</p>
              <p className="font-mono text-xs text-[#c8c8d4]/70">
                Please add your Anthropic API key in Settings to use the AI Analysis feature. It uses Claude Haiku to summarize the market and news.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-[#ff4444]/20 bg-[#ff4444]/5 p-4 mb-4">
            <p className="font-mono text-xs text-[#ff4444]">{error}</p>
          </div>
        )}

        {verdict && (
          <div className="rounded-lg border border-[#1e1e3a] bg-[#0f0f1a] p-6 shadow-lg">
            <div className="prose prose-invert max-w-none">
              <p className="font-mono text-sm leading-relaxed text-[#c8c8d4] whitespace-pre-wrap">
                {verdict}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

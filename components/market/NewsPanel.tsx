"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { ExternalLink, Newspaper } from "lucide-react";

interface NewsPanelProps {
  question: string;
  category: string;
}

export default function NewsPanel({ question, category }: NewsPanelProps) {
  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ["news", question, category],
    queryFn: async () => {
      const params = new URLSearchParams({ question, category });
      const res = await fetch(`/api/news/combined?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[#1e1e3a]/30 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-6 text-center text-sm text-[#8b93a7]">
        Failed to load related news.
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-6 text-center text-sm text-[#6d7488]">
        <Newspaper className="mx-auto size-8 mb-3 opacity-50" />
        No recent news found for this market
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article: any, i: number) => (
        <a 
          key={i} 
          href={article.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex flex-col justify-between rounded-xl border border-[#1e1e3a] bg-[#0c1019] p-4 hover:border-[#334066] hover:bg-[#131b2b] transition-all"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00ff88]">
                {article.source}
              </span>
              <span className="text-[10px] text-[#6d7488]">
                {formatDistanceToNowStrict(article.timestamp, { addSuffix: true })}
              </span>
            </div>
            <h4 className="text-sm text-[#d7d7e2] font-medium leading-snug line-clamp-3 group-hover:text-white transition-colors">
              {article.title}
            </h4>
          </div>
          <div className="mt-4 flex items-center text-[10px] uppercase tracking-widest text-[#6d7488] group-hover:text-[#00ff88] transition-colors">
            Read article <ExternalLink className="ml-1.5 size-3" />
          </div>
        </a>
      ))}
    </div>
  );
}

"use client";

import { formatDistanceToNowStrict } from "date-fns";
import { ExternalLink, Newspaper } from "lucide-react";

interface NewsPanelProps {
  news: any[];
}

export default function NewsPanel({ news }: NewsPanelProps) {
  if (!news || news.length === 0) {
    return (
      <div className="rounded-xl border border-[#1e1e3a] bg-[#101422] p-6 text-center text-sm text-[#6d7488]">
        <Newspaper className="mx-auto size-8 mb-3 opacity-50" />
        No recent news found for this market
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {news.map((article: any, i: number) => (
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
                {article.source || "News"}
              </span>
              <span className="text-[10px] text-[#6d7488]">
                {article.publishedAt ? formatDistanceToNowStrict(article.publishedAt, { addSuffix: true }) : "Recent"}
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

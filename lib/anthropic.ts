const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export async function generateMarketSummary({
  apiKey,
  question,
  headlines,
}: {
  apiKey: string;
  question: string;
  headlines: string[];
}) {
  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      system:
        "You are a prediction market analyst. Given a market question and recent news headlines, write a 3-sentence summary of the current situation and what direction the market is likely to move. Be concise and analytical.",
      messages: [
        {
          role: "user",
          content: `Market: ${question}\n\nRecent headlines:\n${headlines
            .slice(0, 5)
            .map((headline, index) => `${index + 1}. ${headline}`)
            .join("\n")}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate summary");
  }

  const json = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return json.content?.find((item) => item.type === "text")?.text?.trim() ?? "";
}

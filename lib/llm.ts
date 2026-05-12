import "server-only";

export async function generateWithFallback(prompt: string): Promise<{ answer: string; modelUsed: string }> {
  const models = [
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "google/gemini-2.0-flash-001"
  ];
  let lastError = "All models failed.";

  for (const model of models) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "Verdact"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      const data = await response.json();

      if (response.status === 429) {
        lastError = data?.error?.message ?? `${model} rate limited.`;
        console.warn(`${model} rate limited, trying next...`, data);
        continue;
      }

      if (!response.ok) {
        lastError = data?.error?.message ?? data?.message ?? `OpenRouter request failed with status ${response.status}`;
        console.error(`${model} failed with status ${response.status}:`, data);
        continue;
      }

      const answer = data.choices?.[0]?.message?.content;
      if (answer) return { answer, modelUsed: model };
      lastError = `${model} returned no answer.`;
      console.error(`${model} returned no answer:`, data);
    } catch (err) {
      lastError = err instanceof Error ? err.message : `${model} failed.`;
      console.error(`${model} failed:`, err);
      continue;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError}`);
}

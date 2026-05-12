import "server-only";

let embedderPromise: Promise<any> | null = null;

function getEmbedder() {
  if (!embedderPromise) {
    console.time("embedder-init");
    embedderPromise = import("@xenova/transformers")
      .then(({ pipeline }) =>
        pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
          quantized: true
        })
      )
      .then((embedder) => {
        console.timeEnd("embedder-init");
        return embedder;
      });
  }

  return embedderPromise;
}

export async function getEmbedding(text: string): Promise<number[]> {
  console.time("embedding");
  const embedder = await getEmbedder();
  const output = await embedder(text, { pooling: "mean", normalize: true });
  console.timeEnd("embedding");
  return Array.from(output.data) as number[];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

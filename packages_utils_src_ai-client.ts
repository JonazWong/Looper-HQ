import OpenAI from "openai";

type Provider = "openai" | "openrouter" | "azure";

const provider = (process.env.AI_PROVIDER as Provider) || "openai";

function createClient() {
  if (provider === "azure") {
    // TODO: 依你的 Azure 配置改寫
    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    });
  }

  if (provider === "openrouter") {
    return new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    });
  }

  // default: openai
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  });
}

const client = createClient();

export async function generateCompletion(params: {
  systemPrompt?: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const {
    systemPrompt,
    userPrompt,
    model = process.env.OPENAI_MODEL || "gpt-4.1-mini",
    maxTokens = Number(process.env.AI_MAX_TOKENS || 2048),
    temperature = Number(process.env.AI_TEMPERATURE || 0.3),
  } = params;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: userPrompt });

  const res = await client.chat.completions.create({
    model,
    temperature,
    max_tokens: maxTokens,
    messages,
  });

  return res.choices?.[0]?.message?.content ?? "";
}
const Anthropic = require("@anthropic-ai/sdk");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const anthropic = new Anthropic();
const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODEL_CONFIG = {
  claude: { provider: "claude", model: "claude-sonnet-4-6" },
  gemini: { provider: "gemini", model: "gemini-2.5-flash" },
};

function claudeToolsToGemini(claudeTools) {
  return [
    {
      functionDeclarations: claudeTools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      })),
    },
  ];
}

function claudeMessageToGemini(claudeMessages) {
  return claudeMessages.map((m) => {
    const role = m.role === "assistant" ? "model" : "user";
    if (typeof m.content === "string") {
      return { role, parts: [{ text: m.content }] };
    }

    return {
      role,
      parts: m.content.map((block) => {
        if (block.type === "text") return { text: block.text };
        if (block.type === "tool_use") {
          return {
            functionCall: {
              name: block.name,
              args: block.input,
            },
          };
        }
        if (block.type === "tool_result") {
          let parsed;
          try {
            parsed = JSON.parse(block.content);
          } catch {
            parsed = block.content;
          }
          const response =
            parsed && typeof parsed === "object" && !Array.isArray(parsed)
              ? parsed
              : { result: parsed };
          return { functionResponse: { name: block.tool_use_id, response } };
        }
        return { text: "" };
      }),
    };
  });
}

async function callClaude({ system, tools, messages, modelId }) {
  return anthropic.messages.create({
    model: modelId,
    max_tokens: 1024,
    system,
    tools,
    messages,
  });
}

async function callGemini({ system, tools, messages, modelId }) {
  const model = gemini.getGenerativeModel({
    model: modelId,
    systemInstruction: system,
    tools: claudeToolsToGemini(tools),
  });
  const result = await model.generateContent({
    contents: claudeMessageToGemini(messages),
  });
  return result.response;
}

async function chat({ modelKey, system, tools, messages }) {
  const config = MODEL_CONFIG[modelKey];
  if (!config) throw new Error("Model không hợp lệ");
  if (config.provider === "claude") {
    const response = await callClaude({
      system,
      tools,
      messages,
      modelId: config.model,
    });
    return { provider: "claude", response };
  } else if (config.provider === "gemini") {
    const response = await callGemini({
      system,
      tools,
      messages,
      modelId: config.model,
    });
    return { provider: "gemini", response };
  }
}

module.exports = {
  chat,
  MODEL_CONFIG,
};

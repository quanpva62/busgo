const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic();

const CLAUDE_MODEL = "claude-sonnet-4-6";

async function chat({ system, tools, messages }) {
  return anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system,
    tools,
    messages,
  });
}

module.exports = {
  chat,
};

import { ChatOpenAI } from "@langchain/openai";
import { task, entrypoint, interrupt, addMessages, getPreviousState } from "@langchain/langgraph";
import { BaseMessage, ToolMessage, SystemMessage } from "@langchain/core/messages";
import { initializeTools } from "./tools.js";
import { createCheckpointer } from "./checkpointer.js";
import { AGENT_PROMPT } from "./prompts.js";
import { ToolCall } from "@langchain/core/messages/tool";

// Initialize model
const model = new ChatOpenAI({
  modelName: "o3-mini",
  temperature: 0,
});

// Create workflow
export const agent = entrypoint({
  name: "agent",
  checkpointer: await createCheckpointer(),
}, async (messages: BaseMessage[]) => {
  // Get previous messages from state
  const previous = getPreviousState<BaseMessage[]>() ?? [];
  
  // Initialize tools
  const tools = initializeTools();
  const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

  // Define tasks
  const callModel = task("callModel", async (messages: BaseMessage[]) => {
    const response = await model.bindTools(tools).invoke([
      new SystemMessage(AGENT_PROMPT),
      ...messages
    ]);
    return response;
  });

  const callTool = task(
    "callTool",
    async (toolCall: ToolCall): Promise<ToolMessage> => {
      const tool = toolsByName[toolCall.name];
      if (!tool) {
        throw new Error(`Tool ${toolCall.name} not found`);
      }
      const observation = await tool.invoke(toolCall.args as { query: string });
      if (typeof observation !== 'string') {
        throw new Error('Tool returned non-string observation');
      }
      if (!toolCall.id) {
        throw new Error('Tool call ID is required');
      }
      return new ToolMessage({ 
        content: observation, 
        tool_call_id: toolCall.id 
      });
    }
  );

  // Combine previous messages with new ones
  let currentMessages = addMessages(previous, messages);
  let llmResponse = await callModel(currentMessages);

  while (true) {
    if (!llmResponse.tool_calls?.length) {
      break;
    }

    // Execute tools
    const toolResults = await Promise.all(
      llmResponse.tool_calls.map((toolCall) => callTool(toolCall))
    );

    // Append to message list
    currentMessages = addMessages(currentMessages, [llmResponse, ...toolResults]);

    // Call model again
    llmResponse = await callModel(currentMessages);
  }

  // Append final response for storage
  currentMessages = addMessages(currentMessages, llmResponse);

  // If we need human help
  if (llmResponse.content.toString().toLowerCase().includes("i am not sure") || 
      llmResponse.content.toString().toLowerCase().includes("i cannot find")) {
    const humanResponse = interrupt({
      query: "Please provide guidance on how to answer this question.",
      current_response: llmResponse.content,
    });

    return entrypoint.final({
      value: llmResponse,
      save: currentMessages
    });
  }

  return entrypoint.final({
    value: llmResponse,
    save: currentMessages
  });
});

import { agent } from "./memory_agent/graph.js";
import { Command } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

const prettyPrintMessage = (message: BaseMessage) => {
  console.log("=".repeat(30), `${message.getType()} message`, "=".repeat(30));
  console.log(message.content);
  if (message instanceof AIMessage && message.tool_calls?.length) {
    console.log(JSON.stringify(message.tool_calls, null, 2));
  }
};

async function main() {
  // Example questions
  const questions = [
    "What is our vacation policy?",
    "Can I work from home permanently?",
    "What happens if I need to take a sick day?",
    "What benefits do we have for new parents?",
    "What is our policy on cryptocurrency investments?", // This should trigger human assistance
  ];

  // Create a unique thread ID for this conversation
  const threadId = crypto.randomUUID();
  const config = {
    configurable: {
      thread_id: threadId,
    },
  };

  for (const question of questions) {
    console.log("\n=== New Question ===");
    console.log(`Question: ${question}`);

    try {
      // Start the workflow with thread configuration
      const stream = await agent.stream([new HumanMessage(question)], config);

      for await (const step of stream) {
        for (const [taskName, update] of Object.entries(step)) {
          // Skip the final agent output
          if (taskName === "hr_support") continue;

          const message = update as BaseMessage;
          console.log(`\n${taskName}:`);
          prettyPrintMessage(message);
        }

        // Handle interrupt for human assistance
        if ("__interrupt__" in step) {
          console.log("\nNeeds human assistance!");
          console.log(
            "Current AI Response:",
            step.__interrupt__[0].value.current_response,
          );
          console.log("Waiting for human guidance...");

          // In a real application, you would get the human response from a UI
          // For this demo, we'll simulate a human response
          const humanResponse =
            "Please refer the employee to their manager for guidance on this topic.";

          // Resume the workflow with the human response
          const resumeStream = await agent.stream(
            new Command({ resume: humanResponse }),
            config,
          );

          for await (const resumeStep of resumeStream) {
            if (resumeStep.hr_support) {
              console.log("\nFinal Response:");
              console.log("AI Response:", resumeStep.hr_support.ai_response);
              console.log(
                "Human Guidance:",
                resumeStep.hr_support.human_response,
              );
            }
          }
        }
        // Handle normal response
        else if (step.hr_support) {
          console.log("\nFinal Response:");
          console.log("AI Response:", step.hr_support.ai_response);
        }
      }
    } catch (error) {
      console.error("Error processing question:", error);
    }
  }
}

main().catch(console.error);

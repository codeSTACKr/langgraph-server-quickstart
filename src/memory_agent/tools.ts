import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { MongoClient } from "mongodb";
import { HELP_PHRASE } from "./prompts.js";

/**
 * Initialize tools within a function so that they have access to the current
 * state and config at runtime.
 */
export function initializeTools(config?: LangGraphRunnableConfig) {
  if (!config) {
    throw new Error("Config not provided");
  }

  // Initialize MongoDB client
  const client = new MongoClient(process.env.MONGODB_URI!);
  const db = client.db("hr_support");
  const collection = db.collection("hr_policies");

  // Initialize vector store
  const vectorStore = new MongoDBAtlasVectorSearch(
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    }),
    {
      collection,
      indexName: "vector_index",
      textKey: "content",
      embeddingKey: "vector_embedding",
    },
  );

  /**
   * Search HR policies using vector search
   */
  async function searchPolicies(opts: { query: string }): Promise<string> {
    const { query } = opts;

    const results = await vectorStore.similaritySearch(query, 2);

    if (!results.length) {
      return "No relevant policies found.";
    }

    return results
      .map((doc: Document) => {
        const metadata = doc.metadata;
        return `
        Policy: ${metadata.title}
        Category: ${metadata.category}
        Last Updated: ${metadata.lastUpdated}
        Requires Manager Approval: ${metadata.requiresManagerApproval}
        Content:
        ${doc.pageContent}
      `.trim();
      })
      .join("\n\n");
  }

  const searchPoliciesTools = tool(searchPolicies, {
    name: "searchPolicies",
    description:
      "Search HR policies using semantic search to find relevant information.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query to find relevant HR policies."),
    }),
  });

  /**
   * Request human assistance for questions that cannot be answered
   */
  async function humanAssistance(opts: { query: string }): Promise<string> {
    const { query } = opts;

    // This will be intercepted by the interrupt handler
    return `Be sure to include the following in your response: "${HELP_PHRASE} ${query}"`;
  }

  const humanAssistanceTool = tool(humanAssistance, {
    name: "humanAssistance",
    description:
      "Request human assistance when a question cannot be answered using available policies.",
    schema: z.object({
      query: z.string().describe("The question that needs human assistance."),
    }),
  });

  return [searchPoliciesTools, humanAssistanceTool];
}

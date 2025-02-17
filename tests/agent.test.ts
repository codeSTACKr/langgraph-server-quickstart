import { describe, it, expect } from "@jest/globals";
import { agent } from "../src/memory_agent/graph.js";

describe("Memory Graph", () => {
  it("should initialize and compile the graph", () => {
    expect(agent).toBeDefined();
    expect(agent.name).toBe("MemoryAgent");
  });

  // TODO: Add more test cases for individual nodes, routing logic, tool integration, and output validation
});

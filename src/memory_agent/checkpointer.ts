import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";

export async function createCheckpointer() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  return new MongoDBSaver({
    client,
    checkpointCollectionName: "checkpoints",
  });
}

import { MongoClient } from "mongodb";
import { hrPolicies } from "../data/hr_policies.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import dotenv from "dotenv";

dotenv.config();

async function createSearchIndex(db: any) {
  try {
    // Drop existing index if it exists
    try {
      await db.collection("hr_policies").dropIndex("vector_index");
    } catch (e) {
      // Index might not exist, ignore error
    }

    // Create Atlas Vector Search index
    await db.collection("hr_policies").createIndex(
      { "vector_embedding": 1 },
      {
        name: "vector_index",
        background: true
      }
    );

    // Create Atlas Vector Search index definition
    const indexDefinition = {
      mappings: {
        dynamic: true,
        fields: {
          vector_embedding: {
            dimensions: 1536,
            similarity: "cosine",
            type: "knnVector"
          }
        }
      }
    };

    // Create the vector search index using the Atlas Search API
    await db.command({
      createSearchIndexes: "hr_policies",
      indexes: [{
        name: "vector_search_index",
        definition: indexDefinition
      }]
    });

    console.log("Created Atlas Vector Search index");
  } catch (error) {
    console.error("Error creating vector search index:", error);
    throw error;
  }
}

async function generateEmbeddings(policies: typeof hrPolicies) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const documents = policies.map(
    (policy) =>
      new Document({
        pageContent: `${policy.title}\n${policy.content}`,
        metadata: {
          id: policy.id,
          title: policy.title,
          category: policy.category,
          lastUpdated: policy.lastUpdated,
          requiresManagerApproval: policy.requiresManagerApproval,
        },
      })
  );

  const vectors = await embeddings.embedDocuments(
    documents.map((doc) => doc.pageContent)
  );

  return documents.map((doc, i) => ({
    ...doc.metadata,
    content: doc.pageContent,
    vector_embedding: vectors[i],
  }));
}

async function seedDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI!);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db();
    
    // Create collections if they don't exist
    await db.createCollection("hr_policies");
    await db.createCollection("checkpoints");
    
    // Clear existing policies
    await db.collection("hr_policies").deleteMany({});
    
    // Generate embeddings and insert policies
    console.log("Generating embeddings for HR policies...");
    const policiesWithEmbeddings = await generateEmbeddings(hrPolicies);
    
    // Insert policies with embeddings
    const result = await db.collection("hr_policies").insertMany(policiesWithEmbeddings);
    console.log(`Inserted ${result.insertedCount} HR policies with embeddings`);

    // Create vector search index
    console.log("Creating vector search index...");
    await createSearchIndex(db);

    // Create TTL index for checkpoints (expire after 24 hours of inactivity)
    await db.collection("checkpoints").createIndex(
      { "ts": 1 },
      { expireAfterSeconds: 86400 }
    );
    console.log("Created TTL index for checkpoints");

  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("Database connection closed");
  }
}

// Run seeding
seedDatabase().catch(console.error); 
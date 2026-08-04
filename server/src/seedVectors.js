const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Module = require('./models/Module');
const Component = require('./models/Component');
const { generateEmbedding } = require('./utils/vectorize');

async function seedEmbeddings() {
  console.log('[Vector AI] Connecting to MongoDB Atlas...');
  await connectDB();

  try {
    // 1. Process all Components that don't have an embedding yet
    const components = await Component.find({ 
      $or: [{ embedding: { $size: 0 } }, { embedding: { $exists: false } }] 
    });
    console.log(`[Vector AI] Found ${components.length} components needing embeddings.`);

    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      // Combine all relevant text fields into one giant string for the AI to read
      const textToVectorize = `${comp.title} ${comp.description} ${comp.category} ${(comp.tags || []).join(' ')}`;
      
      console.log(`Processing Component ${i + 1}/${components.length}: ${comp.title}`);
      const vector = await generateEmbedding(textToVectorize);
      
      comp.embedding = vector;
      await comp.save();
    }

    // 2. Process all Modules that don't have an embedding yet
    const modules = await Module.find({ 
      $or: [{ embedding: { $size: 0 } }, { embedding: { $exists: false } }] 
    });
    console.log(`[Vector AI] Found ${modules.length} modules needing embeddings.`);

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      // Combine module fields
      const textToVectorize = `${mod.title} ${mod.description} ${mod.category} ${(mod.tags || []).join(' ')} ${(mod.technologies || []).join(' ')}`;
      
      console.log(`Processing Module ${i + 1}/${modules.length}: ${mod.title}`);
      const vector = await generateEmbedding(textToVectorize);
      
      mod.embedding = vector;
      await mod.save();
    }

    console.log('\n [Vector AI] All vectors generated and saved successfully to MongoDB Atlas!');
    process.exit(0);

  } catch (error) {
    console.error('[Vector AI] Critical error during vector generation:', error);
    process.exit(1);
  }
}

seedEmbeddings();
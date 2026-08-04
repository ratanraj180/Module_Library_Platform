const mongoose = require('mongoose');
const config = require('./config/env');

const User = require('./models/User');
const Component = require('./models/Component');
const mockComponents = require('./mockComponentsData');

async function seedComponents() {
  console.log('[seedComponents] Connecting to MongoDB...');
  try {
    await mongoose.connect(config.mongoUri);
    console.log('[seedComponents] MongoDB Connected successfully');

    // Get developer user to assign ownership
    const developer = await User.findOne({ role: 'developer' });
    if (!developer) {
      console.error('[seedComponents] Seeding Error: Default developer account not found.');
      console.error('Please run the general seeder first: "npm run seed" inside the server directory.');
      process.exit(1);
    }

    console.log('[seedComponents] Clearing existing components...');
    await Component.deleteMany({});
    console.log('[seedComponents] Collection cleared');

    console.log(`[seedComponents] Seeding ${mockComponents.length} components into database...`);
    for (const comp of mockComponents) {
      await Component.create({
        title: comp.title,
        description: comp.description,
        category: comp.category,
        tags: comp.tags,
        dependencies: comp.dependencies,
        installation: comp.installation,
        frontendCode: comp.frontendCode,
        backendCode: comp.backendCode,
        documentation: comp.documentation,
        usage: comp.usage,
        status: comp.status,
        currentVersion: comp.currentVersion,
        downloadCount: comp.downloadCount,
        owner: developer._id
      });
    }

    console.log('[seedComponents] Components seeded successfully.');
  } catch (err) {
    console.error('[seedComponents] Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[seedComponents] MongoDB disconnected');
  }
}

seedComponents();

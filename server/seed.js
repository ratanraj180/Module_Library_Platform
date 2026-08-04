require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Module = require('./src/models/Module');
const Review = require('./src/models/Review');
const Version = require('./src/models/Version');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');

    await Review.deleteMany({});
    await Version.deleteMany({});
    await Module.deleteMany({});
    await User.deleteMany({});

    console.log('Existing data cleared');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@modulelibrary.com',
        password: hashedPassword,
        role: 'admin',
      },
      {
        name: 'Maintainer User',
        email: 'maintainer@modulelibrary.com',
        password: hashedPassword,
        role: 'maintainer',
      },
      {
        name: 'Developer One',
        email: 'developer1@modulelibrary.com',
        password: hashedPassword,
        role: 'developer',
      },
      {
        name: 'Developer Two',
        email: 'developer2@modulelibrary.com',
        password: hashedPassword,
        role: 'developer',
      },
    ]);

    const admin = users[0];
    const maintainer = users[1];
    const developer1 = users[2];
    const developer2 = users[3];

    console.log('Users inserted');

    const modules = await Module.insertMany([
      {
        title: 'React Navbar',
        description: 'Reusable responsive navbar component.',
        category: 'Frontend',
        technology: 'React',
        tags: ['react', 'navbar', 'ui'],
        repositoryUrl: 'https://github.com/example/react-navbar',
        owner: developer1._id,
        status: 'approved',
        currentVersion: '1.1.0',
        downloadCount: 145,
        approvedBy: maintainer._id,
        approvedAt: new Date(),
      },

      {
        title: 'JWT Authentication Service',
        description: 'Authentication service using JWT.',
        category: 'Backend',
        technology: 'Node.js',
        tags: ['jwt', 'auth', 'express'],
        repositoryUrl: 'https://github.com/example/jwt-auth-service',
        owner: developer1._id,
        status: 'pending',
        currentVersion: '1.0.0',
        downloadCount: 0,
      },

      {
        title: 'MongoDB Utility Toolkit',
        description: 'Utility functions for MongoDB operations.',
        category: 'Database',
        technology: 'MongoDB',
        tags: ['mongodb', 'database', 'utility'],
        repositoryUrl: 'https://github.com/example/mongodb-toolkit',
        owner: developer2._id,
        status: 'approved',
        currentVersion: '2.0.0',
        downloadCount: 89,
        approvedBy: admin._id,
        approvedAt: new Date(),
      },

      {
        title: 'CI/CD Deployment Helper',
        description: 'Automates deployment workflows.',
        category: 'DevOps',
        technology: 'GitHub Actions',
        tags: ['devops', 'cicd', 'github-actions'],
        repositoryUrl: 'https://github.com/example/cicd-helper',
        owner: developer2._id,
        status: 'rejected',
        currentVersion: '1.0.0',
      },
    ]);

    console.log('Modules inserted');

    const navbarModule = modules[0];
    const authModule = modules[1];
    const mongoModule = modules[2];
    const cicdModule = modules[3];

    await Version.insertMany([
      {
        module: navbarModule._id,
        versionNumber: '1.0.0',
        changelog: 'Initial release',
        uploadedBy: developer1._id,
        repositoryUrl: navbarModule.repositoryUrl,
      },

      {
        module: navbarModule._id,
        versionNumber: '1.1.0',
        changelog: 'Added responsive mobile menu',
        uploadedBy: developer1._id,
        repositoryUrl: navbarModule.repositoryUrl,
      },

      {
        module: authModule._id,
        versionNumber: '1.0.0',
        changelog: 'Initial JWT authentication service',
        uploadedBy: developer1._id,
        repositoryUrl: authModule.repositoryUrl,
      },

      {
        module: mongoModule._id,
        versionNumber: '1.0.0',
        changelog: 'Database helper utilities',
        uploadedBy: developer2._id,
        repositoryUrl: mongoModule.repositoryUrl,
      },

      {
        module: mongoModule._id,
        versionNumber: '2.0.0',
        changelog: 'Added aggregation pipeline helpers',
        uploadedBy: developer2._id,
        repositoryUrl: mongoModule.repositoryUrl,
      },
    ]);

    console.log('Versions inserted');

    await Review.insertMany([
      {
        module: navbarModule._id,
        reviewer: maintainer._id,
        status: 'approved',
        comment: 'Good documentation and reusable component structure.',
      },

      {
        module: mongoModule._id,
        reviewer: admin._id,
        status: 'approved',
        comment: 'Utility package follows project standards.',
      },

      {
        module: cicdModule._id,
        reviewer: maintainer._id,
        status: 'rejected',
        comment: 'Insufficient documentation. Please add setup instructions.',
      },
    ]);

    console.log('Reviews inserted');

    console.log('\nSeed completed successfully 🚀');
    console.log('\nTest Accounts:');
    console.log('Admin      : admin@modulelibrary.com');
    console.log('Maintainer : maintainer@modulelibrary.com');
    console.log('Developer1 : developer1@modulelibrary.com');
    console.log('Developer2 : developer2@modulelibrary.com');
    console.log('Password   : password123');

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();

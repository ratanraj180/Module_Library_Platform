const mongoose = require('mongoose');
const User = require('./src/models/User');
const Module = require('./src/models/Module');
const Component = require('./src/models/Component');
const connectDB = require('./src/config/db');

async function checkDB() {
  require('dotenv').config();

  await connectDB();

  const comps = await Component.find({});
  const mods = await Module.find({});
  console.log('Total Components in DB:', comps.length);
  console.log('Approved Components:', comps.filter(c => c.status === 'approved').length);
  console.log('Total Modules in DB:', mods.length);
  console.log('Approved Modules:', mods.filter(m => m.status === 'approved').length);

  await mongoose.disconnect();
}

checkDB();

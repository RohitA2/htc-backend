const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const os = require('os');

// Get local IP address dynamically
const getLocalIP = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    for (const interfaceDetails of networkInterfaces[interfaceName]) {
      if (interfaceDetails.family === 'IPv4' && !interfaceDetails.internal) {
        return interfaceDetails.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
};

// Load environment configurations
const isProduction = process.env.NODE_ENV === 'production';
const localIP = getLocalIP();
const BASEURL = isProduction ? 'https://seekers-node.codemeg.com/' : `http://${localIP}:${process.env.PORT}/`;
const PORT = isProduction ? 3010 : process.env.PORT;

// Set environment variables dynamically
process.env.BASEURL = BASEURL;
process.env.PORT = PORT;

// Database connection configurations
const DB_NAME = isProduction ? process.env.PROD_DB_NAME : process.env.DB_NAME;
const DB_USER = isProduction ? process.env.PROD_DB_USER : process.env.DB_USER;
const DB_PASSWORD = isProduction ? process.env.PROD_DB_PASSWORD : process.env.DB_PASSWORD;
const DB_HOST = isProduction ? process.env.PROD_DB_HOST : process.env.DB_HOST;
const DB_DIALECT = 'postgres';

// Validate environment variables
['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'PORT'].forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`Missing environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Sequelize instance setup
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: DB_DIALECT,
  // logging: process.env.NODE_ENV === 'development', // Enable logging only in development
  logging: false,
  define: {
    freezeTableName: true,   // 🔥 VERY IMPORTANT
    timestamps: true
  }
});

// Authenticate database connection
const authenticateDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message, error.stack);
    process.exit(1);
  }
};

// Sync models
const syncModels = async () => {
  try {
    console.log('Synchronizing models...');
    await sequelize.sync({ alter: true });
    console.log('Models synchronized!');
  } catch (error) {
    console.error('Error syncing models:', error.message, error.stack);
  }
};

// Run seeders
const runAllSeeders = async () => {
  try {
    const seedersPath = path.resolve(__dirname, '../seeders');
    if (!fs.existsSync(seedersPath)) {
      console.error('Seeders folder does not exist:', seedersPath);
      return;
    }

    const seederFiles = fs.readdirSync(seedersPath).filter((file) => file.endsWith('.js'));

    for (const file of seederFiles) {
      const seeder = require(path.join(seedersPath, file));
      console.log(`Running seeder: ${file}`);
      await seeder.up(sequelize.getQueryInterface(), Sequelize);
    }

    console.log('All seeders executed successfully!');
  } catch (error) {
    console.error('Error running seeders:', error.message, error.stack);
  }
};

// Clear all data from all tables
const clearDatabase = async () => {
  try {
    console.log('Starting to clear all tables in the database...');
    if (DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;', { raw: true });
    }

    const tables = Object.keys(sequelize.models).map(
      (modelName) => sequelize.models[modelName].getTableName()
    );

    for (const table of tables) {
      try {
        console.log(`Truncating table: "${table}"...`);
        if (DB_DIALECT === 'postgres') {
          await sequelize.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`, { raw: true });
        } else if (DB_DIALECT === 'mysql') {
          await sequelize.query(`TRUNCATE TABLE \`${table}\`;`, { raw: true });
        }
        console.log(`Table "${table}" truncated successfully.`);
      } catch (error) {
        console.error(`Error truncating table "${table}":`, error.message);
      }
    }

    if (DB_DIALECT === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;', { raw: true });
    }

    console.log('All tables cleared successfully!');
  } catch (error) {
    console.error('Error while clearing tables:', error.message, error.stack);
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    await authenticateDatabase();
    // await syncModels();
    // Uncomment if needed:
    // await runAllSeeders();
    // await clearDatabase();

  } catch (error) {
    console.error('Error initializing database:', error.message, error.stack);
    process.exit(1);
  }
};

// Run initialization
initializeDatabase();

// Export Sequelize instance and models (with associations)
//const db = sequelize.models;
module.exports = { sequelize, db: sequelize.models };

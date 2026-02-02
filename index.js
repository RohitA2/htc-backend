const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const http = require('http');
const path = require('path');
const sequelize = require('./src/config/database');
const fs = require('fs');
const defineAssociations = require('./src/config/associations');
const setupRoutes = require('./src/routes');
const cors = require('cors');
const app = express();
const server = http.createServer(app);


app.use(cors( { origin: 'http://localhost:5173' } ));

// app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

dotenv.config();
defineAssociations();
setupRoutes(app);

// Basic Route
app.get('/', (req, res) => {
  res.send('Server is up and running!');
});


// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes will go here
// app.use('/api/users', require('./routes/userRoutes'));
// app.use('/api/posts', require('./routes/postRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});

module.exports = app;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { ensureSchema } = require('./db/connection');

const app = express();

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : false,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/search', require('./routes/search'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

async function start() {
  await ensureSchema().catch((error) => {
    console.warn('Schema initialization skipped:', error.message);
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = app;

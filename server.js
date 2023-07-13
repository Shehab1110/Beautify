const mongoose = require('mongoose');
const dotenv = require('dotenv');

const chalk = require('chalk');

dotenv.config({ path: './config.env' });

process.on('uncaughtException', (err) => {
  console.log(chalk.red('Uncaught Exception!'));
  console.log(chalk.red(err.name, err.message));
  process.exit(1);
});
require('./utils/cache');
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const port = process.env.PORT || 8000;
let server;

mongoose.set('strictQuery', false);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(chalk.green('DB connection successful!'));
    server = app.listen(port, () => {
      console.log(chalk.green(`App running on port ${port}...`));
    });
  })
  .catch((err) => console.log(chalk.red(err)));

process.on('unhandledRejection', (err) => {
  console.log(chalk.red('Unhandled Rejection!'));
  console.log(chalk.red(err.name, err.message));
  server.close(() => {
    process.exit(1);
  });
});

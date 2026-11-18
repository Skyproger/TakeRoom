import { buildApp } from './app.js';
import { loadConfig } from './config.js';

const config = loadConfig();
const app = await buildApp({ config, logger: true });
app.enableShutdownHooks(['SIGINT', 'SIGTERM']);

try {
  await app.listen(config.port, config.host);
} catch (error) {
  console.error(error);
  await app.close();
  process.exitCode = 1;
}

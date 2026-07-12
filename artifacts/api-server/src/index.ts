import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 8080;
const explicitPort = rawPort !== undefined;

if (rawPort && (Number.isNaN(port) || port <= 0)) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

function startServer(listenPort: number) {
  app.listen(listenPort, (err) => {
    if (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (!explicitPort && code === "EADDRINUSE") {
        logger.warn(
          { port: listenPort },
          "Default port is in use; starting API server on an ephemeral port instead.",
        );
        startServer(0);
        return;
      }

      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    const activePort = (app as any).address?.().port ?? listenPort;
    logger.info({ port: activePort }, "Server listening");
  });
}

startServer(port);

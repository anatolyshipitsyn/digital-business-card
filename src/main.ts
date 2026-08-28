import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

// PORT comes from the environment rather than a constant, so the same image answers wherever it is
// deployed; 3000 is the local default recorded in .env.example. `Number(…) || …` and not `??`,
// because an exported but empty PORT is a string, and `listen('')` binds a random free port —
// the process then looks healthy while nothing answers where it was expected.
const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Node terminates on SIGTERM either way; what this buys is the ordered teardown in between —
  // the HTTP server stops accepting, in-flight requests finish, and from M2 `onModuleDestroy`
  // closes the Prisma pool instead of the socket dying under it.
  //
  // It only fires where this process receives the signal, which is the runtime stage: its CMD is
  // exec-form, so node is PID 1 and Docker signals it directly. In the dev stage it does not fire
  // at all — node sits under `npm → sh → node --watch`, PID 1 is npm, and when npm exits on
  // SIGTERM the namespace collapses and this process is SIGKILLed. That costs nothing in
  // development and is not worth a signal-forwarding shim in the watch script; the deployed path
  // is the one that has to shut down cleanly, and it does.
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT) || DEFAULT_PORT);
}

void bootstrap();

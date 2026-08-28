import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { CommonConfigService } from './config/services/common-config.service';

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
  // PORT comes from the environment rather than a constant, so the same image answers wherever it
  // is deployed; 3000 is the local default, recorded in .env.example and applied in
  // src/config/namespaces/common.config.ts. Read through the config service rather than
  // process.env: by the time the application exists the value has been validated, so this is a
  // number, and the empty-string case the raw variable used to need guarding against has already
  // stopped the start.
  await app.listen(app.get(CommonConfigService).port);
}

void bootstrap();

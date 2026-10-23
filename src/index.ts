import { ApplicationController } from './controllers/ApplicationController';

async function bootstrap(): Promise<void> {
  const controller: ApplicationController = new ApplicationController();
  await controller.run();
}

bootstrap().catch((error: unknown): void => {
  console.error('Произошла непредвиденная ошибка:', error);
  process.exit(1);
});

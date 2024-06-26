import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origin: any[] = [/yusyp\.dev$/, /pages\.dev$/];
  if (process.env.NODE_ENV === 'local') {
    origin.push('http://localhost:3000');
  }
  app.enableCors({
    origin,
  });
  await app.listen(+process.env.PORT);
}
bootstrap();

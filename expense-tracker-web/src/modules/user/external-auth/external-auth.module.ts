import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExternalAuth } from './external-auth.entity';
import { ExternalAuthService } from './external-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalAuth])
  ],
  providers: [ExternalAuthService],
  controllers: [],
  exports: [ExternalAuthService]
})
export class ExternalAuthModule {}
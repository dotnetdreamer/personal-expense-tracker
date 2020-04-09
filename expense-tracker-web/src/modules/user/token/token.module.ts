import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessToken } from './token.entity';
import { TokenService } from './token.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessToken])
  ],
  providers: [TokenService],
  controllers: [],
  exports: [TokenService]
})
export class TokenModule {}
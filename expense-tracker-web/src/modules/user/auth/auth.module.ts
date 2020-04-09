import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { UserModule } from '../user.module';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { TokenModule } from '../token/token.module';
import { AppConstant } from 'src/modules/shared/app-constant';

@Module({
    imports: [
        UserModule, 
        TokenModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: AppConstant.DEFAULT_JWT_SECRET_KEY,
            signOptions: { expiresIn: AppConstant.DEFAULT_JWT_TOKEN_EXPIRATION },
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [AuthService]
})
export class AuthModule {}
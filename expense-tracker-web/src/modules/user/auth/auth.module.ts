import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { UserModule } from '../user.module';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AppConstant } from 'src/modules/shared/app-constant';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [
        UserModule, 
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: AppConstant.DEFAULT_JWT_SECRET_KEY,
            signOptions: { expiresIn: '60s' },
        }),
    ],
    providers: [AuthService, LocalStrategy, JwtStrategy],
    exports: [ AuthService ]
})
export class AuthModule {}
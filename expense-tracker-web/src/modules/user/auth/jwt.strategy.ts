import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AppConstant } from 'src/modules/shared/app-constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: AppConstant.DEFAULT_JWT_SECRET_KEY
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user.service';
import { TokenService } from '../token/token.service';
import { AppConstant } from 'src/modules/shared/app-constant';
import * as moment from 'moment';
import { User } from '../user.entity';
import { IRegistrationParams } from '../user.model';

@Injectable()
export class AuthService {
  constructor(
    private userSvc: UserService,
    private jwtService: JwtService, private tokenSvc: TokenService
  ) {}

  validateUser(email: string, password: string): Promise<any> {
    return  this.userSvc.validateUser({ email, password });
  }

  async register(model: IRegistrationParams) {
    const response = await this.userSvc.register(model);
    //do not return token info when user is registering through normal registration form
    if(response.data && model.externalAuth) {
      const data = await this.login(response.data);
      response.data = data;
    } else {
      response.data = true;
    }

    return response;
  }

  async login(user: User) {
    const payload = { username: user.email, sub: user.id };
    
    const token = this.jwtService.sign(payload
      , { expiresIn: AppConstant.DEFAULT_JWT_TOKEN_EXPIRATION });
    const refreshToken = this.jwtService.sign(payload
      , { expiresIn: AppConstant.DEFAULT_JWT_REFRESH_TOKEN_EXPIRATION });

    const atExpFormat = +AppConstant.DEFAULT_JWT_TOKEN_EXPIRATION.split('s')[0];
    const accessTokenExpiresOn = moment.utc().add(atExpFormat, 's').toISOString();

    const rtExpFormat = +AppConstant.DEFAULT_JWT_REFRESH_TOKEN_EXPIRATION.split('s')[0];
    const refreshTokenExpiresOn = moment.utc().add(rtExpFormat, 's').toISOString();

    //save
    await this.tokenSvc.save({
      id: undefined,
      accessToken: token,
      refreshToken: refreshToken,
      userId: user.id,
      accessTokenExpiresOn: <any>accessTokenExpiresOn,
      refreshTokenExpiresOn: <any>refreshTokenExpiresOn
    });
    
    return {
      access_token: token,
      ...user,
      id: undefined
    };
  }
}
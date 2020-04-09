import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { TokenService } from '../token/token.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {  
  constructor(private tokenSvc: TokenService)  {
    super();
  }
  
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info: Error) {
    const u = <{ userId, username }>user;
    //check for valid token
    // if(u) {
    //   let token;
    //   token = this.tokenSvc.findByUserId(u.userId);
    //   if(token && !token) {

    //   }
    // }
    // const aToken = this.tokenSvc.findByAccessToken();
    if (info?.name == 'TokenExpiredError') {
      // do stuff when token is expired
      
    }

    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
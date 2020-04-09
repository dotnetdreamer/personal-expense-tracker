import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserService } from '../user.service';

@Injectable()
export class AuthService {
  constructor(
    private userSvc: UserService,
    private jwtService: JwtService
  ) {}

  validateUser(email: string, password: string): Promise<any> {
    return  this.userSvc.validateUser({ email, password });
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      ...user,
      id: undefined
    };
  }
}
import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";

import { JwtAuthGuard } from "../user/auth/jwt-auth.guard";
import { ICurrentUser } from "../shared/shared.model";

@Controller('message')
export class SystemController {
  constructor() {}

  //#region Group


  //#endregion
}
import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query } from "@nestjs/common";

import { MlService } from "./ml.service";
import * as fs from 'fs';
import { AppConstant } from "../shared/app-constant";

@Controller('ml')
export class MlController {
  constructor(private mlSvc: MlService) {}

  // @UseInterceptors(ClassSerializerInterceptor)
  @Get('trainExpenseCategoryMl')
  async trainExpenseCategoryMl() {
    await this.mlSvc.trainExpenseCategoryMl();
    return fs.readFileSync(`${AppConstant.UPLOADED_PATH_ML_WITH_FILE_NAME}`, 'utf8');
  }
}
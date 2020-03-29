import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query } from "@nestjs/common";

import { MlService } from "./ml.service";

@Controller('ml')
export class MlController {
  constructor(private mlSvc: MlService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getExpenseDictionary')
  async getExpenseDictionary(@Query() params: { text }) {
    const prediction = await this.mlSvc.buildAndTrainExpenses(params.text);
    return prediction;
  }
}
import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query } from "@nestjs/common";

import { MlService } from "./ml.service";

@Controller('ml')
export class MlController {
  constructor(private mlSvc: MlService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('buildExpensesTrainingSet')
  async buildExpensesTrainingSet() {
    const trainingSet = await this.mlSvc.buildExpensesTrainingSet();
    return trainingSet;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('trainAndPredictExpenseCategory')
  async trainAndPredictExpenseCategory(@Query() params: { text }) {
    const prediction = await this.mlSvc.trainAndPredictExpenseCategory(params.text);
    return prediction;
  }
}
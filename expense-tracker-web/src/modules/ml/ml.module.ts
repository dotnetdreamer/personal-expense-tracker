import { Module, Global } from '@nestjs/common';

import { MlService } from './ml.service';
import { CategoryModule } from '../category/category.module';
import { ExpenseModule } from '../expense/expense.module';
import { MlController } from './ml.controller';

@Global()
@Module({
  imports: [ CategoryModule, ExpenseModule ],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SchedulerRegistry, Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';

import { SystemService } from './system.service';

@Injectable()
export class SchedularService {
  private readonly logger = new Logger(SchedularService.name);

  constructor(private scheduler: SchedulerRegistry
    , private systemSvc: SystemService) {
  }

  //#region  Jobs
  
  @Cron('* * * * * *', {
    name: 'notifications',
  })  
  async triggerNotifications() {
    const m = await this._getAllMessages();
    this.logger.debug(`Total items in Queue: ${m.length}`);
  }

  //#endregion

  private async _getAllMessages() {
    const messages = await this.systemSvc.findAllQueuedMessages();
    return messages;
  }
}

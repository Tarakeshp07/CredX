import { Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Action, Resource } from '../common/rbac/permissions';

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
export class ApplicationsController {
  constructor(private applications: ApplicationsService) {}

  @Get()
  @RequirePermission(Resource.APPLICATIONS, Action.VIEW)
  list(@CurrentUser('id') userId: number) {
    return this.applications.list(userId);
  }

  @Post(':jobId')
  @RequirePermission(Resource.APPLICATIONS, Action.CREATE)
  apply(@CurrentUser('id') userId: number, @Param('jobId', ParseIntPipe) jobId: number) {
    return this.applications.apply(userId, jobId);
  }

  @Delete(':jobId')
  @RequirePermission(Resource.APPLICATIONS, Action.DELETE)
  withdraw(@CurrentUser('id') userId: number, @Param('jobId', ParseIntPipe) jobId: number) {
    return this.applications.withdraw(userId, jobId);
  }
}

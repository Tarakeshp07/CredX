import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Action, Resource } from '../common/rbac/permissions';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Get()
  @RequirePermission(Resource.JOBS, Action.VIEW)
  list(@Query() query: QueryJobsDto) {
    return this.jobs.list(query);
  }

  @Get(':id')
  @RequirePermission(Resource.JOBS, Action.VIEW)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobs.findOne(id);
  }

  @Post()
  @RequirePermission(Resource.JOBS, Action.CREATE)
  create(@Body() dto: CreateJobDto, @CurrentUser('id') userId: number) {
    return this.jobs.create(dto, userId);
  }

  @Put(':id')
  @RequirePermission(Resource.JOBS, Action.UPDATE)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateJobDto) {
    return this.jobs.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission(Resource.JOBS, Action.DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.jobs.remove(id);
  }
}

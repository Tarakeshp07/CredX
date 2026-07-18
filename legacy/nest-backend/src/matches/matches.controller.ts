import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { QueryJobsDto } from '../jobs/dto/query-jobs.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Action, Resource } from '../common/rbac/permissions';

@ApiTags('Matches')
@ApiBearerAuth()
@Controller('matches')
export class MatchesController {
  constructor(private matches: MatchesService) {}

  @Get()
  @RequirePermission(Resource.MATCHES, Action.VIEW)
  getMatches(@CurrentUser('id') userId: number, @Query() query: QueryJobsDto) {
    return this.matches.getMatches(userId, query);
  }

  @Get(':jobId/score')
  @RequirePermission(Resource.MATCHES, Action.VIEW)
  scoreOne(
    @CurrentUser('id') userId: number,
    @Param('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.matches.scoreOne(userId, jobId);
  }
}

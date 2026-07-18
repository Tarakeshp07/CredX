import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Action, Resource } from '../common/rbac/permissions';

@ApiTags('Skills')
@ApiBearerAuth()
@Controller('skills')
export class SkillsController {
  constructor(private skills: SkillsService) {}

  @Get()
  @RequirePermission(Resource.SKILLS, Action.VIEW)
  list() {
    return this.skills.list();
  }
}

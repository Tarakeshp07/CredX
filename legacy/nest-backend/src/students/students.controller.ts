import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Action, Resource } from '../common/rbac/permissions';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class StudentsController {
  constructor(private students: StudentsService) {}

  @Get()
  @RequirePermission(Resource.PROFILE, Action.VIEW)
  getProfile(@CurrentUser('id') userId: number) {
    return this.students.getProfile(userId);
  }

  @Put()
  @RequirePermission(Resource.PROFILE, Action.UPDATE)
  updateProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return this.students.updateProfile(userId, dto);
  }
}

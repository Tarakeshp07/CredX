import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const toBool = ({ value }: { value: unknown }) =>
  value === true || value === 'true' || value === '1';

export class QueryJobsDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() roleType?: string;
  @IsOptional() @IsString() location?: string;

  @IsOptional() @IsIn(['ONSITE', 'REMOTE', 'HYBRID'])
  remoteMode?: string;

  @IsOptional() @IsIn(['FULL_TIME', 'INTERNSHIP', 'PART_TIME'])
  employmentType?: string;

  @IsOptional() @Transform(toBool) @IsBoolean() visaSponsorship?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pageSize?: number = 20;
}

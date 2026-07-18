import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateJobDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() roleType?: string;

  @IsOptional() @IsIn(['FULL_TIME', 'INTERNSHIP', 'PART_TIME'])
  employmentType?: string;

  @IsOptional() @IsString() location?: string;

  @IsOptional() @IsIn(['ONSITE', 'REMOTE', 'HYBRID'])
  remoteMode?: string;

  @IsOptional() @IsBoolean() visaSponsorship?: boolean;
  @IsOptional() @IsNumber() minGpa?: number;
  @IsOptional() @IsInt() @Min(0) minExperience?: number;

  // Required skills as free text; normalized to the taxonomy on save.
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}

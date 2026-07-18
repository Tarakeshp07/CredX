import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export const WORK_AUTH_VALUES = [
  'CITIZEN',
  'PERMANENT_RESIDENT',
  'NEEDS_SPONSORSHIP',
  'STUDENT_VISA',
  'UNKNOWN',
] as const;

export class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;

  @IsOptional() @IsNumber() @Min(0) @Max(10) gpa?: number;

  @IsOptional() @IsIn(WORK_AUTH_VALUES) workAuthStatus?: (typeof WORK_AUTH_VALUES)[number];

  @IsOptional() @IsInt() @Min(0) @Max(50) experienceYears?: number;

  @IsOptional() @IsString() desiredRole?: string;
  @IsOptional() @IsString() preferredLocation?: string;
  @IsOptional() @IsBoolean() openToRemote?: boolean;

  // Free-text skills; normalized against the taxonomy on save.
  @IsOptional() @IsArray() @IsString({ each: true }) skills?: string[];
}

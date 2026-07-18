import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  // STUDENT or RECRUITER; defaults to STUDENT if omitted.
  @IsOptional()
  @IsIn(['STUDENT', 'RECRUITER'])
  role?: 'STUDENT' | 'RECRUITER';
}

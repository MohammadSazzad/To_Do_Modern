import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class VerifyUserDto {
  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  otp: string;

  @IsOptional()
  @IsBoolean()
  verified: boolean;

  @IsOptional()
  verified_at: Date;

  @IsOptional()
  otpExpiry: Date;
}

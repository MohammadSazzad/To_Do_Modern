import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return value;
    if (typeof value === 'string' && value.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = value.split('-');
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(String(value));
  })
  dob?: Date;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  role?: string;
}

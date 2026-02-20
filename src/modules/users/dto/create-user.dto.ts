import { IsEmail, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsEmail()
  email: string;

  @Transform(({ value }) => {
    if (!value) return value;
    // Handle DD-MM-YYYY format
    if (typeof value === 'string' && value.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = value.split('-');
      return new Date(`${year}-${month}-${day}`);
    }
    return new Date(value);
  })
  @IsNotEmpty()
  dob: Date;

  @IsString()
  address: string;

  @IsString()
  password: string;
}

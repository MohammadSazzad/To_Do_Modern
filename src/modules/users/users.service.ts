import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/config/database.config';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.tempusers.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = await this.prisma.tempusers.create({
      data: {
        id: randomUUID(),
        first_name: createUserDto.first_name || '',
        last_name: createUserDto.last_name || '',
        email: createUserDto.email,
        dob: createUserDto.dob,
        address: createUserDto.address,
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}

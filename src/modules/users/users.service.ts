import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/config/database.config';
import { randomUUID } from 'crypto';
import { MailService } from 'src/common/mail/mail.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.users.findUnique({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const GenOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const newUser = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        first_name: createUserDto.first_name!,
        last_name: createUserDto.last_name!,
        email: createUserDto.email,
        phone: createUserDto.phone,
        dob: createUserDto.dob,
        address: createUserDto.address,
        verified: false,
        password: hashedPassword,
        otp: GenOtp,
        otpExpiry: new Date(Date.now() + 5 * 60 * 1000), // OTP expires in 5 minutes
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    await this.mailService.sendMail(createUserDto.email, GenOtp);
    const { password, otp, otpExpiry, ...userWithoutPassword } = newUser;
    return {
      message: 'Verification email sent successfully',
      user: userWithoutPassword,
    };
  }
}

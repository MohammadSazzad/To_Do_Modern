import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/config/database.config';
import { randomUUID } from 'crypto';
import { MailService } from 'src/common/mail/mail.service';
import { VerifyUserDto } from './dto/verify-user.dto';
import { AuthService } from 'src/modules/auth/auth.service';
import { UpdateUserDto } from './dto/update-user.dto';

type FindOneParams = {
  requesterId: string;
  requesterRole: string;
  queryUserId?: string;
};

type UpdateUserParams = {
  requesterId: string;
  requesterRole: string;
  queryUserId?: string;
  updateData: Partial<UpdateUserDto>;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
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
        role: 'USER',
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

  async verifyUser(verifyUserDto: VerifyUserDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: verifyUserDto.email },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.verified) {
      throw new BadRequestException('User is already verified');
    }
    if (user.otp !== verifyUserDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }
    if (user.otpExpiry && user.otpExpiry < new Date()) {
      throw new BadRequestException('OTP has expired');
    }

    const verifiedUser = await this.prisma.users.update({
      where: { email: verifyUserDto.email },
      data: {
        verified: true,
        verified_at: new Date(),
        otp: null,
        otpExpiry: null,
      },
    });

    const authResult = await this.authService.issueTokensForUser({
      id: verifiedUser.id,
      email: verifiedUser.email,
      first_name: verifiedUser.first_name,
      last_name: verifiedUser.last_name,
      role: verifiedUser.role,
    });

    return {
      message: 'User verified successfully',
      ...authResult,
    };
  }

  async findAllUsers() {
    const users = await this.prisma.users.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        dob: true,
        address: true,
        role: true,
        verified: true,
        verified_at: true,
        created_at: true,
        updated_at: true,
      },
    });
    return users;
  }

  async findOne({ requesterId, requesterRole, queryUserId }: FindOneParams) {
    const normalizedRole = requesterRole.toLowerCase();

    let targetUserId = requesterId;

    if (normalizedRole === 'admin') {
      if (!queryUserId) {
        throw new BadRequestException(
          'Query parameter id is required for admin',
        );
      }
      targetUserId = queryUserId;
    }

    if (normalizedRole !== 'admin' && normalizedRole !== 'user') {
      throw new BadRequestException('Invalid user role');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        dob: true,
        address: true,
        role: true,
        verified: true,
        verified_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.prisma.users.findUnique({
      where: { email },
    });
    const {
      password,
      otp,
      otpExpiry,
      refreshHash,
      ...userWithoutSensitiveInfo
    } = user || {};
    return userWithoutSensitiveInfo;
  }

  async updateUser({
    requesterId,
    requesterRole,
    queryUserId,
    updateData,
  }: UpdateUserParams) {
    const normalizedRole = requesterRole.toLowerCase();

    if (normalizedRole !== 'admin' && normalizedRole !== 'user') {
      throw new BadRequestException('Invalid user role');
    }

    if (normalizedRole !== 'admin' && updateData.role !== undefined) {
      throw new ForbiddenException('Only admin can update role');
    }

    if (normalizedRole === 'admin') {
      if (!queryUserId) {
        throw new BadRequestException(
          'Query parameter id is required for admin',
        );
      }
    }

    if (
      normalizedRole !== 'admin' &&
      queryUserId !== undefined &&
      queryUserId !== requesterId
    ) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const targetUserId =
      normalizedRole === 'admin' ? queryUserId! : requesterId;

    const user = await this.prisma.users.findUnique({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: targetUserId },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    const {
      password,
      otp,
      otpExpiry,
      refreshHash,
      ...userWithoutSensitiveInfo
    } = updatedUser;

    return userWithoutSensitiveInfo;
  }

  async deleteUser(key: string) {
    const normalizedKey = key.trim();

    if (!normalizedKey) {
      throw new BadRequestException('Key is required');
    }

    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        normalizedKey,
      );
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedKey);

    let user: { id: string } | null = null;

    if (isUuid) {
      user = await this.prisma.users.findUnique({
        where: { id: normalizedKey },
      });
    }

    if (!user && isEmail) {
      user = await this.prisma.users.findUnique({
        where: { email: normalizedKey },
      });
    }

    if (!user) {
      user = await this.prisma.users.findUnique({
        where: { phone: normalizedKey },
      });
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return await this.prisma.users.delete({
      where: {
        id: user.id,
      },
    });
  }
}

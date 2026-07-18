import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ADMIN, RECRUITER, STUDENT, ROLE_NAMES } from '../common/rbac/roles';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private sign(user: { id: number; email: string; roleId: number }) {
    const token = this.jwt.sign({ sub: user.id, email: user.email, roleId: user.roleId });
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        role: ROLE_NAMES[user.roleId],
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const roleId = dto.role === 'RECRUITER' ? RECRUITER : STUDENT;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: await bcrypt.hash(dto.password, 10),
        firstName: dto.firstName ?? '',
        lastName: dto.lastName ?? '',
        roleId,
      },
      select: { id: true, email: true, roleId: true },
    });
    return this.sign(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.sign(user);
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roleId: true,
        profileCompleted: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    return { ...user, role: ROLE_NAMES[user.roleId] };
  }
}

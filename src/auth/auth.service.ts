import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CategoriesService } from '../categories/categories.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(
      registerDto.email,
      registerDto.name,
      registerDto.password,
    );

    await this.categoriesService.createDefaultCategories(user.id);

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      access_token,
    };
  }

  async validateUser(userId: string) {
    return await this.usersService.findById(userId);
  }
}

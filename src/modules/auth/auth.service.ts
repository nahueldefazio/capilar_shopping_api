import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  login(dto: LoginDto): { access_token: string } {
    const validUsername = process.env.ADMIN_USERNAME ?? 'admin';
    const validPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

    if (dto.username !== validUsername || dto.password !== validPassword) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const token = this.jwtService.sign({ username: dto.username, role: 'admin' });
    return { access_token: token };
  }

  verifyToken(token: string): boolean {
    try {
      this.jwtService.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}

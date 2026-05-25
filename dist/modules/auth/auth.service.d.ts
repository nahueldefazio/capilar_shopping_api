import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private jwtService;
    constructor(jwtService: JwtService);
    login(dto: LoginDto): {
        access_token: string;
    };
    verifyToken(token: string): boolean;
}

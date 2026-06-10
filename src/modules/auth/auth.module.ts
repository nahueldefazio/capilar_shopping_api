import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: (() => {
          if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET es obligatorio en produccion');
          }
          return process.env.JWT_SECRET ?? 'capilar_secret_key';
        })(),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard, JwtModule],
})
export class AuthModule {}

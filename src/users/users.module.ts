import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { UsersMongooseDao } from './dao/users.mongoose.dao';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UsersController, AuthController],
  providers: [
    UsersService,
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    RolesGuard,
    {
      provide: 'IUsersDao',
      useClass: UsersMongooseDao,
    },
    {
      provide: 'IUsersRepository',
      useClass: UsersRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}

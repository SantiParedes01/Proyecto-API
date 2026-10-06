import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../schemas/user.schema';
import type { IUsersRepository } from '../repositories/users.repository';
import { UserResponseDto } from '../dto/user-response.dto';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.create(createUserDto);
      return plainToClass(UserResponseDto, user.toObject());
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException('Email already exists');
      }

      throw new InternalServerErrorException('Could not create user');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToClass(UserResponseDto, user.toObject());
  }

  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map((user) => plainToClass(UserResponseDto, user.toObject()));
  }

  async update(
    id: string,
    updateData: Partial<User>,
  ): Promise<UserResponseDto> {
    const user = await this.usersRepository.update(id, updateData);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return plainToClass(UserResponseDto, user.toObject());
  }

  async delete(id: string): Promise<boolean> {
    return this.usersRepository.delete(id);
  }
}

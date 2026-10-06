import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
    userId: string,
  ) {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      userId,
    });

    return notification.save();
  }

  async findAllByUser(userId: string) {
    return this.notificationModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string) {
    const notification = await this.notificationModel
      .findOne({ _id: id, userId })
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(
    id: string,
    userId: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: id, userId },
        updateNotificationDto,
        { new: true },
      )
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationModel
      .findOneAndDelete({ _id: id, userId })
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      message: 'Notification deleted successfully',
    };
  }
}
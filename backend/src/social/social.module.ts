/**
 * Social Module
 * NestJS module for social features (posts, comments, likes, follows)
 */

import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { CommentsController } from './comments.controller';
import { FollowsController } from './follows.controller';
import { SocialService } from './social.service';
import { PostsService } from './posts.service';
import { CommentsService } from './comments.service';
import { FollowsService } from './follows.service';
import { DatabaseModule } from '../database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [DatabaseModule, AnalyticsModule],
  controllers: [PostsController, CommentsController, FollowsController],
  providers: [SocialService, PostsService, CommentsService, FollowsService],
  exports: [SocialService, PostsService, CommentsService, FollowsService],
})
export class SocialModule {}

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const dbHealth = await this.databaseService.healthCheck();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbHealth,
      version: '1.0.0',
    };
  }

  @Get('api/cigars')
  async getCigars() {
    return this.databaseService.findMany('cigars', {
      limit: 10,
      select: 'id, name, brand, strength, description',
    });
  }

  @Get('api/beers')
  async getBeers() {
    return this.databaseService.findMany('beers', {
      limit: 10,
      select: 'id, name, brewery, style, description',
    });
  }

  @Get('api/wines')
  async getWines() {
    return this.databaseService.findMany('wines', {
      limit: 10,
      select: 'id, name, winery, wine_type, description',
    });
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  CreateCollectionItemDto,
  UpdateCollectionItemDto,
} from './dto';
import { CollectionFilters, CollectionItemFilters } from '../types/database.types';

@ApiTags('collections')
@Controller('collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  // =============================================
  // COLLECTIONS ENDPOINTS
  // =============================================

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  createCollection(@Request() req, @Body() createDto: CreateCollectionDto) {
    return this.collectionsService.createCollection(req.user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user collections' })
  @ApiResponse({ status: 200, description: 'Collections retrieved successfully' })
  findAllCollections(@Request() req, @Query() query: any) {
    const filters: CollectionFilters = {
      type: query.type,
      is_public: query.is_public === 'true',
      search: query.search,
    };
    return this.collectionsService.findAllCollections(req.user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection by ID' })
  @ApiResponse({ status: 200, description: 'Collection retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  findCollection(@Request() req, @Param('id') id: string) {
    return this.collectionsService.findCollectionById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collection' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  updateCollection(
    @Request() req,
    @Param('id') id: string,
    @Body() updateDto: UpdateCollectionDto
  ) {
    return this.collectionsService.updateCollection(id, req.user.id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete collection' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  deleteCollection(@Request() req, @Param('id') id: string) {
    return this.collectionsService.deleteCollection(id, req.user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get collection statistics' })
  @ApiResponse({ status: 200, description: 'Collection stats retrieved successfully' })
  getCollectionStats(@Request() req, @Param('id') id: string) {
    return this.collectionsService.getCollectionStats(id, req.user.id);
  }

  // =============================================
  // COLLECTION ITEMS ENDPOINTS
  // =============================================

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to collection' })
  @ApiResponse({ status: 201, description: 'Item added to collection successfully' })
  createCollectionItem(
    @Request() req,
    @Param('id') collectionId: string,
    @Body() createDto: CreateCollectionItemDto
  ) {
    // Ensure collection_id matches the URL parameter
    const itemDto = { ...createDto, collection_id: collectionId };
    return this.collectionsService.createCollectionItem(req.user.id, itemDto);
  }

  @Get(':id/items')
  @ApiOperation({ summary: 'Get collection items' })
  @ApiResponse({ status: 200, description: 'Collection items retrieved successfully' })
  findCollectionItems(
    @Request() req,
    @Param('id') collectionId: string,
    @Query() query: any
  ) {
    const filters: CollectionItemFilters = {
      type: query.type,
      is_favorite: query.is_favorite === 'true',
      is_wishlist: query.is_wishlist === 'true',
      rating: query.rating ? parseInt(query.rating) : undefined,
      search: query.search,
      tags: query.tags ? query.tags.split(',') : undefined,
    };
    return this.collectionsService.findCollectionItems(collectionId, req.user.id, filters);
  }

  @Get(':collectionId/items/:itemId')
  @ApiOperation({ summary: 'Get collection item by ID' })
  @ApiResponse({ status: 200, description: 'Collection item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Collection item not found' })
  findCollectionItem(@Request() req, @Param('itemId') itemId: string) {
    return this.collectionsService.findCollectionItemById(itemId, req.user.id);
  }

  @Patch(':collectionId/items/:itemId')
  @ApiOperation({ summary: 'Update collection item' })
  @ApiResponse({ status: 200, description: 'Collection item updated successfully' })
  @ApiResponse({ status: 404, description: 'Collection item not found' })
  updateCollectionItem(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCollectionItemDto
  ) {
    return this.collectionsService.updateCollectionItem(itemId, req.user.id, updateDto);
  }

  @Delete(':collectionId/items/:itemId')
  @ApiOperation({ summary: 'Remove item from collection' })
  @ApiResponse({ status: 200, description: 'Collection item removed successfully' })
  @ApiResponse({ status: 404, description: 'Collection item not found' })
  deleteCollectionItem(@Request() req, @Param('itemId') itemId: string) {
    return this.collectionsService.deleteCollectionItem(itemId, req.user.id);
  }
}

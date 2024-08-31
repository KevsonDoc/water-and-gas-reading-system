import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { MonitorService } from './monitor.service';
import { ListMonitorDto } from './dto/list-monitor.dto';
import { Request, Response } from 'express';

@ApiTags('Monitor')
@Controller()
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Post('/upload')
  public async create(
    @Req() request: Request,
    @Body() createMonitorDto: CreateMonitorDto,
  ) {
    return this.monitorService.create(createMonitorDto, request.get('host'));
  }

  @Get(':customer_code/list')
  public async findAll(
    @Req() request: Request,
    @Param('customer_code') customerCode: string,
    @Query() query: ListMonitorDto,
  ) {
    return this.monitorService.findAll(
      customerCode,
      query,
      request.get('host'),
    );
  }

  @Patch('/confirm')
  public async update(@Body() updateMonitorDto: UpdateMonitorDto) {
    await this.monitorService.update(updateMonitorDto);

    return {
      success: true,
    };
  }

  @Get('/public/:path')
  public async getImage(
    @Res() response: Response,
    @Param('path') pathImage: string,
  ) {
    const path = this.monitorService.getImage(pathImage);

    return response.sendFile(path);
  }

  @Get('temporary-image/:id')
  public async temporaryImage(
    @Res() response: Response,
    @Param('id') id: string,
  ) {
    const path = await this.monitorService.getTemporaryImage(id);
    return response.sendFile(path);
  }
}

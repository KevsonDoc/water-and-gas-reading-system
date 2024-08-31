import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum MeasureType {
  'WATER',
  'GAS',
}

export class ListMonitorDto {
  @ApiProperty({ required: false, enum: ['WATER', 'GAS'] })
  @IsOptional()
  @IsEnum(MeasureType, { message: 'Tipo de medição não permitida' })
  public measure_type?: 'WATER' | 'GAS';
}

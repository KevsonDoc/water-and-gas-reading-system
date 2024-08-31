import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpdateMonitorDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public measure_uuid: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  public confirmed_value: number;
}

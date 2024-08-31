import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBase64,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

enum MeasureTypeEnum {
  WATER,
  GAS,
}

export class CreateMonitorDto {
  @ApiProperty()
  @IsBase64({}, {})
  @IsNotEmpty()
  @Transform((params) => params.value.replace(/^data:image\/\w+;base64,/, ''))
  public image: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  public customer_code: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  public measure_datetime: Date;

  @ApiProperty({ enum: ['WATER', 'GAS'] })
  @IsNotEmpty()
  @IsEnum(MeasureTypeEnum)
  public measure_type: 'WATER' | 'GAS';
}

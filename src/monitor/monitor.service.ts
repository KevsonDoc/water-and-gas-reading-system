import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { addHours } from 'date-fns';
import { PrismaService } from 'src/database/prisma.service';
import * as uuid from 'uuid';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { ListMonitorDto } from './dto/list-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import * as fileSystem from 'fs';
import * as path from 'path';
import { ModelAI } from './model-ai';

@Injectable()
export class MonitorService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly modelAI: ModelAI,
  ) {}

  private saveImage(path: string, image: Buffer): void {
    fileSystem.writeFileSync(path, image);
  }

  public async create(createMonitorDto: CreateMonitorDto, host: string) {
    const measureDatetime = {
      start: new Date(
        createMonitorDto.measure_datetime.getFullYear(),
        createMonitorDto.measure_datetime.getMonth(),
        1,
      ),
      end: new Date(
        createMonitorDto.measure_datetime.getFullYear(),
        createMonitorDto.measure_datetime.getMonth() + 1,
        0,
      ),
    };

    const readingOfTheMonth = await this.prismaService.monitor.findFirst({
      where: {
        customer_code: createMonitorDto.customer_code,
        measure_datetime: {
          gte: measureDatetime.start,
          lte: measureDatetime.end,
        },
        measure_type: createMonitorDto.measure_type,
      },
    });

    if (readingOfTheMonth) {
      throw new HttpException(
        {
          error_code: 'DOUBLE_REPORT',
          error_description: 'Leitura do mês já realizada',
        },
        HttpStatus.FORBIDDEN,
      );
    }

    try {
      const imagePath = path.join(`image-${uuid.v4()}.png`);

      if (!fileSystem.existsSync(path.join(process.cwd(), 'uploads'))) {
        fileSystem.mkdirSync(path.join(process.cwd(), 'uploads'), {
          recursive: true,
        });
      }

      const imageBase64 = createMonitorDto.image.replace(
        /^data:image\/\w+;base64,/,
        '',
      );

      this.saveImage(
        path.join(process.cwd(), 'uploads', imagePath),
        Buffer.from(imageBase64, 'base64'),
      );

      const { value } = await this.modelAI.extractValuesFromImage(
        imageBase64,
        createMonitorDto.measure_type,
      );

      const monitor = await this.prismaService.monitor.create({
        include: {
          image_link: true,
        },
        data: {
          id: uuid.v4(),
          customer_code: createMonitorDto.customer_code,
          image: imagePath,
          has_confirmed: false,
          value: value ?? 0,
          measure_datetime: createMonitorDto.measure_datetime,
          measure_type: createMonitorDto.measure_type,
          image_link: {
            create: {
              id: uuid.v4(),
              expiresIn: addHours(new Date(), 1),
            },
          },
        },
      });

      return {
        image_url: `http://${host}/temporary-image/${monitor.image_link[0].id}`,
        measure_value: monitor.value,
        measure_uuid: monitor.id,
      };
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Erro interno no servidor',
      });
    }
  }

  public async findAll(
    customerCode: string,
    query: ListMonitorDto,
    host: string,
  ) {
    const monitor = await this.prismaService.monitor.findMany({
      select: {
        id: true,
        measure_datetime: true,
        measure_type: true,
        has_confirmed: true,
        image: true,
      },
      where: {
        customer_code: customerCode,
        measure_type: query.measure_type ? query.measure_type : undefined,
      },
    });

    if (monitor.length === 0) {
      throw new NotFoundException({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      });
    }

    return {
      customer_code: customerCode,
      measures: monitor.map((monitorItem) => ({
        measure_uuid: monitorItem.id,
        measure_datetime: monitorItem.measure_datetime,
        measure_type: monitorItem.measure_type,
        has_confirmed: monitorItem.has_confirmed,
        image_url: `http://${host}/public/${monitorItem.image}`,
      })),
    };
  }

  public async update(updateMonitorDto: UpdateMonitorDto) {
    const monitor = await this.prismaService.monitor.findFirst({
      where: {
        id: updateMonitorDto.measure_uuid,
      },
    });

    if (!monitor) {
      throw new NotFoundException({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada',
      });
    }

    if (monitor.has_confirmed) {
      throw new ConflictException({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura do mês já realizada',
      });
    }

    try {
      await this.prismaService.monitor.update({
        where: { id: updateMonitorDto.measure_uuid },
        data: {
          has_confirmed: true,
          value: updateMonitorDto.confirmed_value,
        },
      });
    } catch (error) {
      Logger.error(error);
      throw new InternalServerErrorException({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Erro interno no servidor',
      });
    }
  }

  public getImage(imagePath: string): string {
    const image = `${process.cwd()}/uploads/${imagePath}`;

    if (!fileSystem.existsSync(image)) {
      throw new NotFoundException({
        error_code: 'IMAGE_LINKIN_EXPIRED',
        error_description: 'Imagem da leitura não existe',
      });
    }

    return image;
  }

  public async getTemporaryImage(id: string): Promise<string> {
    const imageLink = await this.prismaService.image_link.findFirst({
      where: {
        id: id,
        expiresIn: {
          gte: new Date(),
        },
      },
      orderBy: {
        expiresIn: 'desc',
      },
      include: {
        monitor: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    });

    if (!imageLink) {
      throw new NotFoundException({
        error_code: 'IMAGE_LINKIN_EXPIRED',
        error_description: 'Link de imagem expirada',
      });
    }

    return `${process.cwd()}/uploads/${imageLink.monitor.image}`;
  }
}

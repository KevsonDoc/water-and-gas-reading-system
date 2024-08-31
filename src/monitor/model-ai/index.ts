import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ModelAI {
  private readonly waterPropt =
    'Convert the primary water meter value to JSON format with a single integer key called value. Returns just the JSON in the response without explanations or comments from Gemini.';
  private readonly gasPropt =
    'Convert the primary value of the JSON -shaped gas meter with a single integer key called value. Returns only JSON in the answer without explanations or comments from Gemini.';

  constructor(private readonly configService: ConfigService) {}

  public async extractValuesFromImage(
    imageAsBase64: string,
    typePropt: 'WATER' | 'GAS',
  ): Promise<{ value: number }> {
    const genAI = new GoogleGenerativeAI(
      this.configService.get('GEMINI_API_KEY'),
    );
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    try {
      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'image/png',
            data: imageAsBase64,
          },
        },
        {
          text: typePropt === 'WATER' ? this.waterPropt : this.gasPropt,
        },
      ]);
      const data = JSON.parse(result.response.text());

      return {
        value: data.value,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return {
          value: 0,
        };
      }

      Logger.error(error);
      throw new InternalServerErrorException('error');
    }
  }
}

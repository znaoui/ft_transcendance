import { IsNumberString } from 'class-validator';

export class IdParam {
  @IsNumberString()
  id: number;
}

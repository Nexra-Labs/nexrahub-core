import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTournamentDto {
    @IsString()
    @ApiProperty({
        example: 'Battle of Nexra',
        description: 'Tournament name'
    })
    name: string;

    @IsString()
    @ApiPropertyOptional({
        example: 'An intense tournament for top gamers',
        description: 'Tournament description'
    })
    @IsOptional()
    description: string;

    @IsNumber()
    @Min(0)
    @ApiPropertyOptional({
        example: 50,
        description: 'Gamers entry fee for the tournament'
    })
    @IsOptional()
    entryFee: number;

    @IsDateString()
    @ApiPropertyOptional({
        example: '2025-11-10T18:00:00Z',
        description: 'Tournament start time'
    })
    @IsOptional()
    startTime: Date;

    @IsDateString()
    @ApiPropertyOptional({
        example: '2025-11-10T21:00:00Z',
        description: 'Tournament end time'
    })
    @IsOptional()
    endTime: Date;
}

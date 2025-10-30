import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PredictionRepository } from '../repositories/prediction.repository';
import { IPrediction } from '../interfaces/prediction.interface';
import { Types } from 'mongoose';
import { PredictionOptionService } from './prediction-option.service';
import { CreatePredictionDto } from '../dtos/create-prediction.dto';
import { TournamentService } from 'src/tournament/providers/tournament.service';
import { TournamentStatus } from 'src/tournament/enums/tournament-status.enum';
import { ITournament } from 'src/tournament/interfaces/tournament.interface';

@Injectable()
export class PredictionService {
    constructor(
        private readonly predictionRepo: PredictionRepository,
        private readonly predictionOptionService: PredictionOptionService,
        private readonly tournamentService: TournamentService
    ) { }

    async createPrediction(userId: string | Types.ObjectId, dto: CreatePredictionDto): Promise<IPrediction> {
        const { predictionOption, amount } = dto;

        const optionDoc = await this.predictionOptionService.findById(predictionOption, 'odds totalPredictionAmount', {}, ['tournament']);
        if (!optionDoc) throw new NotFoundException('Prediction option not found');
        if((optionDoc.tournament as any as ITournament).status !== TournamentStatus.PUBLISHED) throw new BadRequestException('Cannot place prediction, tournament is not active for predictions.');

        const [prediction] = await Promise.all([
            this.predictionRepo.create({
                bettor: userId,
                predictionOption,
                amount,
                oddsAtPlacement: optionDoc.odds
            }),
            this.predictionOptionService.incrementTotalAmount(predictionOption, amount),
            this.tournamentService.incrementTotalPredictionAmount(optionDoc.tournament._id.toString(), amount)
        ]);

        return await this.predictionRepo.findById(prediction._id, "-updatedAt", {}, [{ path: 'predictionOption', select: '-createdAt -updatedAt', populate: [{ path: 'tournament', select: 'name description totalPredictionAmount' }, { path: 'gamer', select: 'gamerId' }] }]);
    }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TournamentRepository } from '../repositories/tournament.repository';
import { ITournament } from '../interfaces/tournament.interface';
import { TournamentStatus } from '../enums/tournament-status.enum';
import { CreateTournamentDto } from '../dtos/create-tournament.dto';
import { UpdateTournamentDto } from '../dtos/update-tournament.dto';
import { GameService } from 'src/game/providers/game.service';
import { PopulateOptions, ProjectionType, QueryOptions, Types } from 'mongoose';

@Injectable()
export class TournamentService {
    constructor(
        private readonly tournamentRepo: TournamentRepository,
        private readonly gameService: GameService
    ) { }

    async createTournament(gameId: string, dto: CreateTournamentDto): Promise<ITournament> {
        if (dto.startTime >= dto.endTime) {
            throw new BadRequestException('Start time must be before end time');
        }
        const game = await this.gameService.findById(gameId);
        if (!game) {
            throw new NotFoundException('Game not found for the tournament');
        }
        const tournament = await this.tournamentRepo.create(dto);
        return await this.tournamentRepo.findById(tournament._id, "", {}, { path: 'game', select: 'name' });
    }

    async updateTournament(gameId: string, id: string, dto: UpdateTournamentDto): Promise<ITournament> {
        const game = await this.gameService.findById(gameId);
        if (!game) {
            throw new NotFoundException('Game not found for the tournament');
        }

        const tournament = await this.tournamentRepo.findById(id);
        if (!tournament) throw new NotFoundException('Tournament not found');

        if (tournament.status !== TournamentStatus.PENDING) {
            throw new BadRequestException('Only pending tournaments can be updated');
        }

        if (new Date(tournament.startTime) <= new Date()) {
            throw new BadRequestException('Cannot update a tournament that has already started');
        }

        if (dto.startTime && dto.endTime && dto.startTime >= dto.endTime) {
            throw new BadRequestException('Start time must be before end time');
        }

        return await this.tournamentRepo.updateById(tournament._id, dto, { new: true, populate: { path: 'game', select: 'name' } });
    }

    async publishTournament(gameId: string, id: string): Promise<ITournament> {
        const game = await this.gameService.findById(gameId);
        if (!game) {
            throw new NotFoundException('Game not found for the tournament');
        }

        const tournament = await this.tournamentRepo.findById(id);
        if (!tournament) throw new NotFoundException('Tournament not found');

        if (tournament.status !== TournamentStatus.PENDING) {
            throw new BadRequestException('Only pending tournaments can be published');
        }

        if (new Date(tournament.startTime) <= new Date()) {
            throw new BadRequestException('Cannot publish a tournament that has already started');
        }

        return await this.tournamentRepo.updateById(tournament._id, { status: TournamentStatus.PUBLISHED }, { new: true, populate: { path: 'game', select: 'name' } });
    }

    async findById(
        id: string | Types.ObjectId,
        projection?: ProjectionType<ITournament>,
        options?: QueryOptions<ITournament>,
        populate?: PopulateOptions | (string | PopulateOptions)[]
    ): Promise<ITournament> {
        return await this.tournamentRepo.findById(id, projection, options, populate);
    }

    async increamentPrizePool(id: string | Types.ObjectId, increament: number): Promise<ITournament> {
        return await this.tournamentRepo.updateById(id, { $inc: { prizePool: increament } }, { new: true });
    }

    async incrementTotalPredictionAmount(id: string | Types.ObjectId, increment: number): Promise<ITournament> {
        return await this.tournamentRepo.updateById(id, { $inc: { totalPredictionAmount: increment } }, { new: true });
    }
}

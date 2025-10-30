import {
    Injectable,
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';
import { GameRepository } from '../repositories/game.repository';
import { CreateGameDto } from '../dtos/create-game.dto';
import { UpdateGameDto } from '../dtos/update-game.dto';
import { FilterQuery, PopulateOptions, ProjectionType, QueryOptions, Types } from 'mongoose';
import { OtpService } from 'src/otp/providers/otp.service';
import { randomBytes } from 'crypto';
import { GameGenreService } from './game-genre.service';
import { IGame } from '../interfaces/game.interface';

@Injectable()
export class GameService {
    constructor(
        private readonly gameRepo: GameRepository,
        private readonly otpService: OtpService,
        private readonly gameGenreService: GameGenreService
    ) { }

    async createGame(dto: CreateGameDto, developer: string | Types.ObjectId) {
        const exists = await this.gameRepo.findOne({ name: dto.name });
        if (exists) throw new BadRequestException('Game with this name already exists');

        if (dto.genre && dto.genre.length > 0) {
            const validGenres = await this.gameGenreService.validateGenres(dto.genre);
            dto.genre = validGenres;
        }

        const game = await this.gameRepo.create({
            ...dto,
            developer
        });

        return this.gameRepo.findById(game._id, "-developer -updatedAt +apiKey", { populate: { path: 'genre', select: 'genre' } });
    }

    async updateGame(gameId: string | Types.ObjectId, dto: UpdateGameDto, userId: string | Types.ObjectId) {
        const game = await this.gameRepo.findById(gameId);
        if (!game) throw new NotFoundException('Game not found');

        if (game.developer.toString() !== userId.toString()) throw new ForbiddenException('Not your game');

        if (dto.genre && dto.genre.length > 0) {
            const validGenres = await this.gameGenreService.validateGenres(dto.genre);
            dto.genre = validGenres;
        }

        return await this.gameRepo.updateById(gameId, dto, { new: true, populate: { path: 'genre', select: 'genre' }, fields: "-developer -updatedAt" });
    }

    async fetchUserGames(developer: string | Types.ObjectId) {
        return this.gameRepo.findAll({ developer });
    }

    async viewApiKey(gameId: string | Types.ObjectId, userId: string | Types.ObjectId, userEmail: string, otpCode: string) {
        const game = await this.gameRepo.findOne({ _id: gameId, developer: userId }, "+apiKey");
        if (!game) throw new NotFoundException('Game not found');

        const valid = await this.otpService.verifyOtp(userEmail, otpCode);
        if (!valid) throw new ForbiddenException('Invalid or expired OTP');

        return { apiKey: game.apiKey };
    }

    async regenerateApiKey(gameId: string | Types.ObjectId, userId: string | Types.ObjectId, userEmail: string, otpCode: string) {
        const game = await this.gameRepo
            .findOne({ _id: gameId, developer: userId }, "+apiKey");
        if (!game) throw new NotFoundException('Game not found');

        const valid = await this.otpService.verifyOtp(userEmail, otpCode);
        if (!valid) throw new ForbiddenException('Invalid or expired OTP');

        game.apiKey = this.generateApiKey();
        await game.save();

        return { apiKey: game.apiKey };
    }

    async findById(
        id: string | Types.ObjectId,
        projection?: ProjectionType<IGame>,
        options?: QueryOptions<IGame>,
        populate?: PopulateOptions | (string | PopulateOptions)[]
    ) {
        return this.gameRepo.findById(id, projection, options, populate);
    }

    async findByApiKey(apiKey: string) {
        return this.gameRepo.findOne({ apiKey });
    }

    private generateApiKey(): string {
        const randomKey = randomBytes(16).toString('hex');
        return `nexra_${randomKey}`;
    }
}

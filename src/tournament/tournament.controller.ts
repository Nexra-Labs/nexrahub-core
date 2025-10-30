import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { TournamentService } from './providers/tournament.service';
import { CreateTournamentDto } from './dtos/create-tournament.dto';
import { UpdateTournamentDto } from './dtos/update-tournament.dto';
import { CreateTournamentEntryDto } from './dtos/create-tournament-entry.dto';
import { TournamentEntryService } from './providers/tournament-entry.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { ActiveGame } from 'src/game/decorator/active-game.decorator';

@ApiTags('Tournaments')
@ApiSecurity('jwt-auth')
@Controller('tournament')
export class TournamentController {
    constructor(
        private readonly tournamentService: TournamentService,
        private readonly tournamentEntryService: TournamentEntryService
    ) { }

    @Post('create')
    @Auth(AuthType.ApiKey)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a tournament' })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Tournament created successfully',
        example: {
            schema: {
                "message": "Tournament created successfully",
                "tournament": {
                    "game": {
                        "_id": "68f9ce6d27a07cdb23dd65c7",
                        "name": "Battle Arenaa",
                        "id": "68f9ce6d27a07cdb23dd65c7"
                    },
                    "name": "Battle of Nexra",
                    "description": "An intense tournament for top gamers",
                    "entryFee": 50,
                    "prizePool": 0,
                    "status": "pending",
                    "startTime": "2025-11-10T18:00:00.000Z",
                    "endTime": "2025-11-10T21:00:00.000Z",
                    "winner": null,
                    "_id": "68fa2b750366dd5ff66d599d",
                    "createdAt": "2025-10-23T13:19:49.620Z",
                    "updatedAt": "2025-10-23T13:19:49.620Z",
                    "id": "68fa2b750366dd5ff66d599d"
                }
            }
        }
    })
    async create(@Body() dto: CreateTournamentDto, @ActiveGame("_id") game: string) {
        const result = await this.tournamentService.createTournament(game, dto);
        return { message: 'Tournament created successfully', tournament: result };
    }

    @Patch(':tournamentId/update')
    @Auth(AuthType.ApiKey)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Update a pending tournament (if not started)' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tournament updated successfully',
        example: {
            schema: {
                "message": "Tournament updated successfully",
                "tournament": {
                    "_id": "68fa2b750366dd5ff66d599d",
                    "game": {
                        "_id": "68f9ce6d27a07cdb23dd65c7",
                        "name": "Battle Arenaa",
                        "id": "68f9ce6d27a07cdb23dd65c7"
                    },
                    "name": "Battle of Nexra",
                    "description": "An intense tournament for top gamers",
                    "entryFee": 50,
                    "prizePool": 0,
                    "status": "pending",
                    "startTime": "2025-11-10T18:00:00.000Z",
                    "endTime": "2025-11-10T21:00:00.000Z",
                    "winner": null,
                    "createdAt": "2025-10-23T13:19:49.620Z",
                    "updatedAt": "2025-10-23T13:19:49.620Z",
                    "id": "68fa2b750366dd5ff66d599d"
                }
            }
        }
    })
    async update(@Param('tournamentIdupdate') id: string, @Body() dto: UpdateTournamentDto, @ActiveGame("_id") game: string) {
        const result = await this.tournamentService.updateTournament(game, id, dto);
        return { message: 'Tournament updated successfully', tournament: result };
    }

    @Patch(':tournamentIdupdate/publish')
    @Auth(AuthType.ApiKey)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Publish a pending tournament that has not yet started' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tournament published successfully',
        example: {
            schema: {
                "message": "Tournament published successfully",
                "tournament": {
                    "_id": "68fa2b750366dd5ff66d599d",
                    "game": {
                        "_id": "68f9ce6d27a07cdb23dd65c7",
                        "name": "Battle Arenaa",
                        "id": "68f9ce6d27a07cdb23dd65c7"
                    },
                    "name": "Battle of Nexra",
                    "description": "An intense tournament for top gamers",
                    "entryFee": 50,
                    "prizePool": 0,
                    "status": "published",
                    "startTime": "2025-11-10T18:00:00.000Z",
                    "endTime": "2025-11-10T21:00:00.000Z",
                    "winner": null,
                    "createdAt": "2025-10-23T13:19:49.620Z",
                    "updatedAt": "2025-10-23T13:42:12.609Z",
                    "id": "68fa2b750366dd5ff66d599d"
                }
            }
        }
    })
    async publish(@Param('id') id: string, @ActiveGame("_id") game: string) {
        const result = await this.tournamentService.publishTournament(game, id);
        return { message: 'Tournament published successfully', tournament: result };
    }

    @Post(':tournamentId/join')
    @Auth(AuthType.ApiKey)
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Enter a gamer into a tournament',
        description:
            'Creates a gamer if not existing, adds them to the tournament, creates their bet option, and updates the prize pool.',
    })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Successfully joined the tournament.',
        schema: {
            example: {
                message: 'Gamer successfully joined the tournament.',
                entry: {
                    id: '6718ac03e0ad9b01f43b76b3',
                    tournament: '6718a8dde0ad9b01f43b76a2',
                    gamer: '6718ab5ee0ad9b01f43b76a8',
                    entryFee: 100,
                    joinedAt: '2025-10-23T13:25:48.112Z',
                    eliminated: false,
                    eliminatedAt: null,
                    rank: null,
                    createdAt: '2025-10-23T13:25:48.112Z',
                    updatedAt: '2025-10-23T13:25:48.112Z',
                }
            }
        }
    })
    async joinTournament(@Param('tournamentId') tournamentId: string, @Body() dto: CreateTournamentEntryDto, @ActiveGame("_id") game: string) {
        const entry = await this.tournamentEntryService.enterTournament(game, tournamentId, dto);
        return {
            message: 'Gamer successfully joined the tournament.',
            entry
        };
    }
}

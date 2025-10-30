import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTH_KEY } from 'src/auth/decorators/auth.decorator';
import { AuthType } from 'src/auth/enums/auth-type.enum';
import { GameService } from 'src/game/providers/game.service';
import { JwtService } from 'src/security/providers/jwt.service';
import { UserService } from 'src/user/providers/user.service';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly gameService: GameService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAuth = this.reflector.get<AuthType>(AUTH_KEY, context.getHandler());

    if (requiredAuth === AuthType.None) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (requiredAuth === AuthType.ApiKey) {
      return this.validateApiKey(request);
    } else {
      return this.validateBearer(request);
    }
  }

  private async validateBearer(request: any): Promise<boolean> {
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Bearer token');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload;

    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    request.user = user;
    return true;
  }

  private async validateApiKey(request: any): Promise<boolean> {
    const apiKey = request.headers['x-api-key'] || request.query.apiKey;

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key');
    }

    const game = await this.gameService.findByApiKey(apiKey);
    if (!game) {
      throw new ForbiddenException('Invalid API key');
    }

    request.game = game;
    return true;
  }
}
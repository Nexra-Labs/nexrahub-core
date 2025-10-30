import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ActiveGame = createParamDecorator(
    (field: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const game = request.game;
        return field ? game?.[field] : game;
    },
);

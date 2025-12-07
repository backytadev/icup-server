import {
  ExecutionContext,
  createParamDecorator,
  InternalServerErrorException,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new InternalServerErrorException(
        `Usuario no encontrado en la solicitud.`,
      );
    }

    return !data ? user : user[data];
  },
);

// Takes the user out of the context (which was set on strategy validation) and sets it as the user
// that is held as property (user: User)

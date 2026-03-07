import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PublicOrAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];
    const validApiKey = this.configService.get<string>('PUBLIC_API_KEY');

    if (apiKey && apiKey === validApiKey) {
      return true;
    }

    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException(
        'Access denied: Valid API key or authentication token required',
      );
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET_ACCESS'),
      });

      req.user = payload;
      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'Access denied: Valid API key or authentication token required',
      );
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

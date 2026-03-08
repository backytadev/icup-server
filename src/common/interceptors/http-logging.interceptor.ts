import {
  Logger,
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const { method, url } = req;
    const userId: string = req.user?.id ?? 'anonymous';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `${method} ${url} ${res.statusCode} — ${duration}ms [user: ${userId}]`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - start;
        const status: number = error.status ?? 500;
        const message: string = error.message ?? 'Unknown error';

        if (status >= 500) {
          this.logger.error(
            `${method} ${url} ${status} — ${duration}ms [user: ${userId}] "${message}"`,
          );
        } else {
          this.logger.warn(
            `${method} ${url} ${status} — ${duration}ms [user: ${userId}] "${message}"`,
          );
        }

        return throwError(() => error);
      }),
    );
  }
}

import { ForbiddenError } from "@casl/ability";
import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";

@Catch(ForbiddenError)
export class ForbiddenExceptionFilter implements ExceptionFilter {
  catch(exception: ForbiddenError<any>, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(403).json({
      statusCode: 403,
      timestamp: new Date().toISOString(),
      message: exception.message,
    });
  }
}

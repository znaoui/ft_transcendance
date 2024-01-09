import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class ChatAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const request = client.request;
    return request?.isAuthenticated() ?? false;
  }
}

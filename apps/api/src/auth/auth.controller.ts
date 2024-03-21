import { Controller, Get, Response, UseGuards } from "@nestjs/common";
import { config } from "dotenv";
import { User } from "src/auth/jwt/jwtuser.decorator";
import { AuthService } from "./auth.service";
import { GoogleUser } from "./google/GoogleUser";
import { GoogleGuard } from "./google/google.guard";

config();

@Controller("google")
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(GoogleGuard)
  @Get("redirect")
  async googleAuth() {}

  @UseGuards(GoogleGuard)
  @Get("login")
  async googleLogin(@User() user: GoogleUser, @Response() response) {
    const token = await this.authService.googleAuth(user);

    response.status(200);
    return response.json({
      access_token: token,
    });
  }
}

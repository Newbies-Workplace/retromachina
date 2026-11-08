import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, type VerifyCallback } from "passport-google-oauth20";
import type { StateStore } from "passport-oauth2";
import { OAuthStateService } from "../session/oauth-state.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(states: OAuthStateService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      // Structurally compatible; only verify() is used (see OAuthStateService).
      store: states as unknown as StateStore,
      scope: ["email", "profile"],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ) {
    const { id, name, emails, photos } = profile;
    done(null, {
      id,
      email: emails[0].value,
      emailVerified:
        emails[0].verified === true || profile._json?.email_verified === true,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    });
  }
}

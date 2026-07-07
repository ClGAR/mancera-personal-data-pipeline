import passport from 'passport';
import GitHubStrategyPackage from 'passport-github2';
import { env, flags } from './env.js';
import { upsertGitHubUser } from '../services/github.service.js';

const GitHubStrategy = GitHubStrategyPackage.Strategy || GitHubStrategyPackage;

export function configurePassport() {
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  if (!flags.hasGithubOAuth) {
    console.warn('GitHub OAuth is not configured. /auth/github will return setup guidance.');
    return;
  }

  passport.use(
    new GitHubStrategy(
      {
        clientID: env.github.clientId,
        clientSecret: env.github.clientSecret,
        callbackURL: env.github.callbackUrl
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const user = await upsertGitHubUser({ profile, accessToken });
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    )
  );
}

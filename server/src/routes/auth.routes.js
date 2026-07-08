import { Router } from 'express';
import passport from 'passport';
import { env, flags } from '../config/env.js';

const router = Router();

router.get('/github', (req, res, next) => {
  if (!flags.hasGithubOAuth) {
    return res.status(503).json({
      error: 'GitHub OAuth is not configured',
      message: 'Add GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_CALLBACK_URL to your environment.'
    });
  }

  return passport.authenticate('github', {
    scope: ['read:user', 'repo']
  })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  if (!flags.hasGithubOAuth) {
    return res.redirect(`${env.clientUrl}?auth=github-not-configured`);
  }

  return passport.authenticate('github', {
    failureRedirect: `${env.clientUrl}?auth=failed`
  })(req, res, () => {
    res.redirect(`${env.clientUrl}?auth=connected`);
  });
});

router.get('/me', (req, res) => {
  if (req.isAuthenticated?.() && req.user) {
    return res.json({
      authenticated: true,
      user: serializeUserForClient(req.user)
    });
  }

  return res.json({
    authenticated: false,
    user: flags.hasGithubOAuth
      ? null
      : {
          id: 'demo-user',
          username: 'demo-developer',
          displayName: 'Demo Developer',
          isDemo: true
        }
  });
});

function serializeUserForClient(user) {
  return {
    id: user.id || user.userId || null,
    userId: user.userId || user.id || null,
    githubId: user.githubId || user.github_id || null,
    username: user.username || null,
    displayName: user.displayName || user.display_name || user.username || null,
    email: user.email || null,
    avatarUrl: user.avatarUrl || user.avatar_url || null,
    isDemo: Boolean(user.isDemo)
  };
}

router.post('/logout', (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);

    req.session?.destroy(() => {
      res.clearCookie('pdp.sid');
      res.json({ ok: true });
    });
  });
});

export default router;

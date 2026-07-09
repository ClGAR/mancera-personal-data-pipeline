import { flags } from '../config/env.js';

export function requireAuth(req, res, next) {
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }

  if (!flags.hasGithubOAuth) {
    req.user = {
      id: 'demo-user',
      userId: 'demo-user',
      githubId: 'demo-github-id',
      username: 'demo-developer',
      displayName: 'Demo Developer',
      avatarUrl: null,
      githubAccessToken: null,
      isDemo: true
    };
    return next();
  }

  return res.status(401).json({
    error: 'auth_required',
    message: 'Connect GitHub first by visiting /auth/github.'
  });
}

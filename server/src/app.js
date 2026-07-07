import express from 'express';
import session from 'express-session';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import { env } from './config/env.js';
import { configurePassport } from './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import statsRoutes from './routes/stats.routes.js';
import syncRoutes from './routes/sync.routes.js';
import chatbotRoutes from './routes/chatbot.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

configurePassport();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  session({
    name: 'pdp.sid',
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
      secure: env.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/stats', statsRoutes);
app.use('/sync', syncRoutes);
app.use('/chatbot', chatbotRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

app.use(errorHandler);

export default app;

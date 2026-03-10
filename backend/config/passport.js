import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import config from './environment.js';

if (config.ENABLE_GOOGLE_AUTH && config.GOOGLE_CLIENT_ID) {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL:  config.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'), null);

          // Check if user already exists
          let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

          if (user) {
            // Link Google ID if signing in with existing email
            if (!user.googleId) {
              user.googleId = profile.id;
              user.emailVerified = true;
              if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
              }
              await user.save({ validateBeforeSave: false });
            }
            return done(null, user);
          }

          // Create new user from Google profile
          const firstName = profile.name?.givenName  || profile.displayName.split(' ')[0] || 'User';
          const lastName  = profile.name?.familyName || profile.displayName.split(' ')[1] || '';

          // Generate unique username from email
          let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
          let username = baseUsername;
          let counter = 1;
          while (await User.findOne({ username })) {
            username = `${baseUsername}${counter++}`;
          }

          user = await User.create({
            firstName,
            lastName,
            username,
            email,
            googleId:      profile.id,
            avatar:        profile.photos?.[0]?.value || null,
            emailVerified: true,
            displayName:   profile.displayName,
            // No password for OAuth users
          });

          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

export default passport;

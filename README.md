# Daystar Backend

A RESTful API backend for Daystar -> a habit tracker mobile app with photo-checkins

# Checkout [my Frontend here](https://github.com/t33devv/daystar)

## 🌟 Features

**User auth**
- Email/password registration and login
- Google OAuth2.0 integration
- JWT token-based auth
- Profile management

**Habit Management**
- Create/read/update/delete habits
- Customizable icons/colors
- Active 24-48 hour daily habit streaks

**Check-in System**
- Photo-based checkins with Cloudinary storage
- Automatic daily check-in increment/reset

## 🛠️ Tech Stack
- Node.js v14+
- PostgreSQL v12+
- npm/yarn
- Cloudinary
- Google Cloud Console
- Render deployment

### Authentication (`/api/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/setup` | No | Initialize users table |
| POST | `/register` | No | Register with email/password |
| POST | `/login` | No | Login with email/password |
| POST | `/google` | No | Google OAuth sign-in |
| GET | `/verify` | Yes | Verify JWT token |
| POST | `/refresh` | Yes | Refresh JWT token |
| PUT | `/profile` | Yes | Update user profile |

### Habits (`/api/habits`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/setup` | No | Initialize habits tables |
| GET | `/` | Yes | Get all user habits |
| POST | `/` | Yes | Create new habit |
| PUT | `/:id` | Yes | Update habit |
| DELETE | `/:id` | Yes | Delete habit |
| GET | `/stats` | Yes | Get user statistics |
| POST | `/:id/checkin` | Yes | Check in with photo |
| GET | `/:id/checkins` | Yes | Get habit check-in history |
| POST | `/upload-image` | Yes | Upload image to Cloudinary |

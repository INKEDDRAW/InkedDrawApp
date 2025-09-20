# 🚬 Inked Draw

**The Premier Social Community for Connoisseurs of Cigars, Craft Beer, and Fine Wine**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.72-blue.svg)](https://reactnative.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-10.0-red.svg)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)

## 🌟 Overview

Inked Draw is a sophisticated social platform that combines cutting-edge AI technology with elegant design to create an unparalleled experience for enthusiasts of premium cigars, craft beer, and fine wine. Our platform features revolutionary **Google Vision AI integration** for instant cigar recognition and a comprehensive **smoke shop locator** to help users discover and purchase products.

### ✨ Key Features

- 🤖 **AI-Powered Cigar Recognition** - Instantly identify any cigar from a photo
- 📍 **Smart Smoke Shop Locator** - Find nearby retailers with real-time inventory
- 👥 **Premium Social Community** - Age-verified platform for true connoisseurs
- 🎯 **Intelligent Recommendations** - ML-powered product suggestions
- ⚡ **Real-time Features** - Live notifications and instant updates
- 🛡️ **Advanced Security** - Multi-layer security and content moderation
- 📊 **Performance Monitoring** - Enterprise-grade analytics and optimization
- 🎨 **Elegant Design** - Sophisticated UI with Onyx & Gold aesthetic

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Native  │    │     NestJS      │    │    Supabase     │
│    Frontend     │────│    Backend      │────│   PostgreSQL    │
│   (Expo App)    │    │  (REST API)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │  Google Vision  │    │      Redis      │
         └──────────────│      API        │────│   (Caching)     │
                        │ (AI Recognition)│    │                 │
                        └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- Docker and Docker Compose
- Supabase CLI
- Google Cloud account (for Vision API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/inked-draw.git
   cd inked-draw
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # Update with your configuration
   ```

4. **Database setup**
   ```bash
   # Start Supabase locally
   supabase start

   # Run migrations
   cd backend
   npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run start:dev

   # Frontend (Terminal 2)
   cd frontend
   npm start
   ```

## 📱 Tech Stack

### Frontend
- **React Native** with Expo for cross-platform mobile development
- **TypeScript** for type safety and better developer experience
- **WatermelonDB** for offline-first local database
- **Zustand** for state management
- **TanStack Query** for server state management
- **Expo Camera** for image capture and recognition

### Backend
- **NestJS** with TypeScript for scalable server architecture
- **Supabase** PostgreSQL for primary database with real-time features
- **Redis** for caching and session management
- **BullMQ** for background job processing
- **Google Vision API** for AI-powered image recognition
- **PostHog** for analytics and feature flags

### Infrastructure
- **AWS App Runner** for containerized deployment
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **CloudWatch** for monitoring and logging

## 📚 Documentation

- [📖 User Guide](docs/USER-GUIDE.md) - Complete user documentation
- [👨‍💼 Admin Guide](docs/ADMIN-GUIDE.md) - Administrator documentation
- [🔧 API Documentation](docs/API-DOCUMENTATION.md) - Complete API reference
- [🚀 Deployment Guide](docs/PRODUCTION-DEPLOYMENT-GUIDE.md) - Production deployment
- [🎯 Vision & Location Guide](docs/VISION-AND-LOCATION-GUIDE.md) - AI features documentation
- [⚡ Performance Guide](docs/PERFORMANCE-OPTIMIZATION-GUIDE.md) - Performance optimization

## 🛠️ Development

### Project Structure
```
inked-draw/
├── frontend/           # React Native mobile app
├── backend/            # NestJS API server
├── docs/              # Comprehensive documentation
├── scripts/           # Deployment and utility scripts
├── .github/           # GitHub workflows and templates
└── docker-compose.yml # Local development setup
```

### Available Scripts

**Backend:**
```bash
npm run start:dev      # Start development server
npm run build          # Build for production
npm run test           # Run tests
npm run test:e2e       # Run end-to-end tests
npm run db:migrate     # Run database migrations
```

**Frontend:**
```bash
npm start              # Start Expo development server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
npm run test           # Run tests
```

## 🧪 Testing

We maintain comprehensive test coverage across the application:

- **Unit Tests** - Individual component and service testing
- **Integration Tests** - End-to-end workflow testing
- **API Tests** - Complete endpoint validation
- **Security Tests** - Vulnerability and penetration testing
- **Performance Tests** - Load testing and optimization validation

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:integration
npm run test:security
npm run test:performance
```

## 🚀 Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Using deployment script
./scripts/production-setup.sh

# Or manual deployment
docker build -t inked-draw-backend ./backend
docker build -t inked-draw-frontend ./frontend
```

See [Deployment Guide](docs/PRODUCTION-DEPLOYMENT-GUIDE.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting pull requests.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Maintain test coverage above 80%
- Use conventional commit messages
- Follow the established code style (ESLint + Prettier)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Vision API** for powerful image recognition capabilities
- **Supabase** for providing excellent backend-as-a-service
- **Expo** for simplifying React Native development
- **NestJS** for the robust backend framework
- The open-source community for amazing tools and libraries

## 📞 Support

- 📧 **Email**: support@inkeddraw.com
- 📖 **Documentation**: [docs/](docs/)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/inked-draw/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/inked-draw/discussions)

## 🔗 Links

- **Website**: https://inkeddraw.com
- **App Store**: [Coming Soon]
- **Google Play**: [Coming Soon]
- **Twitter**: [@InkedDraw](https://twitter.com/InkedDraw)

---

**Inked Draw - Where Connoisseurs Connect** 🥃🚬🍺

*Built with ❤️ for the community of cigar, craft beer, and fine wine enthusiasts*
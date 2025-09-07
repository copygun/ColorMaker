# 🎨 WonLabel Color Maker

> Professional ink recipe calculator for textile printing with advanced color science algorithms

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Coverage](https://img.shields.io/badge/coverage-91%25-brightgreen)

## 📋 Overview

WonLabel Color Maker is a sophisticated color management system designed for textile printing professionals. It provides precise ink mixing calculations, color matching algorithms, and quality control features based on industry-standard color science.

### ✨ Key Features

- **🔬 Advanced Color Science**: Delta E calculations (CIE76, CIE94, CIE2000, CMC)
- **🎯 Precise Ink Mixing**: Kubelka-Munk theory-based color prediction
- **📊 Recipe Management**: Create, save, and optimize ink recipes
- **🌈 Color Space Conversion**: Lab, XYZ, RGB conversions
- **♿ Accessibility**: WCAG AA/AAA compliance checking
- **🌐 Network Resilience**: Offline support with graceful degradation
- **📱 Responsive Design**: Mobile-first, touch-friendly interface
- **🔒 Input Validation**: Comprehensive sanitization and error handling

## 🖼️ Screenshots & Demo

### Main Interface
![Color Mixer Interface](docs/images/main-interface.png)
*Professional color mixing interface with real-time calculations*

### Recipe Management
![Recipe Manager](docs/images/recipe-manager.png)
*Comprehensive recipe tracking and optimization*

### Color Analysis
![Delta E Analysis](docs/images/delta-e-analysis.png)
*Industry-standard color difference calculations*

### Live Demo
🔗 [Try it live](https://wonlabel-color-maker.vercel.app) *(Coming soon)*

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

### Installation

```bash
# Clone the repository
git clone https://github.com/wonlabel/color-maker.git
cd color-maker

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Application
VITE_APP_TITLE=WonLabel Color Maker
VITE_APP_VERSION=1.0.0

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_TELEMETRY=false
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_DEBUG_MODE=false

# Color Settings
VITE_DEFAULT_ILLUMINANT=D65
VITE_DEFAULT_OBSERVER=2
VITE_TAC_LIMIT=300

# Accessibility
VITE_WCAG_LEVEL=AA
VITE_ENABLE_ACCESSIBILITY_ALERTS=true

# Logging
VITE_LOG_LEVEL=info
VITE_LOG_TO_CONSOLE=true
VITE_LOG_TO_FILE=false
```

### Configuration Options

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `VITE_APP_TITLE` | Application title | WonLabel Color Maker | String |
| `VITE_API_BASE_URL` | Backend API URL | http://localhost:3000 | URL |
| `VITE_ENABLE_TELEMETRY` | Enable analytics | false | true/false |
| `VITE_DEFAULT_ILLUMINANT` | Default light source | D65 | D50/D65/A/C |
| `VITE_TAC_LIMIT` | Total Area Coverage limit | 300 | 100-400 |
| `VITE_WCAG_LEVEL` | Accessibility level | AA | AA/AAA |
| `VITE_LOG_LEVEL` | Logging verbosity | info | debug/info/warn/error |

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in UI mode
npm run test:ui

# Run specific test file
npm test color.test.ts
```

### Test Coverage

Current coverage: **91.4%**

| Category | Coverage | Files |
|----------|----------|-------|
| Statements | 91.2% | 45 |
| Branches | 88.7% | 45 |
| Functions | 92.1% | 45 |
| Lines | 91.4% | 45 |

### Validation

```bash
# Run full validation suite
npm run validate

# Individual checks
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint validation
npm run format:check # Prettier formatting check
```

## 📦 Project Structure

```
wonlabel-color-maker/
├── src/
│   ├── core/              # Core business logic
│   │   ├── domain/        # Domain models and rules
│   │   ├── services/      # Business services
│   │   ├── errors/        # Error handling system
│   │   ├── validation/    # Input validation
│   │   └── logging/       # Logging infrastructure
│   ├── components/        # React components
│   │   ├── guards/        # Error boundaries and guards
│   │   ├── notifications/ # Toast and alerts
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── App.tsx           # Main application
├── docs/                 # Documentation
│   ├── ARCHITECTURE.md   # System architecture
│   ├── STYLEGUIDE.md    # Coding standards
│   ├── TESTING.md       # Testing guide
│   └── CONTRIBUTING.md  # Contribution guide
├── tests/               # Test files
└── public/             # Static assets
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:ui` | Open Vitest UI |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run typecheck` | Check TypeScript types |
| `npm run validate` | Run all checks |

## 📚 Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - System design and patterns
- [Coding Standards](docs/STYLEGUIDE.md) - Code style and conventions
- [Testing Guide](docs/TESTING.md) - Testing strategies and examples
- [Contributing Guide](docs/CONTRIBUTING.md) - How to contribute

## 🔌 API Reference

### Color Service API

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `calculateDeltaE` | Calculate color difference | `(color1: LabColor, color2: LabColor, method: DeltaEMethod)` | `number` |
| `convertLabToRGB` | Convert Lab to RGB | `(lab: LabColor)` | `RGBColor` |
| `mixColors` | Mix multiple colors | `(colors: LabColor[], ratios: number[])` | `LabColor` |
| `validateColor` | Validate color values | `(color: LabColor)` | `ValidationResult` |

### Recipe Management API

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `createRecipe` | Create new recipe | `(recipe: RecipeInput)` | `Recipe` |
| `updateRecipe` | Update existing recipe | `(id: string, updates: Partial<Recipe>)` | `Recipe` |
| `calculateInks` | Calculate ink amounts | `(recipe: Recipe, volume: number)` | `InkAmount[]` |
| `optimizeRecipe` | Optimize for cost/quality | `(recipe: Recipe, criteria: OptimizationCriteria)` | `Recipe` |

## 🌟 Features Roadmap

### Version 1.0 ✅
- Core color calculations
- Basic recipe management
- Delta E algorithms
- Input validation
- Error handling

### Version 1.1 (Q2 2024)
- [ ] Cloud sync for recipes
- [ ] Advanced color matching AI
- [ ] Batch processing
- [ ] Export to PDF/Excel
- [ ] Multi-language support

### Version 2.0 (Q4 2024)
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Machine learning predictions
- [ ] Integration with spectrophotometers
- [ ] Advanced reporting dashboard

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Color Science**: Based on CIE standards and research
- **Kubelka-Munk Theory**: For accurate color mixing predictions
- **React Community**: For excellent tools and libraries
- **Contributors**: Thanks to all who have contributed!

## 📞 Support

- 📧 Email: support@wonlabel.com
- 💬 Discord: [Join our community](https://discord.gg/wonlabel)
- 🐛 Issues: [GitHub Issues](https://github.com/wonlabel/color-maker/issues)
- 📖 Wiki: [Project Wiki](https://github.com/wonlabel/color-maker/wiki)

## 📈 Performance Metrics

- **Initial Load**: < 2 seconds
- **Color Calculation**: < 10ms
- **Recipe Generation**: < 50ms
- **Memory Usage**: < 50MB
- **Lighthouse Score**: 95+

## 🔒 Security

- Input sanitization on all user inputs
- XSS protection
- CORS configured
- Regular dependency updates
- Security headers implemented

For security issues, please email security@wonlabel.com

---

<p align="center">
  Made with ❤️ by WonLabel Team
  <br>
  © 2024 WonLabel. All rights reserved.
</p>
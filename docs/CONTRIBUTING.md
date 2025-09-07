# 🤝 Contributing to WonLabel Color Maker

Thank you for your interest in contributing to WonLabel Color Maker! We welcome contributions from the community and are grateful for any help you can provide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community](#community)

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual identity.

### Our Standards

**Examples of positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards others

**Examples of unacceptable behavior:**
- Harassment of any kind
- Trolling, insulting, or derogatory comments
- Personal or political attacks
- Publishing others' private information
- Other conduct deemed inappropriate

## 🎯 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When reporting a bug, include:**

```markdown
## Bug Description
A clear and concise description of the bug.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Screenshots
If applicable, add screenshots.

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 90]
- Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information.
```

### 💡 Suggesting Enhancements

**Enhancement suggestions should include:**

```markdown
## Feature Description
Clear description of the proposed feature.

## Problem It Solves
What problem does this feature address?

## Proposed Solution
How should it work?

## Alternatives Considered
Other solutions you've thought about.

## Additional Context
Mockups, examples, or references.
```

### 📝 Contributing Code

1. **Find an issue** - Look for issues labeled `good first issue` or `help wanted`
2. **Comment on the issue** - Let us know you're working on it
3. **Fork the repository** - Create your own copy
4. **Create a branch** - Make your changes
5. **Submit a pull request** - We'll review your contribution

## 🛠️ Development Setup

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git
- VS Code (recommended)

### Setup Steps

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/wonlabel-color-maker.git
cd wonlabel-color-maker

# 3. Add upstream remote
git remote add upstream https://github.com/wonlabel/color-maker.git

# 4. Install dependencies
npm install

# 5. Create a branch for your feature
git checkout -b feature/your-feature-name

# 6. Start development server
npm run dev
```

### VS Code Setup

Install recommended extensions:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "usernamehw.errorlens",
    "eamodio.gitlens"
  ]
}
```

## 🔄 Development Workflow

### 1. Stay Updated

```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes into your branch
git merge upstream/main
```

### 2. Make Changes

```bash
# Make your changes
# ... edit files ...

# Run tests
npm test

# Check linting
npm run lint

# Format code
npm run format

# Type check
npm run typecheck
```

### 3. Test Thoroughly

```bash
# Run full validation
npm run validate

# Check test coverage
npm run test:coverage

# Test production build
npm run build
npm run preview
```

### 4. Commit Changes

Follow our commit message convention (see below).

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## 📏 Coding Standards

Please follow our [Style Guide](./STYLEGUIDE.md). Key points:

### TypeScript
- Use explicit types
- Avoid `any` type
- Use interfaces for objects
- Document complex functions

### React
- Functional components with hooks
- Props validation with TypeScript
- Memoization for expensive operations
- Accessibility compliance (WCAG AA)

### Testing
- Minimum 80% coverage for new code
- Test edge cases
- Include unit and integration tests
- Follow AAA pattern (Arrange, Act, Assert)

## 📝 Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or corrections
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
git commit -m "feat(color-mixer): add Kubelka-Munk mixing algorithm"

# Bug fix
git commit -m "fix(validation): correct TAC limit calculation"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Breaking change
git commit -m "feat(api): change color format to Lab

BREAKING CHANGE: Color API now expects Lab format instead of RGB"
```

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass (`npm test`)
- [ ] Coverage maintained (`npm run test:coverage`)
- [ ] Linting passes (`npm run lint`)
- [ ] Types check (`npm run typecheck`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots
If applicable, add screenshots.

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex code
- [ ] I have updated documentation
- [ ] My changes generate no warnings
- [ ] I have added appropriate tests
- [ ] All tests pass locally
```

### Review Process

1. **Automatic checks** - CI/CD runs tests and checks
2. **Code review** - Maintainers review code
3. **Feedback** - Address review comments
4. **Approval** - Get approval from maintainers
5. **Merge** - PR is merged to main

## 📋 Issue Guidelines

### Creating Issues

#### Bug Report Template

```markdown
**Describe the bug**
Clear description of the bug.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 90]
- Version: [e.g., 1.0.0]

**Additional context**
Any other context about the problem.
```

#### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Clear description of the problem.

**Describe the solution**
What you want to happen.

**Describe alternatives**
Alternative solutions or features.

**Additional context**
Any other context or screenshots.
```

### Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `question` - Further information requested
- `duplicate` - This issue already exists
- `wontfix` - This will not be worked on

## 🌟 Recognition

### Contributors

We maintain a list of contributors in our README. All contributors are:
- Listed in [CONTRIBUTORS.md](../CONTRIBUTORS.md)
- Credited in release notes
- Eligible for contributor badges

### Types of Contributions

We recognize all types of contributions:
- 💻 Code contributions
- 📖 Documentation improvements
- 🐛 Bug reports
- 💡 Feature suggestions
- 🎨 Design contributions
- 📢 Community support
- 🌍 Translations

## 👥 Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General discussions
- **Discord** - Real-time chat ([Join here](https://discord.gg/wonlabel))
- **Email** - contribute@wonlabel.com

### Getting Help

- Check the [documentation](../README.md)
- Search [existing issues](https://github.com/wonlabel/color-maker/issues)
- Ask in [GitHub Discussions](https://github.com/wonlabel/color-maker/discussions)
- Join our [Discord server](https://discord.gg/wonlabel)

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Thank you for contributing to WonLabel Color Maker! Your efforts help make this project better for everyone.

---

*Happy Contributing! 🎨*
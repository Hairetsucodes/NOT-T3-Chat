# OSS T3 Chat

A modern AI chat application built with Next.js, Prisma, NextAuth supporting multiple AI providers including OpenAI, Anthropic, Google, and more.

## ✨ Features

- 🤖 Multiple AI provider support (OpenAI, Anthropic, Google, DeepSeek, Xai, OpenRouter, and more)
- 🔐 Authentication with NextAuth
- 💾 Persistent chat history with Prisma
- 📤 History Sync Export/Import functionality
- 🧠 Reasoning/thinking mode support
- 🎨 Modern UI with Tailwind CSS and Radix UI
- 🌙 Dark/Light mode support
- ⚡ Real-time streaming responses
- 📱 Responsive design
- 🔧 Customizable user settings and prompts
- 🎯 Syntax highlighting for code blocks

## 📸 Screenshots

### Authentication & Registration

<table>
  <tr>
    <td align="center">
      <img src="public/images/previews/signin.png" alt="Sign In" width="400"/>
      <br/><strong>Sign In</strong>
    </td>
    <td align="center">
      <img src="public/images/previews/register.png" alt="Register" width="400"/>
      <br/><strong>Register</strong>
    </td>
  </tr>
</table>

### Chat Interface

<table>
  <tr>
    <td align="center">
      <img src="public/images/previews/chat.png" alt="Chat Interface" width="800"/>
      <br/><strong>Main Chat Interface</strong>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="public/images/previews/reasoning.png" alt="Reasoning Mode" width="800"/>
      <br/><strong>Reasoning/Thinking Mode</strong>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="public/images/previews/syntax.png" alt="Syntax Highlighting" width="800"/>
      <br/><strong>Code Syntax Highlighting</strong>
    </td>
  </tr>
</table>

### Configuration & Settings

<table>
  <tr>
    <td align="center">
      <img src="public/images/previews/models.png" alt="Model Selection" width="400"/>
      <br/><strong>AI Model Selection</strong>
    </td>
    <td align="center">
      <img src="public/images/previews/apikeys.png" alt="API Keys" width="400"/>
      <br/><strong>API Key Management</strong>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="public/images/previews/customization.png" alt="Customization" width="400"/>
      <br/><strong>User Customization</strong>
    </td>
    <td align="center">
      <img src="public/images/previews/account.png" alt="Account Settings" width="400"/>
      <br/><strong>Account Settings</strong>
    </td>
  </tr>
</table>

### Additional Features

<table>
  <tr>
    <td align="center">
      <img src="public/images/previews/history.png" alt="Chat History" width="400"/>
      <br/><strong>Chat History Management</strong>
    </td>
    <td align="center">
      <img src="public/images/previews/bugreports.png" alt="Bug Reports" width="400"/>
      <br/><strong>Bug Report System</strong>
    </td>
  </tr>
</table>

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd oss-t3-chat
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   ```

   **Generate random secret:**

   ```bash
   npx auth secret
   ```

   Configure your `.env` file with the required API keys and database URL:

   ```env
   DATABASE_URL="file:../dev.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   ```

4. **Initialize the database:**

   ```bash
   pnpm run setup
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Available Scripts

### Development

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database Management

- `pnpm setup` - **Quick setup** (generate + push schema)
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database (development)
- `pnpm db:migrate` - Create and apply migrations (production)
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:reset` - Reset database (⚠️ destroys data)
- `pnpm db:seed` - Seed the database

## 🗄️ Database Setup

This project uses SQLite for local development and Prisma as the ORM.

### First-time Setup

```bash
pnpm setup
```

### Schema Changes

After modifying `prisma/schema.prisma`:

```bash
pnpm db:generate
pnpm db:push
```

### Database Management

Open Prisma Studio to manage your data:

```bash
pnpm db:studio
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### AI Provider Setup

The application supports multiple AI providers. Configure the API keys for the providers you want to use:

- **OpenAI**: GPT models (gpt-4o, gpt-4o-mini, gpt-3.5-turbo, etc.)
- **Anthropic**: Claude models (claude-3.5-sonnet, claude-3-opus, claude-3-haiku, etc.)
- **Google**: Gemini models (gemini-pro, gemini-1.5-pro, etc.)
- **DeepSeek**: DeepSeek models (deepseek-chat, deepseek-coder, etc.)
- **Xai**: Grok models (grok-beta, etc.)
- **OpenRouter**: Access to hundreds of models through one unified API including many open-source options

## 🏗️ Project Structure

```
├── app/                 # Next.js 13+ app directory
│   ├── api/            # API routes
│   ├── chat/           # Chat pages
│   └── ...
├── components/         # React components
├── data/              # Database operations
├── lib/               # Utility libraries
├── prisma/            # Database schema and migrations
├── public/            # Static assets
└── types/             # TypeScript type definitions
```

## 🚀 Deployment

### Build for Production

```bash
pnpm build
```

### Environment Setup for Production

Ensure all environment variables are properly configured for your production environment, especially:

- `DATABASE_URL` (consider PostgreSQL for production)
- `NEXTAUTH_SECRET` (use a secure random string)
- `NEXTAUTH_URL` (your production domain)
- AI provider API keys

### Database Migration for Production

```bash
pnpm db:migrate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `pnpm install`
4. Set up the database: `pnpm setup`
5. Make your changes
6. Run tests: `pnpm lint`
7. Commit your changes: `git commit -m 'Add amazing feature'`
8. Push to the branch: `git push origin feature/amazing-feature`
9. Open a Pull Request

## 📚 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Prisma ORM with SQLite (dev) / MSSQL (prod)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + Radix UI
- **AI Integration**: Multiple providers via AI SDK
- **Type Safety**: TypeScript
- **Package Manager**: pnpm

## 🐛 Troubleshooting

### Common Issues

1. **Module not found errors**: Run `pnpm db:generate` to ensure Prisma client is generated
2. **Database connection issues**: Check your `DATABASE_URL` in `.env`
3. **Build failures**: Ensure all environment variables are set
4. **Authentication issues**: Verify `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

### Getting Help

- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [Discussions](https://github.com/your-repo/discussions) section
- Consult the documentation for [Next.js](https://nextjs.org/docs), [Prisma](https://prisma.io/docs), and [NextAuth](https://next-auth.js.org/)

### TODO

- WebSearch
- Ollama Local
- Attachments
- Bug Reports
- Image Gen / Analysis
- Production Deployment / postGres
- Refactor x1000
- Tweaks
- Extra Credit: Voice 2 Voice over websockets.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

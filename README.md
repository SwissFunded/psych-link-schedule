# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2f25dceb-e74d-4563-8237-8d09a9b56aca

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2f25dceb-e74d-4563-8237-8d09a9b56aca) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Vitabyte ePAD API Integration

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2f25dceb-e74d-4563-8237-8d09a9b56aca) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Vitabyte ePAD API Integration

This project integrates with the Vitabyte ePAD API for appointment management using Basic Authentication. To use this integration:

1. Create a `.env` file in the root directory of the project (or copy from `.env.example`)
2. Add your Vitabyte ePAD API credentials to the `.env` file:

```
VITE_EPAT_USERNAME=<your Vitabyte ePAD username>
VITE_EPAT_PASSWORD=<your Vitabyte ePAD password>
```

3. Restart the development server if it's already running

The API client automatically encodes your credentials using Basic Authentication (Base64 encoding of `username:password`).

If you don't have Vitabyte ePAD API credentials, you can still use the app with mock data by setting `USE_MOCK_DATA = true` in `src/services/appointmentService.ts`.

For deployment on Vercel, add these environment variables in your project settings under "Environment Variables".

# Mortgage Lead Hub

A modern, intuitive dashboard for managing mortgage leads with drag-and-drop functionality, real-time updates, and comprehensive lead tracking.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fmortgage-lead-hub&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Supabase%20configuration%20required&envLink=https%3A%2F%2Fsupabase.com%2Fdocs%2Fguides%2Fgetting-started)

## Features

- 🎯 **Kanban Board Interface** - Drag and drop leads between status columns
- 🔍 **Advanced Search** - Quickly find leads with real-time search
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- 🔐 **Secure Authentication** - Powered by Supabase Auth with magic links
- 📊 **Real-time Updates** - See changes instantly across all devices
- 🎨 **Modern UI** - Clean, minimal design with Tailwind CSS and shadcn/ui
- 📧 **Quick Actions** - Call, email, and manage leads with one click
- 🏷️ **Smart Filtering** - Filter leads by source, status, and priority
- 📈 **Lead Analytics** - Track conversion rates and performance metrics

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Drag & Drop**: @dnd-kit
- **Deployment**: Vercel
- **Code Quality**: ESLint, Prettier, Husky

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/mortgage-lead-hub.git
cd mortgage-lead-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('Instagram', 'YouTube', 'Connection Inc.')),
  status VARCHAR(50) NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Attempted Contact', 'Qualified', 'Closed / Unqualified')),
  loan_type VARCHAR(100) NOT NULL,
  loan_amount INTEGER NOT NULL,
  notes TEXT,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all leads
CREATE POLICY "Users can view all leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert leads
CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update leads
CREATE POLICY "Users can update leads" ON leads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete leads
CREATE POLICY "Users can delete leads" ON leads
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert sample data
INSERT INTO leads (name, email, phone, source, status, loan_type, loan_amount, notes, priority) VALUES
('John Smith', 'john.smith@email.com', '(555) 123-4567', 'Instagram', 'New', 'Conventional', 350000, 'Interested in first-time buyer programs', 'high'),
('Sarah Johnson', 'sarah.j@email.com', '(555) 234-5678', 'YouTube', 'Attempted Contact', 'FHA', 275000, 'Left voicemail, waiting for callback', 'medium'),
('Mike Davis', 'mike.davis@email.com', '(555) 345-6789', 'Connection Inc.', 'Qualified', 'VA Loan', 425000, 'Pre-approved, looking for properties', 'high'),
('Emily Brown', 'emily.brown@email.com', '(555) 456-7890', 'Instagram', 'New', 'Jumbo', 750000, 'High net worth client', 'high'),
('David Wilson', 'david.w@email.com', '(555) 567-8901', 'YouTube', 'Closed / Unqualified', 'Conventional', 300000, 'Credit score too low', 'low');
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Deploy to Vercel (Recommended)

1. Click the "Deploy with Vercel" button above, or:
2. Push your code to GitHub
3. Connect your GitHub repository to Vercel
4. Add your environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## Project Structure

```
mortgage-lead-hub/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard page
│   ├── lead/[id]/        # Lead detail page
│   ├── login/            # Authentication page
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page (redirects to dashboard)
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── KanbanBoard.tsx   # Main kanban board
│   └── LeadCard.tsx      # Individual lead cards
├── lib/                  # Utility functions
│   ├── supabase.ts       # Supabase client and database functions
│   └── utils.ts          # Helper utilities
├── hooks/                # Custom React hooks
│   └── use-toast.ts      # Toast notifications
└── public/               # Static assets
```

## Key Features Explained

### Kanban Board

- Drag and drop leads between status columns
- Real-time updates with optimistic UI
- Responsive design with horizontal scroll on mobile

### Lead Management

- Detailed lead profiles with editable fields
- Quick actions (call, email, archive)
- Priority levels and source tracking
- Notes and activity history

### Authentication

- Magic link authentication via Supabase
- Secure session management
- Protected routes and API calls

### Search & Filtering

- Real-time search across all lead fields
- Filter by source, status, and priority
- Advanced filtering modal with multi-select

## Environment Variables

| Variable                        | Description                 | Required |
| ------------------------------- | --------------------------- | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL   | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes      |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please:

1. Check the [documentation](https://github.com/your-username/mortgage-lead-hub/wiki)
2. Open an [issue](https://github.com/your-username/mortgage-lead-hub/issues)
3. Join our [Discord community](https://discord.gg/your-invite)

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS.

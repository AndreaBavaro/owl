# Real-time Dashboard Setup Guide

Your Mortgage Lead Hub now supports **live database updates** that automatically refresh the dashboard when data changes. Here's how to set it up:

## 🚀 What's Been Implemented

### 1. Real-time Subscriptions
- **Dashboard**: Automatically updates when leads are added, modified, or deleted
- **Analytics**: Live charts that refresh when underlying data changes
- **Toast Notifications**: User-friendly alerts for new leads and changes
- **Mock Mode Support**: Graceful fallback when Supabase isn't configured

### 2. Live Features
- ✅ **New Lead Notifications**: Toast alerts when leads are added
- ✅ **Status Updates**: Instant UI updates when lead status changes
- ✅ **Lead Deletion**: Automatic removal from dashboard
- ✅ **Analytics Refresh**: Charts update automatically with new data
- ✅ **Multi-tab Sync**: Changes in one browser tab appear in others

## 🔧 Setup Options

### Option 1: Full Real-time with Supabase (Recommended)

1. **Configure Environment Variables**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   
   # Edit .env.local with your Supabase credentials
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Enable Real-time in Supabase**
   - Go to your Supabase project dashboard
   - Navigate to **Database** → **Replication**
   - Enable real-time for the `leads` table:
   ```sql
   ALTER TABLE leads REPLICA IDENTITY FULL;
   ```

3. **Set Row Level Security (RLS)**
   ```sql
   -- Enable RLS on leads table
   ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
   
   -- Allow authenticated users to read all leads
   CREATE POLICY "Users can view leads" ON leads
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
   ```

### Option 2: Mock Mode (Development)
- No setup required - works out of the box
- Uses simulated data and periodic refresh
- Perfect for development and testing

### Option 3: Polling-based Updates (Alternative)

If you prefer polling over real-time subscriptions, you can implement:

```typescript
// Add to your component
useEffect(() => {
  const interval = setInterval(async () => {
    await refreshLeads()
  }, 30000) // Refresh every 30 seconds
  
  return () => clearInterval(interval)
}, [])
```

## 🎯 How It Works

### Real-time Flow
1. **Database Change**: Someone adds/updates/deletes a lead
2. **Supabase Broadcast**: Change is broadcast to all connected clients
3. **Component Update**: Dashboard automatically updates the UI
4. **User Notification**: Toast notification informs users of changes

### Code Structure
```
lib/supabase.ts
├── subscribeToLeads()     # Set up real-time subscription
├── unsubscribeFromLeads() # Clean up subscription
└── Real-time callbacks    # Handle INSERT/UPDATE/DELETE events

components/LeadDashboard.tsx
├── useEffect with subscription
├── Real-time event handlers
└── Automatic UI updates

app/analytics/page.tsx
├── Live analytics updates
└── Chart refresh on data changes
```

## 🔍 Testing Real-time Updates

### Method 1: Multiple Browser Tabs
1. Open dashboard in two browser tabs
2. Add/edit a lead in one tab
3. Watch it appear/update in the other tab instantly

### Method 2: Database Direct Changes
1. Open Supabase dashboard
2. Go to Table Editor → leads
3. Add/modify a record directly
4. Watch your app dashboard update automatically

### Method 3: API Testing
```bash
# Test with curl (replace with your Supabase details)
curl -X POST 'https://your-project.supabase.co/rest/v1/leads' \
-H "apikey: your-anon-key" \
-H "Authorization: Bearer your-jwt-token" \
-H "Content-Type: application/json" \
-d '{
  "first_name": "Test",
  "last_name": "User",
  "email": "test@example.com",
  "source": "API Test"
}'
```

## 🛠️ Troubleshooting

### Real-time Not Working?
1. **Check Environment Variables**: Ensure `.env.local` has correct Supabase credentials
2. **Verify RLS Policies**: Make sure your database policies allow the operations
3. **Check Browser Console**: Look for subscription errors or connection issues
4. **Test Authentication**: Ensure user is properly authenticated

### Common Issues
- **"Mock mode" message**: Environment variables missing or invalid
- **No updates**: RLS policies too restrictive
- **Connection errors**: Network issues or incorrect Supabase URL
- **Memory leaks**: Subscriptions not properly cleaned up (handled automatically)

## 📊 Performance Considerations

### Optimizations Implemented
- **Cleanup on Unmount**: Subscriptions are properly removed
- **Conditional Updates**: Only update UI when component is mounted
- **Efficient State Updates**: Use functional state updates to prevent race conditions
- **Error Boundaries**: Graceful fallback to manual refresh on errors

### Best Practices
- Real-time subscriptions are automatically managed
- Components clean up subscriptions on unmount
- Mock mode provides seamless development experience
- Toast notifications don't overwhelm users

## 🚀 Next Steps

1. **Configure Supabase** for full real-time functionality
2. **Test the real-time features** using multiple browser tabs
3. **Customize notifications** in the toast handlers if needed
4. **Deploy to production** with environment variables configured

Your dashboard is now a **live representation** of your database! 🎉

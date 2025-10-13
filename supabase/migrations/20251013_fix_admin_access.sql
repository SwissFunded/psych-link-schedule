-- Drop the restrictive policy
drop policy if exists "Users can view their own bookings" on public.bookings;

-- Create a new policy that allows anyone to view all bookings
-- (Admin authentication is handled at the application level)
create policy "Allow read access to bookings"
  on public.bookings for select
  using (true);

-- Comment on the policy
comment on policy "Allow read access to bookings" on public.bookings is 
  'Allows public read access to bookings table. Admin authentication is handled at application level via AdminAuthContext.';


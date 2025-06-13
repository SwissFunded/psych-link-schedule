-- Create the bookings table in Supabase
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    patient_email TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT,
    vitabyte_patient_id INTEGER,
    treater_name TEXT,
    treater_id INTEGER,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type TEXT NOT NULL,
    duration INTEGER DEFAULT 50 NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending_admin_review' NOT NULL CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no-show', 'pending_admin_review', 'pending_cancellation', 'pending_reschedule')),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_patient_email ON public.bookings(patient_email);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_vitabyte_patient_id ON public.bookings(vitabyte_patient_id);
CREATE INDEX IF NOT EXISTS idx_bookings_metadata ON public.bookings USING GIN (metadata);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for authenticated users
-- Note: In production, you'd want more restrictive policies
CREATE POLICY "Enable all access for authenticated users" ON public.bookings
    FOR ALL USING (auth.role() = 'authenticated');

-- If the table already exists, add the new columns
DO $$ 
BEGIN
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'metadata') THEN
        ALTER TABLE public.bookings ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        CREATE INDEX IF NOT EXISTS idx_bookings_metadata ON public.bookings USING GIN (metadata);
    END IF;
    
    -- Update status constraint to include new statuses
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('scheduled', 'cancelled', 'completed', 'no-show', 'pending_admin_review', 'pending_cancellation', 'pending_reschedule'));
        
    -- Update default status
    ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending_admin_review';
END $$;

-- Insert some test data (optional - remove this if you don't want test data)
INSERT INTO public.bookings (
    patient_email,
    patient_name,
    patient_phone,
    appointment_date,
    appointment_time,
    appointment_type,
    duration,
    notes,
    status,
    metadata
) VALUES 
(
    'miromw@icloud.com',
    'Miró Waltisberg',
    '+41 76 123 45 67',
    '2024-12-27',
    '10:00',
    'consultation',
    50,
    'Erstes Beratungsgespräch',
    'pending_admin_review',
    '{"source": "test_data"}'::jsonb
),
(
    'elena.pellizzon@psychcentral.ch',
    'Elena Pellizon',
    '+41 76 987 65 43',
    '2024-12-28',
    '14:30',
    'therapy',
    50,
    'Therapiesitzung',
    'pending_admin_review',
    '{"source": "test_data"}'::jsonb
)
ON CONFLICT (id) DO NOTHING; 
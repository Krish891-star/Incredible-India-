import '@testing-library/jest-dom';
import 'whatwg-fetch';

// Mock environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://sbiwcdlahwuihheqsafh.supabase.co';
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiaXdjZGxhaHd1aWhoZXFzYWZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyODg0MDUsImV4cCI6MjA4MTg2NDQwNX0.Ejt1EF14Vjhtx_9iZ8Nc4uI-ZryxLfJAFrCa09ZUZVI';
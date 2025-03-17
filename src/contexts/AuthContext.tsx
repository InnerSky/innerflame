import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { getCurrentUser, signIn, signOut, signUp, signInWithGoogle, AuthError } from '../lib/auth';
import { supabase } from '../lib/supabase';

// ... existing code ... 
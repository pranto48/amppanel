import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base32Encode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Generate a random secret for TOTP
function generateSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes).replace(/=/g, '');
}

// Base32 decode
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, '');
  
  let bits = '';
  for (const char of cleanedInput) {
    const val = alphabet.indexOf(char);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  
  return bytes;
}

// HMAC-SHA1 for TOTP
async function hmacSha1(key: Uint8Array, message: Uint8Array, digits: number): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message.buffer as ArrayBuffer);
  const hash = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = hash[hash.length - 1] & 0x0f;
  const binary = 
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  
  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, '0');
}

// Verify TOTP code with time window tolerance
async function verifyTOTP(secret: string, code: string, window = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const time = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(time), false);
    
    const secretBytes = base32Decode(secret);
    const expectedCode = await hmacSha1(secretBytes, new Uint8Array(timeBuffer), 6);
    
    if (expectedCode === code) {
      return true;
    }
  }
  return false;
}

// Generate backup codes
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4, 8));
  }
  return codes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, code } = await req.json();
    console.log(`2FA action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'setup': {
        // Generate new secret and backup codes
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        const email = user.email || 'user';
        const issuer = 'AmpPanel';
        
        // Create otpauth URL for QR code
        const otpauthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
        
        // Store secret (not enabled yet until verified)
        const { error: upsertError } = await supabaseClient
          .from('user_2fa')
          .upsert({
            user_id: user.id,
            secret: secret,
            backup_codes: backupCodes,
            is_enabled: false,
          }, { onConflict: 'user_id' });
        
        if (upsertError) {
          console.error('Error storing 2FA secret:', upsertError);
          throw upsertError;
        }
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            secret,
            otpauthUrl,
            backupCodes
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'verify': {
        // Verify code and enable 2FA
        if (!code || code.length !== 6) {
          return new Response(
            JSON.stringify({ error: 'Invalid code format' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: twoFaData, error: fetchError } = await supabaseClient
          .from('user_2fa')
          .select('secret')
          .eq('user_id', user.id)
          .single();
        
        if (fetchError || !twoFaData) {
          return new Response(
            JSON.stringify({ error: '2FA not set up' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const isValid = await verifyTOTP(twoFaData.secret, code);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code', valid: false }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Enable 2FA
        await supabaseClient
          .from('user_2fa')
          .update({ is_enabled: true })
          .eq('user_id', user.id);
        
        return new Response(
          JSON.stringify({ success: true, valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'validate': {
        // Validate code during login
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Code required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: twoFaData, error: fetchError } = await supabaseClient
          .from('user_2fa')
          .select('secret, backup_codes, is_enabled')
          .eq('user_id', user.id)
          .single();
        
        if (fetchError || !twoFaData || !twoFaData.is_enabled) {
          return new Response(
            JSON.stringify({ valid: true, required: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Check TOTP code
        let isValid = await verifyTOTP(twoFaData.secret, code);
        
        // Check backup codes if TOTP fails
        if (!isValid && twoFaData.backup_codes) {
          const normalizedCode = code.toUpperCase().replace(/-/g, '');
          const backupIndex = twoFaData.backup_codes.findIndex(
            (bc: string) => bc.replace(/-/g, '') === normalizedCode
          );
          
          if (backupIndex !== -1) {
            isValid = true;
            // Remove used backup code
            const newBackupCodes = [...twoFaData.backup_codes];
            newBackupCodes.splice(backupIndex, 1);
            
            await supabaseClient
              .from('user_2fa')
              .update({ backup_codes: newBackupCodes })
              .eq('user_id', user.id);
          }
        }
        
        return new Response(
          JSON.stringify({ valid: isValid }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'status': {
        // Check if 2FA is enabled
        const { data: twoFaData } = await supabaseClient
          .from('user_2fa')
          .select('is_enabled')
          .eq('user_id', user.id)
          .single();
        
        return new Response(
          JSON.stringify({ 
            enabled: twoFaData?.is_enabled || false
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      case 'disable': {
        // Disable 2FA (requires valid code)
        if (!code) {
          return new Response(
            JSON.stringify({ error: 'Code required to disable 2FA' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const { data: twoFaData } = await supabaseClient
          .from('user_2fa')
          .select('secret')
          .eq('user_id', user.id)
          .single();
        
        if (!twoFaData) {
          return new Response(
            JSON.stringify({ error: '2FA not enabled' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const isValid = await verifyTOTP(twoFaData.secret, code);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid code' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        await supabaseClient
          .from('user_2fa')
          .delete()
          .eq('user_id', user.id);
        
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('TOTP error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

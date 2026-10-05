import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, Loader2, AlertCircle, CheckCircle2, Copy, Download, Key, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logActivity } from '@/utils/activityLog';

// Send security notification email
const sendSecurityNotification = async (action: 'regenerated' | 'enabled' | 'disabled') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    await supabase.functions.invoke('backup-codes-notification', {
      body: {
        email: user.email,
        userName: profile?.name || user.email,
        action,
      },
    });
  } catch (error) {
    console.error('Failed to send security notification:', error);
    // Don't throw - notification failure shouldn't block the main action
  }
};

interface TwoFactorAuthProps {
  onStatusChange?: (enabled: boolean) => void;
}

type Step = 'idle' | 'enroll' | 'verify' | 'show-backup-codes' | 'unenroll' | 'view-backup-codes' | 'regenerate-backup-codes';

// Generate random backup codes
const generateBackupCodes = (): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = Array.from({ length: 8 }, () => 
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');
    codes.push(code);
  }
  return codes;
};

// Simple hash function for backup codes (SHA-256)
const hashCode = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const TwoFactorAuth = ({ onStatusChange }: TwoFactorAuthProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState<Step>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [hasBackupCodes, setHasBackupCodes] = useState(false);
  const [unusedCodesCount, setUnusedCodesCount] = useState(0);

  // Check if 2FA is already enabled
  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('Error checking MFA status:', error);
        return;
      }

      const verifiedFactors = data.totp.filter(factor => factor.status === 'verified');
      setIsEnabled(verifiedFactors.length > 0);
      
      if (verifiedFactors.length > 0) {
        setFactorId(verifiedFactors[0].id);
        await checkBackupCodesStatus();
      }
    } catch (err) {
      console.error('Error checking MFA status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBackupCodesStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('mfa_backup_codes')
      .select('id, used_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error checking backup codes:', error);
      return;
    }

    setHasBackupCodes(data && data.length > 0);
    setUnusedCodesCount(data?.filter(code => !code.used_at).length || 0);
  };

  const saveBackupCodes = async (codes: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete existing backup codes
    await supabase
      .from('mfa_backup_codes')
      .delete()
      .eq('user_id', user.id);

    // Hash and save new codes
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        user_id: user.id,
        code_hash: await hashCode(code),
      }))
    );

    const { error } = await supabase
      .from('mfa_backup_codes')
      .insert(hashedCodes);

    if (error) throw error;
  };

  const handleEnroll = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('verify');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start 2FA enrollment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyEnrollment = async () => {
    if (verifyCode.length !== 6 || !factorId) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Generate and save backup codes
      const codes = generateBackupCodes();
      await saveBackupCodes(codes);
      setBackupCodes(codes);

      setIsEnabled(true);
      onStatusChange?.(true);
      setStep('show-backup-codes');
    } catch (err: any) {
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteEnrollment = () => {
    toast.success('Two-factor authentication enabled successfully!');
    sendSecurityNotification('enabled');
    logActivity({ eventType: '2fa_enabled', description: 'Zwei-Faktor-Authentifizierung wurde aktiviert' });
    handleCloseModal();
    checkBackupCodesStatus();
  };

  const handleStartUnenroll = async () => {
    setStep('unenroll');
    setVerifyCode('');
    setError(null);

    if (!factorId) {
      // Get the factor ID if not already set
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp?.[0]) {
        setFactorId(data.totp[0].id);
      }
    }

    // Create a challenge for verification before unenroll
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId!,
      });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      setChallengeId(challengeData.id);
    } catch (err: any) {
      setError(err.message || 'Failed to start verification');
    }
  };

  const handleVerifyAndUnenroll = async () => {
    if (verifyCode.length !== 6 || !factorId || !challengeId) return;

    try {
      setIsProcessing(true);
      setError(null);

      // First verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Delete backup codes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('mfa_backup_codes')
          .delete()
          .eq('user_id', user.id);
      }

      // Now unenroll
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (unenrollError) {
        setError(unenrollError.message);
        return;
      }

      setIsEnabled(false);
      setFactorId(null);
      setHasBackupCodes(false);
      setUnusedCodesCount(0);
      onStatusChange?.(false);
      sendSecurityNotification('disabled');
      logActivity({ eventType: '2fa_disabled', description: 'Zwei-Faktor-Authentifizierung wurde deaktiviert' });
      toast.success('Two-factor authentication disabled');
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewBackupCodes = async () => {
    setStep('view-backup-codes');
    setIsModalOpen(true);
    setError(null);
  };

  const handleRegenerateBackupCodes = async () => {
    setStep('regenerate-backup-codes');
    setVerifyCode('');
    setError(null);
    setIsModalOpen(true);

    if (!factorId) {
      const { data } = await supabase.auth.mfa.listFactors();
      if (data?.totp?.[0]) {
        setFactorId(data.totp[0].id);
      }
    }

    // Create a challenge for verification
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId!,
      });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      setChallengeId(challengeData.id);
    } catch (err: any) {
      setError(err.message || 'Failed to start verification');
    }
  };

  const handleVerifyAndRegenerate = async () => {
    if (verifyCode.length !== 6 || !factorId || !challengeId) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      // Generate and save new backup codes
      const codes = generateBackupCodes();
      await saveBackupCodes(codes);
      setBackupCodes(codes);
      setStep('show-backup-codes');
      sendSecurityNotification('regenerated');
      logActivity({ eventType: 'backup_codes_regenerated', description: 'Backup-Codes wurden neu generiert' });
      toast.success('New backup codes generated');
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate codes');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setError(null);
    setVerifyCode('');
    setBackupCodes([]);
    
    if (isEnabled) {
      handleStartUnenroll();
    } else {
      setStep('enroll');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setStep('idle');
    setQrCode(null);
    setSecret(null);
    setVerifyCode('');
    setError(null);
    setChallengeId(null);
    setBackupCodes([]);
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast.success('Backup codes copied to clipboard');
  };

  const downloadBackupCodes = () => {
    const codesText = `2FA Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n')}\n\nEach code can only be used once. Store these codes in a safe place.`;
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2fa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <ShieldCheck className="h-5 w-5 text-foreground" />
            ) : (
              <ShieldOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled ? 'Enabled - Your account is protected' : 'Add an extra layer of security'}
              </p>
            </div>
          </div>
          <Button
            variant={isEnabled ? 'outline' : 'default'}
            size="sm"
            onClick={handleOpenModal}
            className={isEnabled ? 'border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground' : ''}
          >
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>

        {/* Backup Codes Section */}
        {isEnabled && (
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Backup Codes</p>
                <p className="text-sm text-muted-foreground">
                  {hasBackupCodes 
                    ? `${unusedCodesCount} unused codes remaining`
                    : 'No backup codes generated'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateBackupCodes}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-display text-xl flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {step === 'show-backup-codes' ? 'BACKUP CODES' : 
               step === 'view-backup-codes' ? 'VIEW BACKUP CODES' :
               step === 'regenerate-backup-codes' ? 'REGENERATE BACKUP CODES' :
               isEnabled ? 'DISABLE 2FA' : 'ENABLE 2FA'}
            </DialogTitle>
            <DialogDescription>
              {step === 'enroll' && 'Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)'}
              {step === 'verify' && 'Enter the 6-digit code from your authenticator app to complete setup'}
              {step === 'show-backup-codes' && 'Save these backup codes in a safe place. Each code can only be used once.'}
              {step === 'view-backup-codes' && 'Your backup codes are stored securely. You can regenerate new codes if needed.'}
              {step === 'regenerate-backup-codes' && 'Enter your 2FA code to generate new backup codes. This will invalidate all existing codes.'}
              {step === 'unenroll' && 'Enter your 2FA code to confirm disabling two-factor authentication'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Step: Enroll - Show button to start */}
            {step === 'enroll' && !qrCode && (
              <div className="text-center space-y-4">
                <div className="p-6 bg-secondary/30 rounded-lg">
                  <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                  </p>
                </div>
                <Button 
                  onClick={handleEnroll} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Set Up Authenticator App
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step: Verify enrollment - Show QR code and input */}
            {step === 'verify' && qrCode && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img 
                      src={qrCode} 
                      alt="QR Code for 2FA" 
                      className="w-48 h-48"
                    />
                  </div>
                </div>

                {secret && (
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Can't scan? Enter this code manually:</p>
                    <code className="text-xs bg-secondary px-2 py-1 rounded font-mono select-all">
                      {secret}
                    </code>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium block text-center">Enter verification code</label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={verifyCode}
                      onChange={setVerifyCode}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyEnrollment}
                  disabled={verifyCode.length !== 6 || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verify & Enable
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step: Show backup codes after enrollment */}
            {step === 'show-backup-codes' && backupCodes.length > 0 && (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Important</p>
                      <p className="text-sm text-muted-foreground">
                        Save these codes now. You won't be able to see them again. Use these if you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 p-4 bg-secondary/30 rounded-lg font-mono text-sm">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="p-2 bg-background rounded text-center">
                      {code}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={copyBackupCodes}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button 
                  onClick={handleCompleteEnrollment}
                  className="w-full"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I've Saved My Codes
                </Button>
              </div>
            )}

            {/* Step: View backup codes info */}
            {step === 'view-backup-codes' && (
              <div className="space-y-4 text-center">
                <div className="p-6 bg-secondary/30 rounded-lg">
                  <Key className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    For security reasons, we cannot show your existing backup codes. If you need new codes, click "Regenerate" to create a new set. This will invalidate all previous codes.
                  </p>
                </div>
                <p className="text-sm">
                  <strong>{unusedCodesCount}</strong> unused codes remaining
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('regenerate-backup-codes');
                      handleRegenerateBackupCodes();
                    }}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Regenerate backup codes - verify first */}
            {step === 'regenerate-backup-codes' && (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Warning</p>
                      <p className="text-sm text-muted-foreground">
                        Generating new codes will invalidate all your existing backup codes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block text-center">Enter your 2FA code to confirm</label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={verifyCode}
                      onChange={setVerifyCode}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyAndRegenerate}
                  disabled={verifyCode.length !== 6 || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate New Codes
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step: Unenroll - Verify and disable */}
            {step === 'unenroll' && (
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Warning</p>
                      <p className="text-sm text-muted-foreground">
                        Disabling 2FA will make your account less secure. You'll only need your password to sign in. All backup codes will also be deleted.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium block text-center">Enter your 2FA code to confirm</label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={verifyCode}
                      onChange={setVerifyCode}
                      maxLength={6}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                <Button 
                  onClick={handleVerifyAndUnenroll}
                  disabled={verifyCode.length !== 6 || isProcessing}
                  variant="destructive"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Disabling...
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-4 w-4 mr-2" />
                      Disable Two-Factor Authentication
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

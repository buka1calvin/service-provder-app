import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Search,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Fingerprint,
  Globe,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';


export default function TokenVerificationTester() {
  const [token, setToken] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showToken, setShowToken] = useState(false);

  const ENDPOINT = 'http://bkyz2-fmaaa-aaaaa-qaaaq-cai.raw.localhost:4943/biometric/verify';

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setError('Please enter a valid access token');
      return;
    }

    if (!serviceName.trim()) {
      setError('Please enter a service name');
      return;
    }

    setIsLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: token.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add service info to the result
        setVerificationResult({
          ...data,
          requestedService: serviceName.trim(),
          verificationTime: new Date().toISOString(),
        });
      } else {
        setError(data.message || 'Token verification failed');
      }
    } catch (err:any) {
      const errorMessage = err.message || 'Verification request failed';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text:any) => {
    navigator.clipboard.writeText(text);
  };

  const clearForm = () => {
    setToken('');
    setServiceName('');
    setVerificationResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Digital Identity Token Verifier
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Test and verify access tokens for digital identity services. Enter your token and service details to authenticate and retrieve user information.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-6">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <Search className="w-6 h-6 text-blue-600" />
                Token Verification Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">
                  Access Token *
                </Label>
                <div className="relative">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your access token here..."
                    className="pr-12 font-mono text-sm border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowToken(!showToken)}
                      className="h-8 w-8 p-0 hover:bg-slate-100"
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4 text-slate-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold text-slate-700">
                  Service Name *
                </Label>
                <Input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g., Government Services, Banking Portal, Healthcare System"
                  className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <p className="text-xs text-slate-500">
                  Enter the name of the service requesting token verification
                </p>
              </div>

              <Separator className="bg-slate-100" />

              <div className="flex gap-3">
                <Button
                  onClick={handleVerifyToken}
                  disabled={isLoading || !token.trim() || !serviceName.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3 transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verify Token
                    </>
                  )}
                </Button>
                <Button
                  onClick={clearForm}
                  variant="outline"
                  className="px-6 border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Clear
                </Button>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Display */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="border-b border-slate-100 pb-6">
              <CardTitle className="flex items-center gap-3 text-slate-800">
                <User className="w-6 h-6 text-green-600" />
                Verification Results
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!verificationResult && !isLoading && (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full">
                    <Fingerprint className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-500">
                    Enter a token and service name to begin verification
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-slate-600">
                    Verifying your token...
                  </p>
                </div>
              )}

              {verificationResult && (
                <div className="space-y-6">
                  {/* Success Header */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-green-800">Token Verified Successfully</h3>
                      <p className="text-sm text-green-600">Access granted for {verificationResult.requestedService}</p>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      User Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Full Name</span>
                        <span className="text-sm text-slate-900 font-semibold">
                          {verificationResult.userInfo?.firstName} {verificationResult.userInfo?.lastName}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Digital ID</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {verificationResult.digitalId}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(verificationResult.digitalId)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {verificationResult.userInfo?.email && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email
                          </span>
                          <span className="text-sm text-slate-900">
                            {verificationResult.userInfo.email}
                          </span>
                        </div>
                      )}

                      {verificationResult.userInfo?.phone && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone
                          </span>
                          <span className="text-sm text-slate-900">
                            {verificationResult.userInfo.phone}
                          </span>
                        </div>
                      )}

                      {verificationResult.userInfo?.nationality && (
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Nationality
                          </span>
                          <span className="text-sm text-slate-900">
                            {verificationResult.userInfo.nationality}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Token Information */}
                  <Separator className="bg-slate-100" />
                  <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      Token Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Token Expiry
                        </span>
                        <span className="text-sm text-slate-900">
                          {verificationResult.tokenExpiry 
                            ? new Date(verificationResult.tokenExpiry).toLocaleString()
                            : 'N/A'
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Verified At
                        </span>
                        <span className="text-sm text-slate-900">
                          {new Date(verificationResult.verificationTime).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Requested Service</span>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                          {verificationResult.requestedService}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Security Status */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-800">Security Status</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Token successfully authenticated. User identity verified and service access granted.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Security Notice</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This verification service validates digital identity tokens for authorized services. 
                  Tokens contain sensitive user information and should only be used by legitimate service providers. 
                  Never share your access tokens with unauthorized parties.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
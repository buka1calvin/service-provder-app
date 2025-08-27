/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";

import {
  Shield,
  Search,
  User,
  CheckCircle,
  XCircle,
  Copy,
  Fingerprint,
  Globe,
  Mail,
  Phone,
  Loader2,
  Eye,
  EyeOff,
  Camera,
  Settings,
  Activity,
  ArrowRight,
  Timer,
  Scan,
  AlertCircle,
} from "lucide-react";

export default function EnhancedTokenVerifier() {
  const [token, setToken] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<
    "image" | "both"
  >("image");
  const [biometricStep, setBiometricStep] = useState<
    "select" | "pending" | "processing" | "completed"
  >("select");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [storedImageUrl, setStoredImageUrl] = useState<string>("");
  const [availableMethods, setAvailableMethods] = useState<any>(null);
  const [biometricHash, setBiometricHash] = useState("");
  const [tokenValidated, setTokenValidated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(300); // 5 minutes countdown
  const [pollAttempts, setPollAttempts] = useState<number>(0);

  const VERIFY_ENDPOINT =
    "http://bkyz2-fmaaa-aaaaa-qaaaq-cai.raw.localhost:4943/biometric/verify-token";
  const START_BIOMETRIC_ENDPOINT =
    "http://bkyz2-fmaaa-aaaaa-qaaaq-cai.raw.localhost:4943/biometric/complete-verify";
    const POLLING_RESULT_ENDPOINT =
    "http://bkyz2-fmaaa-aaaaa-qaaaq-cai.raw.localhost:4943/biometric/latest-result";

  // Auto-validate token when it changes and meets minimum length
  useEffect(() => {
    const validateToken = async () => {
      if (token.trim().length < 10) {
        setTokenValidated(false);
        setUserInfo(null);
        setBiometricHash("");
        setStoredImageUrl("");
        setAvailableMethods(null);
        setBiometricStep("select");
        return;
      }

      setIsTokenValidating(true);
      setError("");

      try {
        const response = await fetch(VERIFY_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: token.trim(),
            service: serviceName.trim() || "General Access",
          }),
        });

        const data = await response.json();

        if (data.success) {
          setBiometricHash(data.biometricHash);
          setStoredImageUrl(data.storedImageUrl);
          setAvailableMethods(data.availableMethods);
          setTokenValidated(true);
          setUserInfo(data.userInfo);
          setError("");
          setBiometricStep("select");
        } else {
          setTokenValidated(false);
          setUserInfo(null);
          setError(data.message || "Token validation failed");
          setBiometricStep("select");
        }
      } catch (err: any) {
        setTokenValidated(false);
        setUserInfo(null);
        setError(err.message || "Token validation request failed");
        setBiometricStep("select");
      } finally {
        setIsTokenValidating(false);
      }
    };

    const debounceTimer = setTimeout(validateToken, 500);
    return () => clearTimeout(debounceTimer);
  }, [token, serviceName]);

  // Countdown timer for biometric session timeout
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (biometricStep === "pending" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setBiometricStep("select");
            setError("Biometric session expired. Please try again.");
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [biometricStep, countdown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartBiometric = async () => {
    if (!tokenValidated) {
      setError("Please enter a valid token first");
      return;
    }

    setIsLoading(true);
    setError("");
    setPollAttempts(0);
    setBiometricStep("pending");

    try {
      // Call backend to start biometric verification (sets up webhook listener)
      const result = await fetch(START_BIOMETRIC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          biometricHash: biometricHash,
          service: serviceName.trim() || "General Access",
          method: selectedMethod,
        }),
      });

      const data = await result.json();

      if (data.success) {
        setCountdown(300); // Reset countdown
        
        // Start polling for results after a short delay
        setTimeout(async () => {
          setBiometricStep("processing");
          try {
            // Use the same polling logic as login
            const verificationResult = await new Promise<any>((resolve, reject) => {
              let pollCount = 0;
              
              const poll = setInterval(async () => {
                try {
                  pollCount++;
                  setPollAttempts(pollCount);
                  
                  const response = await fetch(POLLING_RESULT_ENDPOINT);
                  const pollingData = await response.json();
                  
                  if (pollingData.status === "completed") {
                    clearInterval(poll);
                    
                    if (pollingData.success) {
                      resolve(pollingData);
                    } else {
                      reject(new Error(pollingData.message));
                    }
                  } else if (pollingData.status === "expired") {
                    clearInterval(poll);
                    reject(new Error("Operation expired. Please try again."));
                  }
                  // Continue polling if status is "pending"
                } catch (error: any) {
                  clearInterval(poll);
                  reject(
                    new Error(
                      error.response?.data?.message || error.message || "Network error"
                    )
                  );
                }
              }, 2000);
            });

            if (verificationResult.success) {
              setVerificationResult({
                ...verificationResult,
                requestedService: serviceName.trim() || "General Access",
                verificationTime: new Date().toISOString(),
              });
              setBiometricStep("completed");
            }
          } catch (error: any) {
            setBiometricStep("select");
            setError(error.message || "Biometric verification failed");
          }
        }, 2000); // Give user time to see the pending state
      } else {
        setBiometricStep("select");
        setError(data.message || "Failed to start biometric verification");
      }
    } catch (err: any) {
      setBiometricStep("select");
      setError(err.message || "Biometric verification request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(text);
  };

  const clearForm = () => {
    setToken("");
    setServiceName("");
    setVerificationResult(null);
    setError("");
    setStoredImageUrl("");
    setAvailableMethods(null);
    setBiometricHash("");
    setTokenValidated(false);
    setUserInfo(null);
    setBiometricStep("select");
    setCountdown(300);
    setPollAttempts(0);
  };

  const getServiceTypeColor = (service: string) => {
    const lowerService = service.toLowerCase();
    if (lowerService.includes("government"))
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (lowerService.includes("bank") || lowerService.includes("finance"))
      return "bg-green-50 text-green-700 border-green-200";
    if (lowerService.includes("health"))
      return "bg-red-50 text-red-700 border-red-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const linkedInFontStyle = {
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Open Sans","Helvetica Neue",sans-serif',
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Choose your verification method:
        </p>
      </div>

      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          selectedMethod === "image" ? "border-blue-600 bg-blue-50" : "border-gray-200"
        }`}
        onClick={() => setSelectedMethod("image")}
      >
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5" />
          <div>
            <h5 className="font-medium">Image Only</h5>
            <p className="text-sm text-gray-600">Facial recognition verification</p>
          </div>
        </div>
      </div>

      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
          selectedMethod === "both" ? "border-blue-600 bg-blue-50" : "border-gray-200"
        }`}
        onClick={() => setSelectedMethod("both")}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Camera className="w-4 h-4" />
            <Fingerprint className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-medium">Image + Fingerprint</h5>
            <p className="text-sm text-gray-600">Enhanced security with both methods</p>
          </div>
        </div>
      </div>

      <button
        onClick={handleStartBiometric}
        disabled={isLoading || !tokenValidated}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 h-12 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Starting Verification...
          </>
        ) : (
          <>
            Start Verification with {selectedMethod === "both" ? "Both Methods" : "Image Only"}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );

  const renderPendingBiometric = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto">
            <Scan className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Go to Biometric Scanner
          </h4>
          <p className="text-sm text-gray-600">
            Please proceed to the scanner for {selectedMethod === "both" ? "image and fingerprint" : "image"} verification
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">Verification Session Active</span>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            Ready
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">Time remaining:</span>
          <div className="flex items-center gap-1 text-blue-800 font-mono">
            <Timer className="w-3 h-3" />
            {formatTime(countdown)}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700">Verification method:</span>
          <div className="flex items-center gap-1 text-blue-800">
            {selectedMethod === "both" ? (
              <>
                <Camera className="w-3 h-3" />
                <Fingerprint className="w-3 h-3" />
                <span className="text-xs">Both</span>
              </>
            ) : (
              <>
                <Camera className="w-3 h-3" />
                <span className="text-xs">Image</span>
              </>
            )}
          </div>
        </div>
        
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${(countdown / 300) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-yellow-800">Instructions:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Look directly at the camera for facial recognition</li>
              {selectedMethod === "both" && (
                <li>• Place your finger on the fingerprint scanner</li>
              )}
              <li>• Keep steady until verification completes</li>
              <li>• Results will appear automatically upon completion</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          setBiometricStep("select");
          setCountdown(300);
        }}
        className="w-full px-6 h-12 border text-gray-700 font-medium transition-colors hover:bg-gray-50"
        style={{
          ...linkedInFontStyle,
          borderColor: "#d9d9d9",
          borderRadius: "24px",
          backgroundColor: "transparent",
        }}
      >
        Cancel Verification
      </button>
    </div>
  );

  const renderProcessingBiometric = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
          </div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-green-200 rounded-full animate-ping mx-auto"></div>
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Verification...
          </h4>
          <p className="text-sm text-gray-600">
            Verifying your {selectedMethod === "both" ? "image and fingerprint" : "image"} data
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-900">
              {selectedMethod === "both" ? "Biometric Data Captured" : "Image Data Captured"}
            </p>
            <p className="text-sm text-green-700">
              Authenticating your identity...
            </p>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Secure processing in progress</span>
          </div>
          <div className="flex items-center gap-1">
            {selectedMethod === "both" ? (
              <>
                <Camera className="w-3 h-3 text-green-600" />
                <Fingerprint className="w-3 h-3 text-green-600" />
              </>
            ) : (
              <Camera className="w-3 h-3 text-green-600" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700">Processing attempts:</span>
            <span className="text-blue-800 font-mono">{pollAttempts}/150</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((pollAttempts / 150) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-blue-600 text-center">
            Verification method: {selectedMethod === "both" ? "Image + Fingerprint" : "Image Only"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: "#f3f2ef" }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-lg"
            style={{ backgroundColor: "#0a66c2" }}
          >
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1
            className="text-2xl font-normal text-gray-900"
            style={linkedInFontStyle}
          >
            Enhanced Token Verification System
          </h1>
          <p
            className="text-gray-600 text-base max-w-2xl mx-auto"
            style={linkedInFontStyle}
          >
            Secure token verification with automated biometric authentication
            for all services.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Input Form */}
          <div className="bg-white shadow-lg" style={{ borderRadius: "8px" }}>
            <div className="border-b border-gray-200 px-6 py-4">
              <div
                className="flex items-center gap-3 text-gray-900"
                style={linkedInFontStyle}
              >
                <Search className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-normal">Service Access Request</h2>
              </div>
            </div>
            <div className="space-y-6 px-6 py-6">

              <div
                className={`flex w-full ${
                  tokenValidated ? "flex-col lg:flex-row gap-6" : "flex-col"
                }`}
              >
                <div className={`${tokenValidated ? "lg:w-1/2" : "w-full"}`}>
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium text-gray-900 block"
                      style={linkedInFontStyle}
                    >
                      Access Token *
                    </label>
                    <div className="relative">
                      <input
                        type={showToken ? "text" : "password"}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Enter your access token here..."
                        className="w-full pr-12 px-3 py-3 border text-sm font-mono transition-colors focus:outline-none focus:border-blue-500"
                        style={{
                          ...linkedInFontStyle,
                          borderColor: tokenValidated
                            ? "#22c55e"
                            : isTokenValidating
                            ? "#f59e0b"
                            : "#d9d9d9",
                          borderRadius: "2px",
                        }}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {isTokenValidating && (
                          <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                        )}
                        {tokenValidated && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                          style={{ borderRadius: "4px" }}
                        >
                          {showToken ? (
                            <EyeOff className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </div>
                    </div>
                    {tokenValidated && userInfo && (
                      <p
                        className="text-xs text-green-600 flex items-center gap-1"
                        style={linkedInFontStyle}
                      >
                        <CheckCircle className="w-3 h-3" />
                        Token validated for {userInfo.firstName}{" "}
                        {userInfo.lastName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mt-4">
                    <label
                      className="text-sm font-medium text-gray-900 block"
                      style={linkedInFontStyle}
                    >
                      Service Name
                    </label>
                    <input
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="e.g., Government Services, Banking Portal, Healthcare System"
                      className="w-full px-3 py-3 border text-sm transition-colors focus:outline-none focus:border-blue-500"
                      style={{
                        ...linkedInFontStyle,
                        borderColor: "#d9d9d9",
                        borderRadius: "2px",
                      }}
                    />
                  </div>
                </div>

                {tokenValidated && availableMethods && (
                  <div
                    className={`${tokenValidated ? "lg:w-1/2" : "w-full"} ${
                      tokenValidated ? "mt-6 lg:mt-0" : ""
                    }`}
                  >
                    <div className="w-full h-px bg-gray-200 mb-6 lg:hidden"></div>

                    <div className="space-y-4">
                      <div className="text-center pb-4 border-b border-gray-200">
                        <h3
                          className="text-lg font-normal text-gray-900 mb-2"
                          style={linkedInFontStyle}
                        >
                          Biometric Verification
                        </h3>
                      </div>

                      {biometricStep === "select" && renderMethodSelection()}
                      {biometricStep === "pending" && renderPendingBiometric()}
                      {biometricStep === "processing" && renderProcessingBiometric()}
                      {biometricStep === "completed" && (
                        <div className="text-center py-4">
                          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                          <p className="text-green-700 font-medium">Verification Complete!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="border bg-blue-50 p-3 flex items-start gap-2"
                style={{ borderRadius: "4px", borderColor: "#0a66c2" }}
              >
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-700 text-sm" style={linkedInFontStyle}>
                  <strong>Security Notice:</strong> Enter your token to
                  automatically validate and enable biometric verification for
                  secure service access.
                </p>
              </div>

              <div className="w-full h-px bg-gray-200"></div>

              <div className="flex gap-3">
                <button
                  onClick={clearForm}
                  className="flex-1 px-6 h-12 border text-gray-700 font-medium transition-colors hover:bg-gray-50"
                  style={{
                    ...linkedInFontStyle,
                    borderColor: "#d9d9d9",
                    borderRadius: "24px",
                    backgroundColor: "transparent",
                  }}
                >
                  Clear Form
                </button>
              </div>

              {error && (
                <div
                  className="border bg-red-50 p-3 flex items-start gap-2"
                  style={{ borderRadius: "4px", borderColor: "#dc2626" }}
                >
                  <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm" style={linkedInFontStyle}>
                    {error}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Results Display */}
          <div className="bg-white shadow-lg" style={{ borderRadius: "8px" }}>
            <div className="border-b border-gray-200 px-6 py-4">
              <div
                className="flex items-center gap-3 text-gray-900"
                style={linkedInFontStyle}
              >
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-normal">Verification Results</h2>
              </div>
            </div>
            <div className="px-6 py-6">
              {!verificationResult && !tokenValidated && !isLoading && (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg">
                    <Fingerprint className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500" style={linkedInFontStyle}>
                    Enter your access token to begin verification
                  </p>
                </div>
              )}

              {tokenValidated && userInfo && !verificationResult && (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-gray-600" style={linkedInFontStyle}>
                    Token validated for{" "}
                    <strong>
                      {userInfo.firstName} {userInfo.lastName}
                    </strong>
                    <br />
                    <span className="text-sm text-gray-500 mt-1 block">
                      Complete biometric verification to access the service
                    </span>
                  </p>
                </div>
              )}

              {verificationResult && (
                <div className="space-y-6">
                  {/* Success Header */}
                  <div
                    className="flex items-center gap-3 p-4 bg-green-50 border border-green-200"
                    style={{ borderRadius: "4px" }}
                  >
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <h3
                        className="font-medium text-green-800"
                        style={linkedInFontStyle}
                      >
                        Verification Successful
                      </h3>
                      <p
                        className="text-sm text-green-600"
                        style={linkedInFontStyle}
                      >
                        Access granted for {verificationResult.requestedService}
                        <span className="ml-2 inline-flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Biometric Verified
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Verification Details */}
                  {verificationResult.verificationDetails && (
                    <div
                      className="p-4 bg-blue-50 border border-blue-200"
                      style={{ borderRadius: "4px" }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span
                          className="font-medium text-blue-800"
                          style={linkedInFontStyle}
                        >
                          Verification Details
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span
                            className="text-blue-600"
                            style={linkedInFontStyle}
                          >
                            Method:
                          </span>
                          <div
                            className={`ml-2 inline-block px-2 py-1 text-xs border ${getServiceTypeColor(
                              ""
                            )}`}
                            style={{
                              borderRadius: "4px",
                              ...linkedInFontStyle,
                            }}
                          >
                            {verificationResult.verificationDetails.method === "image"
                              ? "Face Recognition"
                              : verificationResult.verificationDetails.method === "both"
                              ? "Multi-Factor"
                              : verificationResult.verificationDetails.method}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Information */}
                  <div className="space-y-4">
                    <h4
                      className="font-medium text-gray-900 flex items-center gap-2"
                      style={linkedInFontStyle}
                    >
                      <User className="w-5 h-5 text-gray-600" />
                      User Information
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50"
                        style={{ borderRadius: "4px" }}
                      >
                        <span
                          className="text-sm font-medium text-gray-600"
                          style={linkedInFontStyle}
                        >
                          Full Name
                        </span>
                        <span
                          className="text-sm text-gray-900 font-medium"
                          style={linkedInFontStyle}
                        >
                          {verificationResult.userInfo?.firstName}{" "}
                          {verificationResult.userInfo?.lastName}
                        </span>
                      </div>

                      <div
                        className="flex items-center justify-between p-3 bg-gray-50"
                        style={{ borderRadius: "4px" }}
                      >
                        <span
                          className="text-sm font-medium text-gray-600"
                          style={linkedInFontStyle}
                        >
                          Digital ID
                        </span>
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2 py-1 bg-white border font-mono text-xs"
                            style={{
                              borderRadius: "4px",
                              borderColor: "#d9d9d9",
                              ...linkedInFontStyle,
                            }}
                          >
                            {verificationResult.digitalId}
                          </div>
                          <button
                            onClick={() =>
                              copyToClipboard(verificationResult.digitalId)
                            }
                            className="h-6 w-6 p-0 hover:bg-gray-200 transition-colors"
                            style={{ borderRadius: "4px" }}
                          >
                            <Copy className="w-3 h-3 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {verificationResult.userInfo?.email && (
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50"
                          style={{ borderRadius: "4px" }}
                        >
                          <span
                            className="text-sm font-medium text-gray-600 flex items-center gap-2"
                            style={linkedInFontStyle}
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </span>
                          <span
                            className="text-sm text-gray-900"
                            style={linkedInFontStyle}
                          >
                            {verificationResult.userInfo.email}
                          </span>
                        </div>
                      )}

                      {verificationResult.userInfo?.phone && (
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50"
                          style={{ borderRadius: "4px" }}
                        >
                          <span
                            className="text-sm font-medium text-gray-600 flex items-center gap-2"
                            style={linkedInFontStyle}
                          >
                            <Phone className="w-4 h-4" />
                            Phone
                          </span>
                          <span
                            className="text-sm text-gray-900"
                            style={linkedInFontStyle}
                          >
                            {verificationResult.userInfo.phone}
                          </span>
                        </div>
                      )}

                      {verificationResult.userInfo?.nationality && (
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50"
                          style={{ borderRadius: "4px" }}
                        >
                          <span
                            className="text-sm font-medium text-gray-600 flex items-center gap-2"
                            style={linkedInFontStyle}
                          >
                            <Globe className="w-4 h-4" />
                            Nationality
                          </span>
                          <span
                            className="text-sm text-gray-900"
                            style={linkedInFontStyle}
                          >
                            {verificationResult.userInfo.nationality}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Service Information */}
                  <div className="w-full h-px bg-gray-200"></div>
                  <div className="space-y-4">
                    <h4
                      className="font-medium text-gray-900 flex items-center gap-2"
                      style={linkedInFontStyle}
                    >
                      <Settings className="w-5 h-5 text-gray-600" />
                      Service Access Details
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div
                        className="flex items-center justify-between p-3 bg-gray-50"
                        style={{ borderRadius: "4px" }}
                      >
                        <span
                          className="text-sm font-medium text-gray-600"
                          style={linkedInFontStyle}
                        >
                          Requested Service
                        </span>
                        <div
                          className={`px-2 py-1 text-xs border ${getServiceTypeColor(
                            verificationResult.requestedService
                          )}`}
                          style={{ borderRadius: "4px", ...linkedInFontStyle }}
                        >
                          {verificationResult.requestedService}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Tracking Notice */}
                  <div
                    className="p-4 bg-amber-50 border border-amber-200"
                    style={{ borderRadius: "4px" }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-amber-600" />
                      <span
                        className="font-medium text-amber-800"
                        style={linkedInFontStyle}
                      >
                        Activity Logged
                      </span>
                    </div>
                    <p
                      className="text-sm text-amber-700"
                      style={linkedInFontStyle}
                    >
                      This service access has been recorded in the user's
                      activity log for security and audit purposes. Service:{" "}
                      {verificationResult.requestedService} • Method:{" "}
                      {verificationResult.verificationDetails?.method}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
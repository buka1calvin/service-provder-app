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
} from "lucide-react";
import { BiometricCapture, ImageCapture } from "./biometric";
import { apiService } from "@/lib/api/verify";

export default function EnhancedTokenVerifier() {
  const [token, setToken] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<
    "biometric" | "image" | "both"
  >("biometric");
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValidating, setIsTokenValidating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [biometricData, setBiometricData] = useState({
    fingerprint: "",
    image: "",
  });
  const [storedImageUrl, setStoredImageUrl] = useState<string>("");
  const [availableMethods, setAvailableMethods] = useState<any>(null);
  const [biometricHash, setBiometricHash] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const VERIFY_ENDPOINT =
    "http://bkyz2-fmaaa-aaaaa-qaaaq-cai.raw.localhost:4943/biometric/verify-token";
  const COMPLETE_VERIFY_ENDPOINT =
    "http://bkyz2-fmaaa-aaaaa-qaaaq-cai.raw.localhost:4943/biometric/complete-verify";

  // Auto-validate token when it changes and meets minimum length
  useEffect(() => {
    const validateToken = async () => {
      if (token.trim().length < 10) {
        setTokenValidated(false);
        setUserInfo(null);
        setBiometricHash("");
        setStoredImageUrl("");
        setAvailableMethods(null);
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
        } else {
          setTokenValidated(false);
          setUserInfo(null);
          setError(data.message || "Token validation failed");
        }
      } catch (err: any) {
        setTokenValidated(false);
        setUserInfo(null);
        setError(err.message || "Token validation request failed");
      } finally {
        setIsTokenValidating(false);
      }
    };

    const debounceTimer = setTimeout(validateToken, 500);
    return () => clearTimeout(debounceTimer);
  }, [token, serviceName]);

  const handleCompleteVerification = async () => {
    if (!tokenValidated) {
      setError("Please enter a valid token first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let imageVerified = false;

      // Handle image verification if needed
      if (
        (selectedMethod === "image" || selectedMethod === "both") &&
        storedImageUrl &&
        biometricData.image
      ) {
        imageVerified = await apiService.compareImages(
          storedImageUrl,
          biometricData.image
        );

        if (!imageVerified) {
          setError("Face verification failed - images do not match");
          setIsLoading(false);
          return;
        }
      }

      // Validate biometric data based on method
      if (selectedMethod === "biometric" || selectedMethod === "both") {
        if (!biometricData.fingerprint) {
          setError("Fingerprint capture required");
          setIsLoading(false);
          return;
        }
      }

      if (selectedMethod === "image" || selectedMethod === "both") {
        if (!biometricData.image) {
          setError("Face capture required");
          setIsLoading(false);
          return;
        }
      }

      const requestBody: any = {
        biometricHash: biometricHash,
        service: serviceName.trim() || "General Access",
        method: selectedMethod,
        imageVerified: imageVerified,
      };

      if (selectedMethod === "biometric" || selectedMethod === "both") {
        requestBody.biometricData = biometricData.fingerprint;
      }

      const response = await fetch(COMPLETE_VERIFY_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult({
          ...data,
          requestedService: serviceName.trim() || "General Access",
          verificationTime: new Date().toISOString(),
        });
      } else {
        setError(data.message || "Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Verification request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricCapture = (data: string) => {
    setBiometricData((prev) => ({ ...prev, fingerprint: data }));
    setError("");
  };

  const handleImageCapture = (url: string) => {
    setBiometricData((prev) => ({ ...prev, image: url }));
    setError("");
  };

  const copyToClipboard = (text: any) => {
    navigator.clipboard.writeText(text);
  };

  const clearForm = () => {
    setToken("");
    setServiceName("");
    setVerificationResult(null);
    setError("");
    setBiometricData({ fingerprint: "", image: "" });
    setStoredImageUrl("");
    setAvailableMethods(null);
    setBiometricHash("");
    setTokenValidated(false);
    setUserInfo(null);
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

  const canVerify =
    tokenValidated &&
    ((selectedMethod === "biometric" && biometricData.fingerprint) ||
      (selectedMethod === "image" && biometricData.image) ||
      (selectedMethod === "both" &&
        biometricData.fingerprint &&
        biometricData.image));

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
            Secure token verification with mandatory biometric authentication
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
              {/* <div className="flex w-full">
                <div>
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

                  <div className="space-y-2">
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
                <div>
                  {tokenValidated && availableMethods && (
                    <>
                      <div className="w-full h-px bg-gray-200"></div>

                      <div className="space-y-4">
                        <div className="text-center pb-4 border-b border-gray-200">
                          <h3
                            className="text-lg font-normal text-gray-900 mb-2"
                            style={linkedInFontStyle}
                          >
                            Biometric Verification
                          </h3>
                          <p
                            className="text-sm text-gray-600"
                            style={linkedInFontStyle}
                          >
                            Complete biometric verification to access{" "}
                            {serviceName || "the service"}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h5
                            className="text-sm font-medium text-gray-900"
                            style={linkedInFontStyle}
                          >
                            Select Verification Method
                          </h5>
                          <div
                            className="flex flex-wrap gap-4 p-3 bg-gray-50"
                            style={{ borderRadius: "4px" }}
                          >
                            {availableMethods?.biometric && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="method"
                                  value="biometric"
                                  checked={selectedMethod === "biometric"}
                                  onChange={(e) =>
                                    setSelectedMethod(
                                      e.target.value as "biometric"
                                    )
                                  }
                                  className="w-4 h-4"
                                  style={{ accentColor: "#0a66c2" }}
                                />
                                <div className="flex items-center gap-1">
                                  <Fingerprint className="w-4 h-4 text-gray-600" />
                                  <span
                                    className="text-sm font-normal text-gray-900"
                                    style={linkedInFontStyle}
                                  >
                                    Fingerprint
                                  </span>
                                </div>
                              </label>
                            )}

                            {availableMethods?.image && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="method"
                                  value="image"
                                  checked={selectedMethod === "image"}
                                  onChange={(e) =>
                                    setSelectedMethod(e.target.value as "image")
                                  }
                                  className="w-4 h-4"
                                  style={{ accentColor: "#0a66c2" }}
                                />
                                <div className="flex items-center gap-1">
                                  <Camera className="w-4 h-4 text-gray-600" />
                                  <span
                                    className="text-sm font-normal text-gray-900"
                                    style={linkedInFontStyle}
                                  >
                                    Face
                                  </span>
                                </div>
                              </label>
                            )}

                            {availableMethods?.biometric &&
                              availableMethods?.image && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="method"
                                    value="both"
                                    checked={selectedMethod === "both"}
                                    onChange={(e) =>
                                      setSelectedMethod(
                                        e.target.value as "both"
                                      )
                                    }
                                    className="w-4 h-4"
                                    style={{ accentColor: "#0a66c2" }}
                                  />
                                  <div className="flex items-center gap-1">
                                    <Fingerprint className="w-3 h-3 text-gray-600" />
                                    <Camera className="w-3 h-3 text-gray-600" />
                                    <span
                                      className="text-sm font-normal text-gray-900"
                                      style={linkedInFontStyle}
                                    >
                                      Both (Max Security)
                                    </span>
                                  </div>
                                </label>
                              )}
                          </div>
                        </div>

                        <div
                          className={`grid gap-4 ${
                            selectedMethod === "both"
                              ? "grid-cols-1 lg:grid-cols-2"
                              : "grid-cols-1"
                          }`}
                        >
                          {(selectedMethod === "biometric" ||
                            selectedMethod === "both") && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h6
                                  className="text-sm font-medium text-gray-900 flex items-center gap-2"
                                  style={linkedInFontStyle}
                                >
                                  <Fingerprint className="w-4 h-4 text-gray-600" />
                                  Fingerprint
                                </h6>
                                {biometricData.fingerprint && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span
                                      className="text-xs font-normal"
                                      style={linkedInFontStyle}
                                    >
                                      Captured
                                    </span>
                                  </div>
                                )}
                              </div>
                              <BiometricCapture
                                onCapture={handleBiometricCapture}
                                isCapturing={isCapturing}
                              />
                            </div>
                          )}

                          {(selectedMethod === "image" ||
                            selectedMethod === "both") && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h6
                                  className="text-sm font-medium text-gray-900 flex items-center gap-2"
                                  style={linkedInFontStyle}
                                >
                                  <Camera className="w-4 h-4 text-gray-600" />
                                  Face Recognition
                                </h6>
                                {biometricData.image && (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="w-4 h-4" />
                                    <span
                                      className="text-xs font-normal"
                                      style={linkedInFontStyle}
                                    >
                                      Captured
                                    </span>
                                  </div>
                                )}
                              </div>
                              <ImageCapture
                                onCapture={handleImageCapture}
                                isCapturing={isCapturing}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div> */}
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

                      <div className="space-y-3">
                        <h5
                          className="text-sm font-medium text-gray-900"
                          style={linkedInFontStyle}
                        >
                          Select Verification Method
                        </h5>
                        <div
                          className="flex flex-wrap gap-4 p-3 bg-gray-50"
                          style={{ borderRadius: "4px" }}
                        >
                          {availableMethods?.biometric && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="method"
                                value="biometric"
                                checked={selectedMethod === "biometric"}
                                onChange={(e) =>
                                  setSelectedMethod(
                                    e.target.value as "biometric"
                                  )
                                }
                                className="w-4 h-4"
                                style={{ accentColor: "#0a66c2" }}
                              />
                              <div className="flex items-center gap-1">
                                <Fingerprint className="w-4 h-4 text-gray-600" />
                                <span
                                  className="text-sm font-normal text-gray-900"
                                  style={linkedInFontStyle}
                                >
                                  Fingerprint
                                </span>
                              </div>
                            </label>
                          )}

                          {availableMethods?.image && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="method"
                                value="image"
                                checked={selectedMethod === "image"}
                                onChange={(e) =>
                                  setSelectedMethod(e.target.value as "image")
                                }
                                className="w-4 h-4"
                                style={{ accentColor: "#0a66c2" }}
                              />
                              <div className="flex items-center gap-1">
                                <Camera className="w-4 h-4 text-gray-600" />
                                <span
                                  className="text-sm font-normal text-gray-900"
                                  style={linkedInFontStyle}
                                >
                                  Face
                                </span>
                              </div>
                            </label>
                          )}

                          {availableMethods?.biometric &&
                            availableMethods?.image && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="method"
                                  value="both"
                                  checked={selectedMethod === "both"}
                                  onChange={(e) =>
                                    setSelectedMethod(e.target.value as "both")
                                  }
                                  className="w-4 h-4"
                                  style={{ accentColor: "#0a66c2" }}
                                />
                                <div className="flex items-center gap-1">
                                  <Fingerprint className="w-3 h-3 text-gray-600" />
                                  <Camera className="w-3 h-3 text-gray-600" />
                                  <span
                                    className="text-sm font-normal text-gray-900"
                                    style={linkedInFontStyle}
                                  >
                                    Both (Max Security)
                                  </span>
                                </div>
                              </label>
                            )}
                        </div>
                      </div>

                      <div
                        className={`grid gap-4 ${
                          selectedMethod === "both"
                            ? "grid-cols-1 lg:grid-cols-2"
                            : "grid-cols-1"
                        }`}
                      >
                        {(selectedMethod === "biometric" ||
                          selectedMethod === "both") && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h6
                                className="text-sm font-medium text-gray-900 flex items-center gap-2"
                                style={linkedInFontStyle}
                              >
                                <Fingerprint className="w-4 h-4 text-gray-600" />
                                Fingerprint
                              </h6>
                              {biometricData.fingerprint && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span
                                    className="text-xs font-normal"
                                    style={linkedInFontStyle}
                                  >
                                    Captured
                                  </span>
                                </div>
                              )}
                            </div>
                            <BiometricCapture
                              onCapture={handleBiometricCapture}
                              isCapturing={isCapturing}
                            />
                          </div>
                        )}

                        {(selectedMethod === "image" ||
                          selectedMethod === "both") && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h6
                                className="text-sm font-medium text-gray-900 flex items-center gap-2"
                                style={linkedInFontStyle}
                              >
                                <Camera className="w-4 h-4 text-gray-600" />
                                Face Recognition
                              </h6>
                              {biometricData.image && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span
                                    className="text-xs font-normal"
                                    style={linkedInFontStyle}
                                  >
                                    Captured
                                  </span>
                                </div>
                              )}
                            </div>
                            <ImageCapture
                              onCapture={handleImageCapture}
                              isCapturing={isCapturing}
                            />
                          </div>
                        )}
                      </div>
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
                  onClick={handleCompleteVerification}
                  disabled={isLoading || !canVerify}
                  className="flex-1 h-12 flex items-center justify-center gap-2 text-white font-medium transition-colors disabled:opacity-50"
                  style={{
                    ...linkedInFontStyle,
                    backgroundColor: canVerify ? "#057642" : "#9ca3af",
                    borderRadius: "24px",
                    border: "none",
                    cursor: isLoading || !canVerify ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (canVerify && !isLoading) {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        "#046139";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canVerify && !isLoading) {
                      (e.target as HTMLButtonElement).style.backgroundColor =
                        "#057642";
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Verification
                    </>
                  )}
                </button>
                <button
                  onClick={clearForm}
                  className="px-6 h-12 border text-gray-700 font-medium transition-colors hover:bg-gray-50"
                  style={{
                    ...linkedInFontStyle,
                    borderColor: "#d9d9d9",
                    borderRadius: "24px",
                    backgroundColor: "transparent",
                  }}
                >
                  Clear
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
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="text-center py-12 space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-lg">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-gray-600" style={linkedInFontStyle}>
                    Processing biometric verification...
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
                            {verificationResult.verificationDetails.method ===
                            "biometric"
                              ? "Fingerprint"
                              : verificationResult.verificationDetails
                                  .method === "image"
                              ? "Face Recognition"
                              : verificationResult.verificationDetails
                                  .method === "both"
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

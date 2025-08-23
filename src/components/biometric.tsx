/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import { Card, CardContent } from "./ui/card";
import { Camera, Fingerprint } from "lucide-react";
import { Button } from "./ui/button";
export const BiometricCapture = ({
  onCapture,
  isCapturing,
}: {
  onCapture: (data: string) => void;
  isCapturing: boolean;
}) => {
  const [isHovering, setIsHovering] = React.useState(false);
  const [isScanning, setIsScanning] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState(0);

  const handleFingerScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate fingerprint scanning animation
    const scanInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(scanInterval);
          setIsScanning(false);
          // Generate simulated biometric data
          const simulatedBiometricData = `fingerprint_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          onCapture(simulatedBiometricData);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  return (
    <Card className="border-2 border-stone-300 bg-gradient-to-br from-stone-50 rounded-none to-indigo-50 overflow-hidden">
      <CardContent className="flex flex-col items-center justify-center py-8 relative">
        {/* Fingerprint Scanner Visual */}
        <div
          className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 cursor-pointer ${
            isScanning
              ? "border-green-500 bg-green-100"
              : isHovering
              ? "border-stone-500 bg-stone-100 scale-105"
              : "border-gray-300 bg-gray-100"
          }`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handleFingerScan}
        >
          {/* Fingerprint Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Fingerprint
              className={`w-12 h-12 transition-all duration-300 ${
                isScanning
                  ? "text-green-600"
                  : isHovering
                  ? "text-stone-600"
                  : "text-gray-400"
              }`}
            />
          </div>

          {/* Scanning Animation */}
          {isScanning && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div
                className="absolute bottom-0 left-0 w-full bg-green-300 opacity-50 transition-all duration-100"
                style={{ height: `${scanProgress}%` }}
              />
              <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-pulse" />
            </div>
          )}

          {/* Hover Effect */}
          {isHovering && !isScanning && (
            <div className="absolute inset-0 rounded-full border-2 border-stone-400 animate-ping opacity-75" />
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isScanning ? "Scanning fingerprint..." : "Place finger on scanner"}
          </p>
          <p className="text-xs text-gray-500">
            {isScanning
              ? `${scanProgress}% complete`
              : isHovering
              ? "Click to start scan"
              : "Hover to activate"}
          </p>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 w-2 h-2 bg-stone-400 rounded-full animate-pulse" />
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-green-400 rounded-full animate-pulse delay-1000" />
      </CardContent>
    </Card>
  );
};
export const ImageCapture = ({
  onCapture,
  isCapturing,
}: {
  onCapture: (data: string) => void;
  isCapturing: boolean;
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [showCamera, setShowCamera] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);

  // Start camera
  const handleStartCamera = async () => {
    setError(null);
    setShowCamera(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError("Unable to access camera.");
      setShowCamera(false);
    }
  };

  // Stop camera
  const handleStopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
    setStream(null);
  };

  // Capture photo from video
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 320, 240);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "captured-image.png", {
              type: "image/png",
            });
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(blob));
            setError(null);
            handleStopCamera();
          }
        }, "image/png");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select or capture an image file.");
      return;
    }
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      //   // @ts-ignore
      //   const { uploadImageToCloudinary } = await import("../../../lib/utils");
      // Use XMLHttpRequest for progress
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "maic_project");
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        "https://api.cloudinary.com/v1_1/dwbbpzcug/image/upload"
      );
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          onCapture(data.secure_url);
        } else {
          setError("Image upload failed.");
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setError("Image upload failed.");
      };
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setError("Image upload failed.");
    }
  };

  React.useEffect(() => {
    if (showCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCamera, stream]);

  return (
    <Card className="border-dashed border-2 rounded-none border-stone-300 bg-green-50">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="flex flex-col justify-center gap-2 w-full items-center">
          {/* <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={isCapturing || uploading || showCamera}
          /> */}
          <Button
            type="button"
            onClick={handleStartCamera}
            disabled={isCapturing || uploading || showCamera}
            className="bg-stone-600 hover:bg-stone-700 mt-2 rounded-none"
          >
            Use Camera
          </Button>
          {showCamera && (
            <div className="flex flex-col items-center mt-2">
              <video
                ref={videoRef}
                width={320}
                height={240}
                autoPlay
                className="rounded border mb-2"
              />
              <canvas
                ref={canvasRef}
                width={320}
                height={240}
                style={{ display: "none" }}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="bg-green-600 hover:bg-green-700 rounded-none"
                >
                  Capture
                </Button>
                <Button
                  type="button"
                  onClick={handleStopCamera}
                  className="bg-gray-400 hover:bg-gray-500 rounded-none"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          <span className="text-xs text-gray-500">
            Choose file or use camera
          </span>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded mt-2"
            />
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={isCapturing || uploading || !selectedFile}
          className="bg-green-600 hover:bg-green-700 mt-4 rounded-none"
        >
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
        {uploading && (
          <div className="w-full mt-2 flex flex-col items-center">
            <div className="w-3/4 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-green-600 h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="text-xs mt-1">{uploadProgress}%</span>
          </div>
        )}
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </CardContent>
    </Card>
  );
};

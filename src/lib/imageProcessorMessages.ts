import type { TrustMarkDetection } from "./trustMark";

export interface ImageRenderInput {
  baseImageBase64: string;
  name: string;
  quote: string;
}

interface CheckCompatibilityRequest {
  requestId: number;
  type: "checkCompatibility";
}

interface InitializeImageRendererRequest {
  type: "initializeRenderer";
}

interface InitializeWatermarkVerifierRequest {
  requestId: number;
  type: "initializeVerifier";
}

interface RenderImageRequest {
  input: ImageRenderInput;
  requestId: number;
  type: "render";
}

interface VerifyWatermarkRequest {
  image: Blob;
  requestId: number;
  type: "verify";
}

export type ImageProcessorRequest =
  | CheckCompatibilityRequest
  | InitializeImageRendererRequest
  | InitializeWatermarkVerifierRequest
  | RenderImageRequest
  | VerifyWatermarkRequest;

interface ImageProcessorFailureResponse {
  message: string;
  requestId: number;
  type: "failure";
}

interface ImageProcessorCompatibilityResponse {
  requestId: number;
  type: "compatibility";
  unsupportedFeatures: string[];
}

interface ImageRenderSuccessResponse {
  png: ArrayBuffer;
  requestId: number;
  type: "renderSuccess";
}

interface WatermarkVerificationSuccessResponse {
  detection: TrustMarkDetection;
  requestId: number;
  type: "verificationSuccess";
}

interface WatermarkVerifierReadyResponse {
  requestId: number;
  type: "verifierReady";
}

export type ImageProcessorResponse =
  | ImageProcessorCompatibilityResponse
  | ImageProcessorFailureResponse
  | ImageRenderSuccessResponse
  | WatermarkVerificationSuccessResponse
  | WatermarkVerifierReadyResponse;

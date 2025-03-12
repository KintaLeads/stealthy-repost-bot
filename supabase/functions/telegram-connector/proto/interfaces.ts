
/**
 * Core interfaces for MTProto implementation
 */

export interface MTProtoInterface {
  call(method: string, params?: Record<string, any>): Promise<any>;
  exportSession(): Promise<string>;
  disconnect(): Promise<void>;
  validateCredentials(): Promise<{ success: boolean; error?: string }>;
}

export interface MTProtoOptions {
  apiId: number;
  apiHash: string;
  storageOptions: {
    session?: string;
  };
}

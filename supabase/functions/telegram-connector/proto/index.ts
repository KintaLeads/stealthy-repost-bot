
/**
 * MTProto module for Telegram API
 * 
 * This file maintains backward compatibility with code that previously
 * imported directly from mtproto.ts
 */
import { MTProtoClient } from "./mtproto-client.ts";
import { MTProtoInterface, MTProtoOptions } from "./interfaces.ts";

// Export the MTProto class with the original name for backward compatibility
export class MTProto extends MTProtoClient implements MTProtoInterface {
  constructor(options: MTProtoOptions) {
    super(options);
  }
}

// Export interfaces
export type { MTProtoInterface, MTProtoOptions };

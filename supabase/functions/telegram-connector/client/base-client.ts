
// Base client for Telegram operations
import { StringSession } from "npm:telegram@2.26.22/sessions/index.js";

export type AuthState = 'none' | 'code_needed' | 'authenticated';

export class BaseTelegramClient {
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected stringSession: StringSession;
  protected authState: AuthState = 'none';
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.stringSession = new StringSession(sessionString);
  }
  
  getAuthState(): AuthState {
    return this.authState;
  }
}

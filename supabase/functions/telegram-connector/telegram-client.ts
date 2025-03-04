
// Mock implementation of Telegram client
export class TelegramClientMock {
  private apiId: string;
  private apiHash: string;
  private phoneNumber: string;
  private connected: boolean = false;
  private sessionString: string = '';

  constructor(apiId: string, apiHash: string, phoneNumber: string) {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
  }

  async connect(): Promise<boolean> {
    console.log('Connecting to Telegram with:', { 
      apiId: this.apiId, 
      apiHash: this.maskApiHash(this.apiHash), 
      phone: this.maskPhone(this.phoneNumber) 
    });
    
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 500));
    this.connected = true;
    this.sessionString = `mock_session_${Date.now()}`;
    return true;
  }

  async getEntity(channelName: string): Promise<any> {
    console.log(`Getting entity for channel: ${channelName}`);
    return { id: `entity_${channelName}`, name: channelName };
  }

  async getMessages(entity: any, options: any): Promise<any[]> {
    console.log(`Getting messages for entity:`, entity, 'with options:', options);
    
    // Create mock messages
    const messages = [];
    const currentTime = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < (options.limit || 5); i++) {
      messages.push({
        id: Date.now() + i,
        message: `Mock message ${i + 1} for ${entity.name}`,
        date: currentTime - (i * 60) // Each message is 1 minute apart
      });
    }
    
    return messages;
  }

  async sendMessage(entity: any, options: any): Promise<any> {
    console.log(`Sending message to entity:`, entity, 'with options:', options);
    return { success: true, messageId: Date.now() };
  }
  
  getSession(): string {
    return this.sessionString;
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  // Helper methods for privacy
  private maskApiHash(hash: string): string {
    if (hash.length <= 8) return '********';
    return hash.substring(0, 4) + '****' + hash.substring(hash.length - 4);
  }
  
  private maskPhone(phone: string): string {
    if (phone.length <= 6) return '******';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
  }
}

/**
 * PII Censor - Privacy-preserving tokenization system
 * 
 * Automatically detects and tokenizes sensitive PII before sending to LLM
 * De-tokenizes when passing data to MCP tools
 * 
 * SECURITY: In production, use a secure, encrypted, session-based cache (e.g., Redis)
 */

/**
 * PII patterns to detect
 * Extend this with additional patterns as needed
 */
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  // Add more patterns as needed
};

export class PiiCensor {
  // In production: Use Redis or similar with expiring keys
  // For template: Using in-memory Map
  private piiMap: Map<string, Map<string, string>> = new Map();
  
  // Configuration
  private readonly tokenPrefix = '[PII_';
  private readonly tokenSuffix = ']';

  /**
   * Get or create a storage map for a specific user/session
   */
  private getStore(userId: string): Map<string, string> {
    if (!this.piiMap.has(userId)) {
      this.piiMap.set(userId, new Map());
    }
    return this.piiMap.get(userId)!;
  }

  /**
   * Tokenize PII in data before sending to LLM
   * Recursively processes strings, objects, and arrays
   */
  tokenize(userId: string, data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    const store = this.getStore(userId);
    
    // Handle different data types
    if (typeof data === 'string') {
      return this.tokenizeString(userId, data, store);
    } else if (Array.isArray(data)) {
      return data.map(item => this.tokenize(userId, item));
    } else if (typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.tokenize(userId, value);
      }
      return result;
    }
    
    return data;
  }

  /**
   * Tokenize PII in a string
   */
  private tokenizeString(_userId: string, str: string, store: Map<string, string>): string {
    let result = str;
    
    // Apply each PII pattern
    for (const [piiType, pattern] of Object.entries(PII_PATTERNS)) {
      result = result.replace(pattern, (match) => {
        // Check if this PII is already tokenized
        for (const [token, value] of store.entries()) {
          if (value === match) {
            return token;
          }
        }
        
        // Create new token
        const tokenId = `${piiType.toUpperCase()}_${store.size + 1}`;
        const token = `${this.tokenPrefix}${tokenId}${this.tokenSuffix}`;
        store.set(token, match);
        
        console.log(`[PiiCensor] Tokenized ${piiType}: ${match} -> ${token}`);
        return token;
      });
    }
    
    return result;
  }

  /**
   * De-tokenize PII when passing to MCP tools
   * Restores original sensitive values
   */
  detokenize(userId: string, data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    const store = this.getStore(userId);
    
    // Handle different data types
    if (typeof data === 'string') {
      return this.detokenizeString(data, store);
    } else if (Array.isArray(data)) {
      return data.map(item => this.detokenize(userId, item));
    } else if (typeof data === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(data)) {
        result[key] = this.detokenize(userId, value);
      }
      return result;
    }
    
    return data;
  }

  /**
   * De-tokenize a string
   */
  private detokenizeString(str: string, store: Map<string, string>): string {
    let result = str;
    
    // Replace all tokens with original values
    for (const [token, originalValue] of store.entries()) {
      const escapedToken = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(new RegExp(escapedToken, 'g'), originalValue);
    }
    
    return result;
  }

  /**
   * Clear PII data for a user/session
   * Call this when a session ends
   */
  clearSession(userId: string): void {
    this.piiMap.delete(userId);
    console.log(`[PiiCensor] Cleared session data for user: ${userId}`);
  }

  /**
   * Get statistics about tokenized PII for a user
   */
  getStats(userId: string): { tokenCount: number; types: Record<string, number> } {
    const store = this.getStore(userId);
    const types: Record<string, number> = {};
    
    for (const token of store.keys()) {
      const match = token.match(/\[PII_([A-Z]+)_\d+\]/);
      if (match) {
        const type = match[1];
        types[type] = (types[type] || 0) + 1;
      }
    }
    
    return {
      tokenCount: store.size,
      types
    };
  }

  /**
   * Add a custom PII pattern
   */
  addPattern(name: string, pattern: RegExp): void {
    (PII_PATTERNS as any)[name] = pattern;
    console.log(`[PiiCensor] Added custom pattern: ${name}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface KeyState {
  key: string;
  name: string;
  cooldownUntil: Date | null;
  isInvalid: boolean;
  usageHistory: Date[]; // timestamps of requests in the last 60s
}

export class NonRetryableError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = 'NonRetryableError';
  }
}

@Injectable()
export class GeminiKeyManager {
  private readonly logger = new Logger(GeminiKeyManager.name);
  private keys: KeyState[] = [];
  private readonly rpmLimit = 15; // Standard free tier limit: 15 RPM
  private readonly rpmBuffer = 2;   // Proactive switch buffer (switch when reaching limit - buffer)

  constructor(private readonly configService: ConfigService) {
    this.initializeKeys();
  }

  private initializeKeys() {
    const uniqueKeys = new Set<string>();
    const loadedKeys: KeyState[] = [];

    // Helper to add key if unique
    const addKey = (key: string, name: string) => {
      const trimmed = key.trim();
      if (trimmed && !uniqueKeys.has(trimmed)) {
        uniqueKeys.add(trimmed);
        loadedKeys.push({
          key: trimmed,
          name,
          cooldownUntil: null,
          isInvalid: false,
          usageHistory: [],
        });
      }
    };

    // 1. Try loading from GEMINI_API_KEYS (comma separated)
    const keysString = this.configService.get<string>('GEMINI_API_KEYS');
    if (keysString) {
      const splitKeys = keysString.split(',').map((k) => k.trim()).filter(Boolean);
      splitKeys.forEach((key, index) => {
        addKey(key, `GEMINI_API_KEYS[${index}]`);
      });
    }

    // 2. Try scanning process.env for GEMINI_API_KEY and GEMINI_API_KEY_X
    for (const keyName of Object.keys(process.env)) {
      if (keyName === 'GEMINI_API_KEY' || /^GEMINI_API_KEY_\d+$/.test(keyName)) {
        const val = process.env[keyName];
        if (val) {
          addKey(val, keyName);
        }
      }
    }

    this.keys = loadedKeys;
    this.logger.log(`Initialized GeminiKeyManager with ${this.keys.length} unique API key(s).`);
  }

  /**
   * Cleans up usage history for a key by removing timestamps older than 60 seconds.
   */
  private cleanUsageHistory(state: KeyState) {
    const now = Date.now();
    state.usageHistory = state.usageHistory.filter(
      (time) => now - time.getTime() < 60000,
    );
  }

  /**
   * Helper to sleep/delay execution.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Selects the best available API key.
   * If all keys are rate-limited, it will wait until the first key becomes available.
   */
  private async selectBestKey(): Promise<KeyState> {
    if (this.keys.length === 0) {
      // Re-initialize in case env vars were loaded dynamically after construction
      this.initializeKeys();
      if (this.keys.length === 0) {
        throw new Error('No Gemini API keys configured. Please set GEMINI_API_KEY in environment.');
      }
    }

    while (true) {
      const now = new Date();
      let bestKey: KeyState | null = null;
      let minUsageCount = Infinity;
      let earliestAvailableTime = Infinity;

      for (const keyState of this.keys) {
        if (keyState.isInvalid) continue;

        // Check if key is in cooldown
        if (keyState.cooldownUntil && keyState.cooldownUntil > now) {
          const cooldownTimeLeft = keyState.cooldownUntil.getTime();
          if (cooldownTimeLeft < earliestAvailableTime) {
            earliestAvailableTime = cooldownTimeLeft;
          }
          continue;
        }

        // Clean and check RPM limit
        this.cleanUsageHistory(keyState);
        const currentUsage = keyState.usageHistory.length;

        // If this key is below the proactive threshold
        if (currentUsage < this.rpmLimit - this.rpmBuffer) {
          if (currentUsage < minUsageCount) {
            minUsageCount = currentUsage;
            bestKey = keyState;
          }
        } else {
          // Key is near limit, calculate when it will slide and have capacity
          if (keyState.usageHistory.length > 0) {
            const oldestRequestTime = keyState.usageHistory[0].getTime();
            const timeKeyBecomesAvailable = oldestRequestTime + 60000;
            if (timeKeyBecomesAvailable < earliestAvailableTime) {
              earliestAvailableTime = timeKeyBecomesAvailable;
            }
          }
        }
      }

      // If we found a suitable key below proactive limit, return it
      if (bestKey) {
        return bestKey;
      }

      // If no key is under the buffer, but we have keys that are still strictly under the hard limit
      for (const keyState of this.keys) {
        if (keyState.isInvalid) continue;
        if (keyState.cooldownUntil && keyState.cooldownUntil > now) continue;

        this.cleanUsageHistory(keyState);
        if (keyState.usageHistory.length < this.rpmLimit) {
          return keyState;
        }
      }

      // If all keys are completely rate-limited or on cooldown, we must wait
      const sleepTime = earliestAvailableTime - now.getTime();
      if (sleepTime > 0 && sleepTime < 60000) {
        this.logger.warn(`All Gemini API keys are busy or rate-limited. Proactively waiting for ${Math.ceil(sleepTime / 1000)}s...`);
        await this.delay(sleepTime);
      } else {
        // If wait time is unreasonably long or no key is valid
        const validKeysCount = this.keys.filter(k => !k.isInvalid).length;
        if (validKeysCount === 0) {
          throw new Error('All configured Gemini API keys have been marked as INVALID.');
        }
        // Fallback: choose the one with the smallest cooldown/usage history and wait 1s
        this.logger.warn('All keys rate-limited. Waiting 1 second fallback...');
        await this.delay(1000);
      }
    }
  }

  private isRateLimitError(error: any): boolean {
    const msg = String(error.message || error).toLowerCase();
    const status = error.status || error.statusCode;
    return (
      status === 429 ||
      msg.includes('429') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota exceeded') ||
      msg.includes('rate limit') ||
      msg.includes('resource exhausted')
    );
  }

  private isInvalidKeyError(error: any): boolean {
    const msg = String(error.message || error).toLowerCase();
    const status = error.status || error.statusCode;
    return (
      (status === 400 && msg.includes('api_key_invalid')) ||
      msg.includes('api key not valid') ||
      msg.includes('key is invalid') ||
      msg.includes('api_key_invalid') ||
      msg.includes('invalid api key') ||
      msg.includes('api key is invalid') ||
      status === 403 ||
      status === 401
    );
  }

  /**
   * Executes a Gemini API operation using the best available API key, with auto-rotation on failure.
   */
  async execute<T>(fn: (apiKey: string) => Promise<T>): Promise<T> {
    const maxTries = Math.max(this.keys.length, 3);
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxTries; attempt++) {
      let keyState: KeyState;
      try {
        keyState = await this.selectBestKey();
      } catch (err) {
        throw new Error(`Failed to select Gemini key: ${err instanceof Error ? err.message : String(err)}`);
      }

      this.logger.log(`Executing Gemini operation using key: ${keyState.name}`);

      try {
        const result = await fn(keyState.key);
        // Success! Track usage
        keyState.usageHistory.push(new Date());
        return result;
      } catch (error) {
        lastError = error;

        if (error instanceof NonRetryableError) {
          throw error;
        }

        const isRateLimit = this.isRateLimitError(error);
        const isInvalidKey = this.isInvalidKeyError(error);

        if (isRateLimit) {
          const cooldownMs = 60000; // 1 minute cooldown for rate limit
          keyState.cooldownUntil = new Date(Date.now() + cooldownMs);
          this.logger.warn(
            `Key ${keyState.name} hit rate limit. Putting on cooldown for 60s. Error: ${error.message || error}`,
          );
        } else if (isInvalidKey) {
          keyState.isInvalid = true;
          this.logger.error(
            `Key ${keyState.name} detected as INVALID. Disabling permanently. Error: ${error.message || error}`,
          );
        } else {
          // Generic network or API error, retry with normal cooldown
          keyState.cooldownUntil = new Date(Date.now() + 5000); // 5s brief cooldown
          this.logger.warn(
            `Key ${keyState.name} encountered error: ${error.message || error}. Putting on temporary cooldown of 5s.`,
          );
        }

        // Check if we can retry
        const activeKeysCount = this.keys.filter((k) => !k.isInvalid && (!k.cooldownUntil || k.cooldownUntil <= new Date())).length;
        if (activeKeysCount === 0 && attempt === maxTries) {
          this.logger.error('All Gemini keys failed or are on cooldown. No more retries.');
          break;
        }

        this.logger.warn(`Retrying Gemini operation with next key (attempt ${attempt + 1}/${maxTries})...`);
      }
    }

    throw lastError || new Error('Gemini execution failed with all keys.');
  }

  /**
   * Get diagnostics of all configured keys
   */
  getDiagnostics() {
    const now = new Date();
    return this.keys.map((k) => {
      this.cleanUsageHistory(k);
      let status = 'ACTIVE';
      if (k.isInvalid) {
        status = 'INVALID';
      } else if (k.cooldownUntil && k.cooldownUntil > now) {
        status = `COOLDOWN (until ${k.cooldownUntil.toISOString()})`;
      } else if (k.usageHistory.length >= this.rpmLimit - this.rpmBuffer) {
        status = `NEAR_LIMIT (${k.usageHistory.length}/${this.rpmLimit} RPM)`;
      }

      return {
        name: k.name,
        status,
        callsInLastMinute: k.usageHistory.length,
      };
    });
  }
}

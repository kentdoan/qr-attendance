export interface QrTokenItem {
  token: string;
  sessionId: string;
  expiresAt: number; // Unix timestamp in seconds (for DynamoDB TTL)
}

// Re-using minimal properties of SessionItem to verify ownership and status
export interface SessionSummary {
  sessionId: string;
  teacherId: string;
  status: string;
}

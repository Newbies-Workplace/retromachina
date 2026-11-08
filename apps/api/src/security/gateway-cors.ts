type OriginCallback = (error: Error | null, allow?: boolean) => void;

/**
 * Socket.IO CORS settings shared by all gateways: only the frontend origin
 * (from CALLBACK_URL) may open polling connections from a browser. Requests
 * without an Origin header (non-browser clients, tests) are allowed, because
 * every connection still has to present a valid access token.
 */
export const gatewayCors = {
  origin: (origin: string | undefined, callback: OriginCallback) => {
    if (!origin) return callback(null, true);
    try {
      callback(null, origin === new URL(process.env.CALLBACK_URL).origin);
    } catch {
      callback(null, false);
    }
  },
};

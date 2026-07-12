export const Logger = {
  info: (message: string, ...optionalParams: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...optionalParams);
  },
  error: (message: string, ...optionalParams: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...optionalParams);
  },
  warn: (message: string, ...optionalParams: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...optionalParams);
  },
  debug: (message: string, ...optionalParams: any[]) => {
    if (process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...optionalParams);
    }
  }
};

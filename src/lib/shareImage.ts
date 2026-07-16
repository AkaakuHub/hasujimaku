export const shareImage = async (share: () => Promise<void>): Promise<void> => {
  try {
    await share();
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "AbortError") {
      throw error;
    }
  }
};

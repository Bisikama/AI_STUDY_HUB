export const safeNavigateTo = (url: string) => {
  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }
};

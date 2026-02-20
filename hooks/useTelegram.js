
/**
 * Hook for interacting with Telegram WebApp API
 */
export const useTelegram = () => {
  const tg = window.Telegram?.WebApp;

  const user = tg?.initDataUnsafe?.user;
  const telegramId = user?.id;

  return {
    tg,
    user,
    telegramId,
    isInsideTelegram: !!tg?.initData,
  };
};

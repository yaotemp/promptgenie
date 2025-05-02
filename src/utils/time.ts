export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const secondsInMinute = 60;
  const secondsInHour = 3600;
  const secondsInDay = 86400;
  const secondsInWeek = 604800;
  const secondsInMonth = 2592000; // Approximate

  if (diffInSeconds < secondsInMinute) {
    return '刚刚';
  } else if (diffInSeconds < secondsInHour) {
    const minutes = Math.floor(diffInSeconds / secondsInMinute);
    return `${minutes} 分钟前`;
  } else if (diffInSeconds < secondsInDay) {
    const hours = Math.floor(diffInSeconds / secondsInHour);
    return `${hours} 小时前`;
  } else if (diffInSeconds < secondsInDay * 2) {
    // 如果是昨天，但时间差大于24小时但在48小时内
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (past.getDate() === yesterday.getDate() &&
      past.getMonth() === yesterday.getMonth() &&
      past.getFullYear() === yesterday.getFullYear()) {
      return '昨天';
    }
  }

  // 对于更早的时间，直接显示日期
  const year = past.getFullYear();
  const month = past.getMonth() + 1; // 月份是从0开始的
  const day = past.getDate();

  // 如果是今年，只显示月日
  if (year === now.getFullYear()) {
    return `${month}月${day}日`;
  }

  // 如果是往年，显示年月日
  return `${year}年${month}月${day}日`;
} 
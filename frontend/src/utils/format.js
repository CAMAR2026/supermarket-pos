export const money = (value, currency = 'KSh') => {
  const amount = Number(value) || 0;
  return `${currency} ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (value) =>
  new Date(value).toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

export const formatDay = (value) =>
  new Date(value).toLocaleDateString('en-KE', { dateStyle: 'medium' });

export const errorMessage = (error, fallback = 'Something went wrong.') =>
  error?.response?.data?.message || error?.message || fallback;

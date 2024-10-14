const utcDateStr = '2024-07-19T14:00:00Z';

// Create a Date object from the UTC string
const utcDate = new Date(utcDateStr);

// Define the options for the date format, specifying the time zone as 'America/Sao_Paulo'
const options = {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

// Format the date to Brazil's time zone
const formatter = new Intl.DateTimeFormat('en-US', options);
const brazilTime = formatter.format(utcDate);

console.log(`UTC Time: ${utcDateStr}`);
console.log(`Brazil Time: ${brazilTime}`);
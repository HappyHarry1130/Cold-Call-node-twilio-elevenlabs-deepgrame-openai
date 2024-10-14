let utcDate = new Date('2024-08-05T03:00:00Z'); // UTC time
let brazilTime = utcDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }); // Convert to Brazil time (BRT)
console.log(brazilTime);
(async () => {
    const fetch = (await import('node-fetch')).default;

    const API_KEY = 'twp_0Dp2OPP2QKlFdIjjW9U8lJou9pxq';
    const BASE_URL = 'https://toneagency.teamwork.com/';

    const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${API_KEY}`
        }
    };

    fetch(`${BASE_URL}/projects/api/v3/people.json`, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            data.people.forEach(user => {
                const userId = user.id;
                const userName = `${user['first-name']} ${user['last-name']}`;
                console.log(`User ID: ${userId}, Name: ${userName}`);
            });
        })
        .catch(err => console.error('Failed to fetch users:', err));
})();
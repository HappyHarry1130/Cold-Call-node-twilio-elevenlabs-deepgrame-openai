const axios = require('axios');

const siteName = 'toneagency'; // Replace with your actual site name
const BasicURL = `https://${siteName}.teamwork.com`;
const endpoint = '/projects.json';
const authHeader = 'Basic dHdwXzBEcDJPUFAyUUtsRmRJampXOVU4bEpvdTlweHE6';

axios.get(`${BasicURL}${endpoint}`, {
    headers: {
        'Authorization': authHeader
    }
})
.then(async response => {
    const projects = response.data.projects;
    let i = 0;
    let maxTotalHours = 0;
    let maxProject = null;
    let minProject = null;

    const projectPromises = projects.map(async (project) => {
        const projectData = await get_on_a_projects(project.id);
        projectData.forEach(proj => {
            const totalHours = parseFloat(proj['time-totals']['total-hours-sum']);
            if (totalHours > maxTotalHours) {
                maxTotalHours = totalHours;
                maxProject = proj;
            }
        });
        i++;
        console.log(` ${i} - ${project.id} - ${project.name}`);
    });

    await Promise.all(projectPromises);

    if (maxProject) {
        console.log(`Project with max total hours: ${maxProject.name} (ID: ${maxProject.id}) with ${maxTotalHours} hours`);
    } else {
        console.log('No projects found.');
    }
})
.catch(error => {
    console.error('Error making the request:', error);
});

//functions
const get_on_a_projects = (projectId) => {
    const endpoint_getonaproject = `/projects/${projectId}/time/total.json`;
    const params = {
        fromDate: '20230701', // Replace with your actual start date (YYYYMMDD)
        fromTime: '09:00',    // Replace with your actual start time (HH:MM)
        toDate: '20230708',   // Replace with your actual end date (YYYYMMDD)
        toTime: '17:00',      // Replace with your actual end time (HH:MM)
        //userId: 12345,        // Replace with the actual user ID
        projectType: 'active',// Replace with 'all', 'active', or 'archived'
        page: 1,              // Replace with the actual page number
        pageSize: 10          // Replace with the actual page size
    };
    return axios.get(`${BasicURL}${endpoint_getonaproject}`, {
        headers: {
            'Authorization': authHeader
        },
        params: params
    })
    .then(response => {
        return response.data.projects;
    })
    .catch(error => {
        console.error('Error making the request:', error);
        return [];
    });
}
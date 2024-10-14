    module.exports = {
      apps: [
        {
          name: 'my-app',
          script: 'npm',
          args: 'run dev',
          watch: true, // Optional: watches for file changes and restarts the app
        },
      ],
    };
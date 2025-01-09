document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_URL = 'https://backend-2-9t4g.onrender.com/stats'; // Replace with actual backend URL
    const responseTimeData = [];
    const manualTriggerButton = document.querySelector('.manual-trigger');
    const routeMatrixTable = document.querySelector('#route-matrix tbody');

    // Initialize Chart.js
    // Updated Variables
    const responseTimes = [];

    function updateStats(responseTime) {
        responseTimes.push(responseTime);
        if (responseTimes.length > 20) responseTimes.shift();
    
        const avg = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);
        const max = Math.max(...responseTimes);
        const min = Math.min(...responseTimes);
    
        document.querySelector('#avg-response-time').innerText = `${avg} ms`;
        document.querySelector('#max-response-time').innerText = `${max} ms`;
        document.querySelector('#min-response-time').innerText = `${min} ms`;
    }    

    // Enhanced Chart.js Options
    const ctx = document.querySelector('#responseTimeChart')?.getContext('2d');
    const responseTimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Response Time (ms)',
                data: responseTimes,
                borderColor: (ctx) => {
                    // Dynamic border color based on value
                    return ctx.chart.data.datasets[0].data.map(value => value > 400 ? 'red' : 'green');
                },
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                fill: true,
                tension: 0.3,
            }],
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'second' },
                    title: { display: true, text: 'Time' },
                },
                y: {
                    title: { display: true, text: 'Response Time (ms)' },
                    ticks: { color: 'white' },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} ms`,
                    },
                },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'x',
                    },
                },
            },
        },
    });

    // Update Functionality
    function updateResponseTimeChart(responseTime) {
        const now = new Date();
        responseTimeChart.data.labels.push(now);
        responseTimeChart.data.datasets[0].data.push(responseTime);

        if (responseTimeChart.data.labels.length > 20) {
            responseTimeChart.data.labels.shift();
            responseTimeChart.data.datasets[0].data.shift();
        }

        responseTimeChart.update();
        updateStats(responseTime);
    }

    let isFetching = false;

    async function fetchStats() {
        if (isFetching) return;
        isFetching = true;
        manualTriggerButton?.setAttribute('disabled', true);

        const startTime = Date.now();

        try {
            const response = await fetch(BACKEND_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const endTime = Date.now();

            // Update Total Requests
            document.querySelector('#total-requests').innerText = `${data.total_requests}`;

            // Update Route Stats
            const routeStats = document.querySelector('#route-stats');
            routeStats.innerHTML = Object.entries(data.routes)
                .map(([route, stats]) => `
                    <tr>
                        <td>${route}</td>
                        <td>${stats.count}</td>
                    </tr>
                `)
                .join('');
            const backendStatus = document.querySelector('.status');
            backendStatus.innerText = 'Backend is Online';
            backendStatus.classList.remove('error');
            backendStatus.classList.add('ok');

            // Update Chart
            const responseTime = endTime - startTime;
            updateResponseTimeChart(responseTime);
            updateStats(responseTime);
            updateRouteMatrix(data.routes);
        } catch (error) {
            const backendStatus = document.querySelector('.status');
            backendStatus.innerText = 'Error: Unable to connect to the backend!';
            backendStatus.classList.remove('ok');
            backendStatus.classList.add('error');
        } finally {
            isFetching = false;
            manualTriggerButton?.removeAttribute('disabled');
        }
    }

    function updateResponseTimeChart(responseTime) {
        const now = new Date();
        responseTimeChart.data.labels.push(now);
        responseTimeChart.data.datasets[0].data.push(responseTime);

        if (responseTimeChart.data.labels.length > 20) {
            responseTimeChart.data.labels.shift();
            responseTimeChart.data.datasets[0].data.shift();
        }

        responseTimeChart.update();
    }

    function updateRouteMatrix(routes) {
    routeMatrixTable.innerHTML = Object.entries(routes)
        .map(([route, stats]) => `
            <tr>
                <td>${route}</td>
                <td>${stats.last_accessed}</td>
            </tr>
        `)
        .join('');
}

    manualTriggerButton?.addEventListener('click', fetchStats);
    setInterval(fetchStats, 5000);

    fetchStats(); // Initial fetch
});

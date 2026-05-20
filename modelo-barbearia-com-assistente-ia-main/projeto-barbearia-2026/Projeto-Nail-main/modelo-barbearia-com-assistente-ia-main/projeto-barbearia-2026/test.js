const fetch = require('node-fetch');

const API_KEY = "AIzaSyDDAxPskxf0snBgyBBD2CLKPqqEHzd3hsg";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function test() {
    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: "oi" }]
                }]
            })
        });

        const data = await response.json();
        console.log(response.status);
        console.log(JSON.stringify(data, null, 2));
    } catch(e) {
        console.error(e);
    }
}
test();

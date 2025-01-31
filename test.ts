
const askGPT = async () => {
    console.log('hi');
    const apiUrl = "http://localhost:3000/api/askGPT"; // Replace with your actual backend URL
    const requestBody = {
        userId: "user123", // Replace with the actual user ID
        query: "Explain recursion in programming." // Replace with your desired query
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error:", errorData.error);
            alert(`Error: ${errorData.error}`);
            return;
        }

        const data = await response.json();
        console.log("GPT Response:", data.message); // Log the message from the response
        alert(`GPT Response: ${data.message}`); // Display the response in an alert (or use in UI)
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("Something went wrong. Please try again later.");
    }
};

askGPT();

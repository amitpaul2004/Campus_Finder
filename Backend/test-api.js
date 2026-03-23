const data = {
    collectorName: "Test User",
    phoneNumber: "1234567890",
    email: "test@jis.ac.in",
    itemName: "Blue Wallet",
    category: "Accessories",
    location: "Library 1st Floor",
    dateReported: new Date().toISOString().split('T')[0],
    description: "Found on a chair"
};

fetch('http://localhost:5000/api/items/report-found', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
})
.then(res => res.json())
.then(res => {
    console.log("Response:", res);
    process.exit(0);
})
.catch(err => {
    console.error("Error:", err);
    process.exit(1);
});

// Test simple para webhook
const testPayload = {
    id: "12345678901",
    order_number: 1001,
    email: "test@example.com",
    total_price: "150.00",
    subtotal_price: "140.00",
    customer: {
        first_name: "Juan",
        last_name: "Prueba",
        email: "test@example.com",
        phone: "987654321"
    },
    shipping_address: {
        name: "Juan Prueba",
        address1: "Av Test 123",
        city: "Lima",
        province: "Lima",
        phone: "987654321"
    }
};

console.log('Testing webhook payload...');
console.log(JSON.stringify(testPayload, null, 2));

// Para usar en PowerShell:
console.log('\nPowerShell command:');
console.log(`$payload = '${JSON.stringify(testPayload)}'`);
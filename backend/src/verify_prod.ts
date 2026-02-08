
const BASE_URL = 'https://rent-ledger-qigs.onrender.com/api';

async function login(role: string, email: string) {
    console.log(`\n👤 [${role}] Logging in as ${email}...`);
    try {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password123' }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log(`✅ [${role}] Success! Token User ID: ${data.user.id}`);
            return data.accessToken;
        } else {
            console.error(`❌ [${role}] Failed! Status: ${response.status}`);
            const errorText = await response.text();
            console.error('Response:', errorText);
            process.exit(1);
        }
    } catch (error) {
        console.error(`❌ [${role}] Network Error:`, error);
        process.exit(1);
    }
}


async function register(role: string, email: string) {
    console.log(`\n📝 [${role}] Registering ${email}...`);
    try {
        const response = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password: 'password123',
                name: 'Live Tester',
                role: role.toUpperCase() // TENANT, LANDLORD, etc.
            }),
        });

        if (response.ok || response.status === 409) { // 409 means already exists, which is fine
            console.log(`✅ [${role}] Registration Success (or already exists).`);
        } else {
            console.error(`❌ [${role}] Registration Failed! Status: ${response.status}`);
            const errorText = await response.text();
            console.error('Response:', errorText);
            // Don't exit, try login anyway
        }
    } catch (error) {
        console.error(`❌ [${role}] Network Error during Register:`, error);
    }
}

async function verifyProduction() {
    console.log(`🚀 Starting Production Verification against ${BASE_URL}\n`);

    const email = 'live_tester@test.com';

    // 1. Register a Tenant
    await register('Tenant', email);

    // 2. Login as that Tenant
    await login('Tenant', email);

    console.log('\n🎉 Live Authentication Verified!');
}

verifyProduction();

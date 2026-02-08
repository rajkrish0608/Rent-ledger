import * as dns from 'dns';

/**
 * AGGRESSIVE DNS OVERRIDE
 * Forces Node.js to prefer IPv4 for all network connections.
 * This MUST be imported before any other module (like AppModule) that triggers a network connection.
 * necessary because Render's network doesn't support IPv6 routes to Supabase.
 */
console.log('🔌 Applying global IPv4 DNS override...');

const originalLookup = dns.lookup;
// @ts-ignore
dns.lookup = (hostname, options, callback) => {
    if (typeof options === 'function') {
        callback = options;
        options = { family: 4 };
    } else if (typeof options === 'number') {
        options = { family: options };
    } else {
        options = options || {};
    }
    options.family = 4;
    return originalLookup(hostname, options, callback);
};

// Also set the global default order for modern Node versions
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

console.log('✅ IPv4 DNS preference enabled.');

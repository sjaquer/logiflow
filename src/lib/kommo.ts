
// This file is not a component, so it doesn't need 'use client'
// It's a server-side utility for interacting with the Kommo API.

interface KommoToken {
    access_token: string;
    refresh_token: string | null; // Can be null for long-lived tokens
    expires_in: number;
    created_at?: number; // Store creation time to check for expiration
}

let token: KommoToken | null = null;

// Function to get a valid access token, refreshing if necessary
async function getAccessToken(): Promise<string | null> {
    const { 
        KOMMO_SUBDOMAIN, 
        KOMMO_ACCESS_TOKEN, 
        KOMMO_REFRESH_TOKEN, 
        KOMMO_INTEGRATION_ID,
        KOMMO_SECRET_KEY,
    } = process.env;

    // Check if essential variables are set
    if (!KOMMO_SUBDOMAIN || !KOMMO_INTEGRATION_ID || !KOMMO_SECRET_KEY) {
        console.error("Kommo environment variables are missing.");
        return null;
    }
    
    // If we don't have a token in memory, use the initial one from env
    if (!token && KOMMO_ACCESS_TOKEN) {
        token = {
            access_token: KOMMO_ACCESS_TOKEN,
            refresh_token: KOMMO_REFRESH_TOKEN || null,
            expires_in: 31536000, // Long-lived token, set expiry to 1 year
            created_at: Date.now() / 1000,
        };
    }
    
    if (!token) {
        console.error("Kommo token is not initialized. Provide initial tokens in env.");
        return null;
    }
    
    // Check if token is expired (with a 5-minute buffer), only if we have a refresh token
    const isExpired = token.refresh_token && (token.created_at || 0) + token.expires_in - 300 < Date.now() / 1000;

    if (isExpired) {
        console.log("Kommo token expired, refreshing...");
        try {
            const response = await fetch(`https://${KOMMO_SUBDOMAIN}.kommo.com/oauth2/access_token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: KOMMO_INTEGRATION_ID,
                    client_secret: KOMMO_SECRET_KEY,
                    grant_type: 'refresh_token',
                    refresh_token: token.refresh_token,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed to refresh Kommo token:", errorData);
                return null;
            }

            const newToken: KommoToken = await response.json();
            token = { ...newToken, created_at: Date.now() / 1000 };
            console.log("Successfully refreshed Kommo token.");

        } catch (error) {
            console.error("Error during token refresh:", error);
            return null;
        }
    }

    return token.access_token;
}

// Generic function to make API calls to Kommo
async function kommoApiRequest<T>(endpoint: string): Promise<T | null> {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        return null;
    }

    const { KOMMO_SUBDOMAIN } = process.env;
    const url = `https://${KOMMO_SUBDOMAIN}.kommo.com/api/v4/${endpoint}`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            console.error(`Kommo API request failed for ${endpoint}: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error('Error body:', errorBody);
            return null;
        }
        return await response.json() as T;
    } catch (error) {
        console.error(`Error fetching from Kommo API endpoint ${endpoint}:`, error);
        return null;
    }
}

// Fetches details for a specific lead
export async function getLeadDetails(leadId: string): Promise<any | null> {
    return kommoApiRequest(`leads/${leadId}?with=contacts`);
}

// Fetches details for a specific contact
export async function getContactDetails(contactId: number): Promise<any | null> {
    return kommoApiRequest(`contacts/${contactId}?with=leads`);
}

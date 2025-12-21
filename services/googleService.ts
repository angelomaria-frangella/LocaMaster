
/**
 * Google Workspace Service
 * Gestisce l'integrazione con Google Calendar e Gmail.
 */

declare var google: any;
declare var gapi: any;

const DISCOVERY_DOCS = [
    'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
    'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'
];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send';

let tokenClient: any;
let gapiInited = false;
let gsinited = false;

export const initGoogleLibrary = (clientId: string): Promise<void> => {
    return new Promise((resolve) => {
        const checkReady = () => {
            if (typeof google !== 'undefined' && typeof gapi !== 'undefined') {
                gapi.load('client', async () => {
                    await gapi.client.init({
                        discoveryDocs: DISCOVERY_DOCS,
                    });
                    gapiInited = true;
                    if (gsinited) resolve();
                });

                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: '', 
                });
                gsinited = true;
                if (gapiInited) resolve();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    });
};

/**
 * Invia una email via Gmail API (Workspace)
 */
export const sendEmailViaGmail = async (to: string, subject: string, body: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) return reject(new Error("Google Library non inizializzata."));

        tokenClient.callback = async (resp: any) => {
            if (resp.error) return reject(resp);

            try {
                const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
                const messageParts = [
                    `To: ${to}`,
                    'Content-Type: text/html; charset=utf-8',
                    'MIME-Version: 1.0',
                    `Subject: ${utf8Subject}`,
                    '',
                    body,
                ];
                const message = messageParts.join('\n');
                const encodedMessage = btoa(unescape(encodeURIComponent(message)))
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                await gapi.client.gmail.users.messages.send({
                    'userId': 'me',
                    'resource': { 'raw': encodedMessage }
                });
                resolve();
            } catch (e) { reject(e); }
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

export const syncToGoogleCalendar = async (events: any[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) return reject(new Error("Google Library non inizializzata."));

        tokenClient.callback = async (resp: any) => {
            if (resp.error) return reject(resp);
            
            try {
                for (const event of events) {
                    await gapi.client.calendar.events.insert({
                        'calendarId': 'primary',
                        'resource': {
                            'summary': `[LOCAMASTER] ${event.type}`,
                            'location': event.contractAddress,
                            'description': `${event.description}\nSoggetto: ${event.ownerName || event.tenantName}`,
                            'start': { 'date': event.date, 'timeZone': 'Europe/Rome' },
                            'end': { 'date': event.date, 'timeZone': 'Europe/Rome' }
                        }
                    });
                }
                resolve();
            } catch (e) { reject(e); }
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

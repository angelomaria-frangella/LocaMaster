
/**
 * Google Workspace Service
 * Gestisce l'integrazione con Google Calendar e Google Drive.
 */

declare var google: any;
declare var gapi: any;

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient: any;
let gapiInited = false;
let gsinited = false;

/**
 * Carica GAPI e GSI
 */
export const initGoogleLibrary = (clientId: string): Promise<void> => {
    return new Promise((resolve) => {
        const checkReady = () => {
            if (typeof google !== 'undefined' && typeof gapi !== 'undefined') {
                // Init GAPI
                gapi.load('client', async () => {
                    await gapi.client.init({
                        discoveryDocs: [DISCOVERY_DOC],
                    });
                    gapiInited = true;
                    if (gapiInited && gsinited) resolve();
                });

                // Init GSI (Token Client)
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: clientId,
                    scope: SCOPES,
                    callback: '', // defined at request time
                });
                gsinited = true;
                if (gapiInited && gsinited) resolve();
            } else {
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    });
};

/**
 * Sincronizza eventi con Google Calendar
 */
export const syncToGoogleCalendar = async (events: any[]): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error("Google Library non inizializzata."));
            return;
        }

        try {
            tokenClient.callback = async (resp: any) => {
                if (resp.error !== undefined) {
                    reject(resp);
                    return;
                }
                
                for (const event of events) {
                    await gapi.client.calendar.events.insert({
                        'calendarId': 'primary',
                        'resource': {
                            'summary': `[LOCAMASTER] ${event.type}`,
                            'location': event.contractAddress,
                            'description': `${event.description}\nCliente: ${event.ownerName || event.tenantName}`,
                            'start': {
                                'date': event.date,
                                'timeZone': 'Europe/Rome'
                            },
                            'end': {
                                'date': event.date,
                                'timeZone': 'Europe/Rome'
                            }
                        }
                    });
                }
                resolve();
            };

            if (gapi.client.getToken() === null) {
                tokenClient.requestAccessToken({prompt: 'consent'});
            } else {
                tokenClient.requestAccessToken({prompt: ''});
            }
        } catch (e) {
            reject(e);
        }
    });
};

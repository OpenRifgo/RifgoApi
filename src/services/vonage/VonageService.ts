import App from '../../App';

const app = App.getInstance();

const
    OpenTok = require("opentok"),
    API_KEY = app.env.opentokApiKey,
    API_SECRET = app.env.opentokApiSecret;

export class VonageService {
    async createSession() {
        const opentok = new OpenTok(API_KEY, API_SECRET);
        const session = await new Promise((resolve, reject) => {
            opentok.createSession({mediaMode: "routed"}, function (error, session) {
                if (error) {
                    console.log("Error creating session:", error);
                    reject(error);
                } else {
                    console.log("Session ID: " + session.sessionId);
                    resolve(session);
                }
            })
        }) as any;
        const sessionId = session.sessionId;
        const token = session.generateToken();

        return {
            sessionId,
            token,
            apiKey: API_KEY,
        }
    }

    async startBroadcast(sessionId: string) {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        const broadcast = await new Promise((resolve, reject) => {
            opentok.startBroadcast(sessionId, {
                layout: {
                    type: 'bestFit',
                    screenshareType: "pip"
                },
                outputs: {
                    hls: {},
                    // rtmp: [{
                    //     id: "foo",
                    //     serverUrl: "rtmp://myfooserver/myfooapp",
                    //     streamName: "myfoostream"
                    // },
                    // {
                    //     id: "bar",
                    //     serverUrl: "rtmp://mybarserver/mybarapp",
                    //     streamName: "mybarstream"
                    // }]
                },
                resolution: '1280x720',
            }, function (error, broadcast) {
                if (error) {
                    console.log("Error creating session:", error);
                    reject(error);
                } else {
                    const activeBroadcast = {
                        id: broadcast.id,
                        session: broadcast.sessionId,
                        rmtp: broadcast.broadcastUrls.rmtp,
                        url: broadcast.broadcastUrls.hls,
                        // apiKey: apiKey,
                        // availableAt: broadcast.createdAt + broadcastDelay
                    };
                    resolve(activeBroadcast);
                }
            })
        });

        return broadcast as {
            id: string
            session: string
            rmtp: null | string
            url: string
        }

        // return broadcast as {
        //     "id": "eb9e2ac5-ef0b-413b-a37b-b6c8a4398a94",
        //     "sessionId": "2_MX40NzIzOTc0NH5-MTYyMzYxNzUxMTM5NH5RYWtSTFQ4c1R5bnhTeVJVdFVnU1FyYjN-fg",
        //     "projectId": 47239744,
        //     "createdAt": 1623618053113,
        //     "broadcastUrls": {
        //         "hls": "https://cdn-broadcast102-fra.tokbox.com/15295/15295_eb9e2ac5-ef0b-413b-a37b-b6c8a4398a94.smil/playlist.m3u8"
        //     },
        //     "updatedAt": 1623618053113,
        //     "status": "started",
        //     "maxDuration": 7200,
        //     "resolution": "640x480"
        // }
    }

    async stopBroadcast(broadcastId: string) {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        const broadcast = await new Promise((resolve, reject) => {
            opentok.stopBroadcast(broadcastId, function (error, broadcast) {
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log('Broadcast stopped: ', broadcast?.id);
                    resolve(broadcast);
                }
            })
        });

        return broadcast
    }

    async startArchive(sessionId: string) {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        // start archiving
        const archive = await new Promise((resolve, reject) => {
            opentok.startArchive(sessionId, {
                name: `${sessionId} Archive`,
                resolution: '1280x720',
            }, function (
                err,
                archive
            ) {
                if (err) {
                    app.logger.error(err);
                    reject(err);
                } else {
                    // The id property is useful to save off into a database
                    console.log("new archive:" + archive.id);

                    resolve({id: archive.id});
                }
            });
        });

        return archive as {id: string, url: string}
    }

    async stopArchive(archiveId: string) {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        // start archiving
        await new Promise((resolve, reject) => {
            console.log('archiveId:', archiveId)
            opentok.stopArchive(archiveId, function (
                err,
                archive
            ) {
                if (err) {
                    console.log(err);
                    return reject(err);
                } else {
                    resolve(archive)
                }
            });
        });

        return {id: archiveId}
    }

    async getArchive(archiveId: string) {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        const result = await new Promise((resolve, reject) => {
            console.log('archiveId:', archiveId)
            opentok.getArchive(archiveId, function (
                err,
                archive
            ) {
                if (err) {
                    console.log(err);
                    return reject(err);
                } else {
                    resolve(archive)
                }
            });
        });

        return result;
    }

}

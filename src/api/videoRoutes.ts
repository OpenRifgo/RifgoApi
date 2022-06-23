import {VonageService} from '../services/vonage/VonageService'
import App from '../App'
import {Event} from '../entity/Event'
import assert = require('assert')
import {id, obj} from 'json-schema-blocks'

const app = App.getInstance();

const
    OpenTok = require("opentok"),
    API_KEY = app.env.opentokApiKey,
    API_SECRET = app.env.opentokApiSecret;

export default function (fastify, opts, next) {

    fastify.get('/publisher', async (req, reply) => {
        const vonageService = new VonageService();
        const result = await vonageService.createSession();
        reply.send(result);

        // const opentok = new OpenTok(API_KEY, API_SECRET);
        // const session = await new Promise((resolve, reject) => {
        //     opentok.createSession({mediaMode: "routed"}, function (error, session) {
        //         if (error) {
        //             console.log("Error creating session:", error);
        //             reject(error);
        //         } else {
        //             console.log("Session ID: " + session.sessionId);
        //             resolve(session);
        //         }
        //     })
        // }) as any;
        // const sessionId = session.sessionId;
        // const token = session.generateToken();
        //
        // reply.send({
        //     sessionId,
        //     token,
        //     apiKey: API_KEY,
        // })
    });

    fastify.get('/config',
        {
            schema: {
                description: 'Get public video global config',
                response: {
                    200: obj({
                        config: obj({
                            apiKey: id()
                        })
                    }),
                },
            },
        },
        async (req, reply) => {
        reply.send({
            config: {
                apiKey: app.env.opentokApiKey,
            }
        });
    });

    fastify.get('/publisher-html', async (req, reply) => {
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

        //     if (error) {
        //         console.log("Error creating session:", error)
        //     } else {
        //         console.log("Session ID: " + sessionId);
        //     }
        // }

        const result = `<html>
    <body>
    
    <div id="videos">
        <div id="subscriber"></div>
<!--        <div id="publisher"></div>-->
    </div>

    <!-- OpenTok.js library -->
    <script src="https://static.opentok.com/v2/js/opentok.js"></script>
    <script>
    // Handling all of our errors here by alerting them
    function handleError(error) {
      if (error) {
        alert(error.message);
      }
    }

    // credentials
    
    var apiKey = '${API_KEY}';
    var sessionId = '${sessionId}';
    var token = '${token}';
      
    // connect to session
    
    var session = OT.initSession(apiKey, sessionId);
    
    // Subscribe to a newly created stream
    // session.on('streamCreated', function(event) {
    //     session.subscribe(event.stream, 'subscriber', {
    //         insertMode: 'append',
    //     }, handleError);
    // });
    
    // // create publisher
    // var publisher = OT.initPublisher('publisher', {
    //         insertMode: 'append',
    //     }, handleError);
    // // Connect to the session
    // session.connect(token, function(error) {
    //     // If the connection is successful, publish to the session
    //     if (error) {
    //         handleError(error);
    //     } else {
    //         session.publish(publisher, handleError);
    //     }
    // });

    // create subscriber
    
    // session.on('streamCreated', function(event) {
    //    session.subscribe(event.stream);
    // });
      
    </script>
    <div>${sessionId}</div>
    </body>
    </html>`

        reply.type('text/html')
        reply.send(result)
    });


    fastify.get('/subscriber', async (req, reply) => {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        const sessionId = req.query.sessionId;
        const token = opentok.generateToken(sessionId);

        const result = `<html>
    <body>
    
    <div id="videos">
        <div id="subscriber"></div>
        <div id="publisher"></div>
    </div>

    <!-- OpenTok.js library -->
    <script src="https://static.opentok.com/v2/js/opentok.js"></script>
    <script>
    // Handling all of our errors here by alerting them
    function handleError(error) {
      if (error) {
        alert(error.message);
      }
    }
    
    // credentials
    
    var apiKey = '${API_KEY}';
    var sessionId = '${sessionId}';
    var token = '${token}';
      
    // connect to session
    
    var session = OT.initSession(apiKey, sessionId);
    
    // Replace token with your own value:
    session.connect(token, function(error) {
        if (error) {
          console.log('Unable to connect: ', error.message);
        } else {
          // document.getElementById('disconnectBtn').style.display = 'block';
          console.log('Connected to the session.');
          // connectionCount = 1;
        }
    });
      
    // create subscriber
    
    session.on('streamCreated', function(event) {
       // session.subscribe(event.stream);
       
       session.subscribe(event.stream, 'subscriber', {
            insertMode: 'append',
            width: '100%',
            height: '100%'
        }, handleError);
    });
      
    </script>
    <div>${sessionId}</div>
    </body>
    </html>`

        reply.type('text/html')
        reply.send(result)
    })

    fastify.get('/broadcast-client-data', async (req, reply) => {
        const eventId = req.query.eventId

        assert(eventId, 'eventId is required');

        const event = await app.dbm.findOneOrFail(Event, {
            id: eventId
        })

        const sourceUrl = event.streamingBroadcastLink

        reply.send({
            broadcast: {
                sourceUrl
            }
        })
    })

    fastify.get('/broadcast-client-html-hlsjs', async (req, reply) => {
        const eventId = req.query.eventId

        let sourceUrl = 'https://cdn-broadcast106-fra.tokbox.com/14051/14051_cfc10b0c-5f42-462c-b7cb-e2ab33fe4040.smil/playlist.m3u8'

        if (eventId) {
            const event = await app.dbm.findOneOrFail(Event, {
                id: eventId
            })

            sourceUrl = event.streamingBroadcastLink
        }

        const result = `
        <html>
        <body>
        
        <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
        <video 
            id="video"
            style="height: 95vh; width: calc(100% - 250px)"
            autoplay 
            muted
        ></video>
        <script>
          if(Hls.isSupported()) {
            var video = document.getElementById('video');
            var hls = new Hls();
            hls.loadSource('${sourceUrl}');
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED,function() {
              video.play();
          })
          // else if (video.canPlayType('application/vnd.apple.mpegurl'))
          //   {
          //       video.src = 'playlist.m3u8';
          //       video.addEventListener('canplay',function()
          //       {
          //           video.play();
          //       });
          //   }
         }
        </script>
    
    
        </body>
        </html>`

        reply.type('text/html')
        reply.send(result)
    })


    fastify.get('/broadcast-client-html-shaka', async (req, reply) => {
        const result = `
            <html>
            <body>
            <script src="https://cdn.jsdelivr.net/npm/shaka-player@3.1.0/dist/shaka-player.compiled.min.js"></script>
            
            <video
                id="my-player"
                class="video-js"
                controls
                preload="auto"
                poster="//vjs.zencdn.net/v/oceans.png"
                data-setup='{}'>
              <source src="https://cdn-broadcast102-fra.tokbox.com/15289/15289_049773d6-225a-4cf3-8429-7df8438f5e30.smil/playlist.m3u8" />
              <p class="vjs-no-js">
                To view this video please enable JavaScript, and consider upgrading to a
                web browser that
                <a href="https://videojs.com/html5-video-support/" target="_blank">
                  supports HTML5 video
                </a>
              </p>
            </video>
            
            </body>
            </html>`

        reply.type('text/html')
        reply.send(result)
    })

    fastify.get('/broadcast-client-html', async (req, reply) => {
        const result = `
            <html>
            <body>
                
            <link href="//vjs.zencdn.net/7.10.2/video-js.min.css" rel="stylesheet">
            <script src="//vjs.zencdn.net/7.10.2/video.min.js"></script>
            
            <video
                id="my-player"
                class="video-js"
                controls
                preload="auto"
                poster="//vjs.zencdn.net/v/oceans.png"
                data-setup='{}'>
              <source src="https://cdn-broadcast102-fra.tokbox.com/15288/15288_fad4e8ea-6f6f-44e8-9dbe-a133bc7dccd3.smil/playlist.m3u8" />
              <p class="vjs-no-js">
                To view this video please enable JavaScript, and consider upgrading to a
                web browser that
                <a href="https://videojs.com/html5-video-support/" target="_blank">
                  supports HTML5 video
                </a>
              </p>
            </video>
            
            </body>
            </html>`

        reply.type('text/html')
        reply.send(result)
    })


    fastify.get('/broadcast-start', async (req, reply) => {
        // const opentok = new OpenTok(API_KEY, API_SECRET);
        const sessionId = req.query.sessionId;

        // const broadcast = await new Promise((resolve, reject) => {
        //     opentok.startBroadcast(sessionId, {
        //         layout: {
        //             type: 'bestFit',
        //             resolution: '1280x720'
        //         },
        //         outputs: {
        //             hls: {},
        //             // rtmp: [{
        //             //     id: "foo",
        //             //     serverUrl: "rtmp://myfooserver/myfooapp",
        //             //     streamName: "myfoostream"
        //             // },
        //             // {
        //             //     id: "bar",
        //             //     serverUrl: "rtmp://mybarserver/mybarapp",
        //             //     streamName: "mybarstream"
        //             // }]
        //         },
        //     }, function (error, broadcast) {
        //         if (error) {
        //             console.log("Error creating session:", error);
        //             reject(error);
        //         } else {
        //             const activeBroadcast = {
        //                 id: broadcast.id,
        //                 session: broadcast.sessionId,
        //                 rmtp: broadcast.broadcastUrls.rmtp,
        //                 url: broadcast.broadcastUrls.hls,
        //                 // apiKey: apiKey,
        //                 // availableAt: broadcast.createdAt + broadcastDelay
        //             };
        //             resolve(activeBroadcast);
        //         }
        //     })
        // });

        const vonageService = new VonageService();
        const broadcast = await vonageService.startBroadcast(sessionId);

        reply.send({started: true, broadcast})
    });

    fastify.get('/broadcast-stop', async (req, reply) => {
        const opentok = new OpenTok(API_KEY, API_SECRET);
        const broadcastId = req.query.broadcastId;

        const broadcast = await new Promise((resolve, reject) => {
            opentok.stopBroadcast(broadcastId, function (error, broadcast) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                console.log('Broadcast stopped: ', broadcast.id);
                resolve(broadcast);
            })
        });

        reply.send({stopped: true, broadcast})
    });

    fastify.get('/broadcast-list', async (req, reply) => {
        const opentok = new OpenTok(API_KEY, API_SECRET);
        const sessionId = req.query.sessionId;

        const listBroadcastData = await new Promise((resolve, reject) => {
            opentok.listBroadcasts({sessionId}, function (error, listBroadcastData) {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                resolve(listBroadcastData);
            })
        });

        reply.send({listBroadcastData})
    });


// fastify.get('/broadcast-subscriber', async (req, reply) => {
//     const opentok = new OpenTok(API_KEY, API_SECRET);
//
//     const sessionId = req.query.sessionId;
//     const token = opentok.generateToken(sessionId);
//
//     const result = `<html>
//     <body>
//
//     <div id="videos">
//         <div id="subscriber"></div>
//         <div id="publisher"></div>
//     </div>
//
//     <!-- OpenTok.js library -->
//     <script src="https://static.opentok.com/v2/js/opentok.js"></script>
//     <script>
//     // Handling all of our errors here by alerting them
//     function handleError(error) {
//       if (error) {
//         alert(error.message);
//       }
//     }
//
//     // credentials
//
//     var apiKey = '${API_KEY}';
//     var sessionId = '${sessionId}';
//     var token = '${token}';
//
//     // connect to session
//
//     var session = OT.initSession(apiKey, sessionId);
//
//     // Replace token with your own value:
//     session.connect(token, function(error) {
//         if (error) {
//           console.log('Unable to connect: ', error.message);
//         } else {
//           // document.getElementById('disconnectBtn').style.display = 'block';
//           console.log('Connected to the session.');
//           // connectionCount = 1;
//         }
//     });
//
//     // create subscriber
//
//     session.on('streamCreated', function(event) {
//        // session.subscribe(event.stream);
//
//        session.subscribe(event.stream, 'subscriber', {
//             insertMode: 'append',
//             width: '100%',
//             height: '100%'
//         }, handleError);
//     });
//
//     </script>
//     <div>${sessionId}</div>
//     </body>
//     </html>`
//
//     reply.type('text/html')
//     reply.send(result)
// })


    fastify.get('/viewer', async (req, reply) => {
        const opentok = new OpenTok(API_KEY, API_SECRET);

        const sessionId = req.query.sessionId;
        const token = opentok.generateToken(sessionId);

        const result = `<html>
    <body>
    
    <div id="videos">
        <div id="subscriber"></div>
        <div id="publisher"></div>
    </div>

    <!-- OpenTok.js library -->
    <script src="https://static.opentok.com/v2/js/opentok.js"></script>
    <script>
    // Handling all of our errors here by alerting them
    function handleError(error) {
      if (error) {
        alert(error.message);
      }
    }
    
    // credentials
    
    var apiKey = '${API_KEY}';
    var sessionId = '${sessionId}';
    var token = '${token}';
      
    // connect to session
    
    var session = OT.initSession(apiKey, sessionId);
    
    // Replace token with your own value:
    session.connect(token, function(error) {
        if (error) {
          console.log('Unable to connect: ', error.message);
        } else {
          // document.getElementById('disconnectBtn').style.display = 'block';
          console.log('Connected to the session.');
          // connectionCount = 1;
        }
    });
      
    // create subscriber
    
    // session.on('streamCreated', function(event) {
    //    // session.subscribe(event.stream);
    //   
    //    session.subscribe(event.stream, 'subscriber', {
    //         insertMode: 'append',
    //         width: '100%',
    //         height: '100%'
    //     }, handleError);
    // });
    
    /** Listen for a broadcast status update from the host */
    session.on('signal:broadcast', function (event) {
      const status = event.data;
      // broadcastActive = status === 'active';

      if (status === 'active') {
        const name = stream.name;
        const insertMode = name === 'Host' ? 'before' : 'after';
        const properties = Object.assign({ name: name, insertMode: insertMode }, {});
        return session.subscribe(stream, 'hostDivider', properties, function (error) {
          if (error) {
            console.log(error);
          }
        });
      }
    });
    
    </script>
    <div>${sessionId}</div>
    </body>
    </html>`

        reply.type('text/html')
        reply.send(result)
    })

    next()
}

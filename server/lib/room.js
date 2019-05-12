const EventEmitter = require('events').EventEmitter
const protoo = require('protoo-server')
const mediasoup = require('mediasoup')

/**
 * Room class.
 *
 * This is not a "mediasoup Room" by itself, by a custom class that holds
 * a protoo Room (for signaling with WebSocket clients) and a mediasoup Router
 * (for sending and receiving media to/from those WebSocket peers).
 */
class Room extends EventEmitter {
	/**
	 * Factory function that creates and returns Room instance.
	 *
	 * @async
	 *
	 * @param {mediasoup.Worker} mediasoupWorker - The mediasoup Worker in which a new
	 *   mediasoup Router must be created.
	 */
	static async create(config) {
		const mediasoupWorker = await mediasoup.createWorker({
			logLevel: config.mediasoup.worker.logLevel,
			logTags: config.mediasoup.worker.logTags,
			rtcMinPort: config.mediasoup.worker.rtcMinPort,
			rtcMaxPort: config.mediasoup.worker.rtcMaxPort
		})

		mediasoupWorker.on('died', () => {
			setTimeout(() => {
				console.log('mediasoup died, stopping process')
				process.exit(1)
			}, 2000);
		})

		// Create a protoo Room instance.
		const protooRoom = new protoo.Room();

		// Router media codecs.
		let mediaCodecs = config.mediasoup.router.mediaCodecs;

		// Create a mediasoup Router.
		const mediasoupRouter = await mediasoupWorker.createRouter({
			mediaCodecs
		});


		return new Room({
			config,
			protooRoom,
			mediasoupRouter
		});
	}

	constructor({
		config,
		protooRoom,
		mediasoupRouter
	}) {
		super();

		this._config = config

		this.setMaxListeners(Infinity);

		// Closed flag.
		// @type {Boolean}
		this._closed = false;

		// protoo Room instance.
		// @type {protoo.Room}
		this._protooRoom = protooRoom;

		// Map of broadcasters indexed by id. Each Object has:
		// - {String} id
		// - {Object} data
		//   - {String} displayName
		//   - {Object} device
		//   - {RTCRtpCapabilities} rtpCapabilities
		//   - {Map<String, mediasoup.Transport>} transports
		//   - {Map<String, mediasoup.Producer>} producers
		//   - {Map<String, mediasoup.Consumers>} consumers
		// @type {Map<String, Object>}
		this._broadcasters = new Map();

		// mediasoup Router instance.
		// @type {mediasoup.Router}
		this._mediasoupRouter = mediasoupRouter;
	}

	/**
	 * Closes the Room instance by closing the protoo Room and the mediasoup Router.
	 */
	close() {
		this._closed = true;

		// Close the protoo Room.
		this._protooRoom.close();

		// Close the mediasoup Router.
		this._mediasoupRouter.close();

		// Emit 'close' event.
		this.emit('close');
	}

	/**
	 * Called from server.js upon a protoo WebSocket connection request from a
	 * browser.
	 *
	 * @param {String} peerId - The id of the protoo peer to be created.
	 * @param {Boolean} consume - Whether this peer wants to consume from others.
	 * @param {protoo.WebSocketTransport} protooWebSocketTransport - The associated
	 *   protoo WebSocket transport.
	 */
	handleProtooConnection({
		peerId,
		consume,
		protooWebSocketTransport
	}) {
		const existingPeer = this._protooRoom.getPeer(peerId);

		if (existingPeer) {
			existingPeer.close();
		}

		let peer;

		// Create a new protoo Peer with the given peerId.
		try {
			peer = this._protooRoom.createPeer(peerId, protooWebSocketTransport);
		} catch (error) {
			console.error('protooRoom.createPeer() failed:', error);
		}

		// Use the peer.data object to store mediasoup related objects.

		// Not joined after a custom protoo 'join' request is later received.
		peer.data.consume = consume;
		peer.data.joined = false;
		peer.data.displayName = undefined;
		peer.data.device = undefined;
		peer.data.rtpCapabilities = undefined;

		// Have mediasoup related maps ready even before the Peer joins since we
		// allow creating Transports before joining.
		peer.data.transports = new Map();
		peer.data.producers = new Map();
		peer.data.consumers = new Map();

		peer.on('request', (request, accept, reject) => {
			this._handleProtooRequest(peer, request, accept, reject)
				.catch((error) => {
					console.error('request failed:', error);

					reject(error);
				});
		});

		peer.on('close', () => {
			if (this._closed)
				return;

			// If the Peer was joined, notify all Peers.
			if (peer.data.joined) {
				for (const otherPeer of this._getJoinedPeers({
						excludePeer: peer
					})) {
					otherPeer.notify('peerClosed', {
							peerId: peer.id
						})
						.catch(() => {});
				}
			}

			// Iterate and close all mediasoup Transport associated to this Peer, so all
			// its Producers and Consumers will also be closed.
			for (const transport of peer.data.transports.values()) {
				transport.close();
			}
		});
	}

	getRouterRtpCapabilities() {
		return this._mediasoupRouter.rtpCapabilities;
	}

	/**
	 * Create a Broadcaster. This is for HTTP API requests (see server.js).
	 *
	 * @async
	 *
	 * @type {String} id - Broadcaster id.
	 * @type {String} displayName - Descriptive name.
	 * @type {Object} [device] - Additional info with name, version and flags fields.
	 * @type {RTCRtpCapabilities} [rtpCapabilities] - Device RTP capabilities.
	 */
	async createBroadcaster({
		id,
		displayName,
		device = {},
		rtpCapabilities
	}) {
		if (typeof id !== 'string' || !id)
			throw new TypeError('missing body.id');
		else if (typeof displayName !== 'string' || !displayName)
			throw new TypeError('missing body.displayName');
		else if (typeof device.name !== 'string' || !device.name)
			throw new TypeError('missing body.device.name');
		else if (rtpCapabilities && typeof rtpCapabilities !== 'object')
			throw new TypeError('wrong body.rtpCapabilities');

		if (this._broadcasters.has(id))
			throw new Error(`broadcaster with id "${id}" already exists`);

		const broadcaster = {
			id,
			data: {
				displayName,
				device: {
					flag: 'broadcaster',
					name: device.name || 'Unknown device',
					version: device.version
				},
				rtpCapabilities,
				transports: new Map(),
				producers: new Map(),
				consumers: new Map()
			}
		};

		// Store the Broadcaster into the map.
		this._broadcasters.set(broadcaster.id, broadcaster);

		// Notify the new Broadcaster to all Peers.
		for (const otherPeer of this._getJoinedPeers()) {
			otherPeer.notify(
					'newPeer', {
						id: broadcaster.id,
						displayName: broadcaster.data.displayName,
						device: broadcaster.data.device
					})
				.catch(() => {});
		}

		// Reply with the list of Peers and their Producers.
		const peerInfos = [];
		const joinedPeers = this._getJoinedPeers();

		// Just fill the list of Peers if the Broadcaster provided its rtpCapabilities.
		if (rtpCapabilities) {
			for (const joinedPeer of joinedPeers) {
				const peerInfo = {
					id: joinedPeer.id,
					displayName: joinedPeer.data.displayName,
					device: joinedPeer.data.device,
					producers: []
				};

				for (const producer of joinedPeer.data.producers.values()) {
					// Ignore Producers that the Broadcaster cannot consume.
					if (
						!this._mediasoupRouter.canConsume({
							producerId: producer.id,
							rtpCapabilities
						})
					) {
						continue;
					}

					peerInfo.producers.push({
						id: producer.id,
						kind: producer.kind
					});
				}

				peerInfos.push(peerInfo);
			}
		}

		return {
			peers: peerInfos
		};
	}

	/**
	 * Delete a Broadcaster.
	 *
	 * @type {String} broadcasterId
	 */
	deleteBroadcaster({
		broadcasterId
	}) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster)
			throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		for (const transport of broadcaster.data.transports.values()) {
			transport.close();
		}

		this._broadcasters.delete(broadcasterId);

		for (const peer of this._getJoinedPeers()) {
			peer.notify('peerClosed', {
					peerId: broadcasterId
				})
				.catch(() => {});
		}
	}

	/**
	 * Create a mediasoup Transport associated to a Broadcaster. It can be a
	 * PlainRtpTransport or a WebRtcTransport
	 *
	 * @async
	 *
	 * @type {String} broadcasterId
	 * @type {String} type - Can be 'plain' (PlainRtpTransport) or 'webrtc'
	 *   (WebRtcTransport).
	 * @type {Boolean} [rtcpMux=true] - Just for PlainRtpTransport, use RTCP mux.
	 * @type {Boolean} [comedia=true] - Just for PlainRtpTransport, enable remote IP:port
	 *   autodetection.
	 * @type {Boolean} [multiSource=false] - Just for PlainRtpTransport, allow RTP from any
	 *   remote IP and port (no RTCP feedback will be sent to the remote).
	 */
	async createBroadcasterTransport({
		broadcasterId,
		type,
		rtcpMux = true,
		comedia = true,
		multiSource = false
	}) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster)
			throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		switch (type) {
			case 'webrtc': {
				const {
					initialAvailableOutgoingBitrate
				} = this._config.mediasoup.webRtcTransport;

				const transport = await this._mediasoupRouter.createWebRtcTransport({
					listenIps: this._config.mediasoup.webRtcTransport.listenIps,
					enableUdp: true,
					enableTcp: false,
					initialAvailableOutgoingBitrate
				});

				// Store it.
				broadcaster.data.transports.set(transport.id, transport);

				return {
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters
				};
			}

			case 'plain': {
				const transport = await this._mediasoupRouter.createPlainRtpTransport({
					listenIp: this._config.mediasoup.webRtcTransport.listenIps[0],
					rtcpMux: Boolean(rtcpMux),
					comedia: Boolean(comedia),
					multiSource: Boolean(multiSource)
				});

				// Store it.
				broadcaster.data.transports.set(transport.id, transport);

				return {
					id: transport.id,
					ip: transport.tuple.localIp,
					port: transport.tuple.localPort,
					rtcpPort: transport.rtcpTuple ? transport.rtcpTuple.localPort : undefined
				};
			}

			default: {
				throw new TypeError('invalid type');
			}
		}
	}

	/**
	 * Create a mediasoup Producer associated to a Broadcaster.
	 *
	 * @async
	 *
	 * @type {String} broadcasterId
	 * @type {String} transportId
	 * @type {String} kind - 'audio' or 'video' kind for the Producer.
	 * @type {RTCRtpParameters} rtpParameters - RTP parameters for the Producer.
	 */
	async createBroadcasterProducer({
		broadcasterId,
		transportId,
		kind,
		rtpParameters
	}) {
		const broadcaster = this._broadcasters.get(broadcasterId);

		if (!broadcaster)
			throw new Error(`broadcaster with id "${broadcasterId}" does not exist`);

		const transport = broadcaster.data.transports.get(transportId);

		if (!transport)
			throw new Error(`transport with id "${transportId}" does not exist`);

		const producer =
			await transport.produce({
				kind,
				rtpParameters
			});

		// Store it.
		broadcaster.data.producers.set(producer.id, producer);

		// Optimization: Create a server-side Consumer for each Peer.
		for (const peer of this._getJoinedPeers()) {
			this._createConsumer({
				consumerPeer: peer,
				producerPeer: broadcaster,
				producer
			});
		}

		return {
			id: producer.id
		};
	}

	/**
	 * Handle protoo requests from browsers.
	 *
	 * @async
	 */
	async _handleProtooRequest(peer, request, accept, reject) {
		switch (request.method) {
			case 'getRouterRtpCapabilities': {
				accept(this._mediasoupRouter.rtpCapabilities);

				break;
			}

			case 'join': {
				// Ensure the Peer is not already joined.
				if (peer.data.joined)
					throw new Error('Peer already joined');

				const {
					displayName,
					device,
					rtpCapabilities
				} = request.data;

				// Store client data into the protoo Peer data object.
				peer.data.displayName = displayName;
				peer.data.device = device;
				peer.data.rtpCapabilities = rtpCapabilities;

				// Tell the new Peer about already joined Peers.
				// And also create Consumers for existing Producers.

				const peerInfos = [];
				const joinedPeers = [...this._getJoinedPeers(), ...Array.from(this._broadcasters.values())];

				for (const joinedPeer of joinedPeers) {
					peerInfos.push({
						id: joinedPeer.id,
						displayName: joinedPeer.data.displayName,
						device: joinedPeer.data.device
					});

					for (const producer of joinedPeer.data.producers.values()) {
						this._createConsumer({
							consumerPeer: peer,
							producerPeer: joinedPeer,
							producer
						});
					}
				}

				accept({
					peers: peerInfos
				});

				// Mark the new Peer as joined.
				peer.data.joined = true;

				// Notify the new Peer to all other Peers.
				for (const otherPeer of this._getJoinedPeers({
						excludePeer: peer
					})) {
					otherPeer.notify(
							'newPeer', {
								id: peer.id,
								displayName: peer.data.displayName,
								device: peer.data.device
							})
						.catch(() => {});
				}

				break;
			}

			case 'createWebRtcTransport': {
				// NOTE: Don't require that the Peer is joined here, so the client can
				// initiate mediasoup Transports and be ready when he later joins.

				const {
					forceTcp,
					producing,
					consuming
				} = request.data;
				const {
					maxIncomingBitrate,
					initialAvailableOutgoingBitrate
				} = this._config.mediasoup.webRtcTransport;

				const transport = await this._mediasoupRouter.createWebRtcTransport({
					listenIps: this._config.mediasoup.webRtcTransport.listenIps,
					enableUdp: !forceTcp,
					enableTcp: true,
					preferUdp: true,
					initialAvailableOutgoingBitrate,
					appData: {
						producing,
						consuming
					}
				});

				// Store the WebRtcTransport into the protoo Peer data Object.
				peer.data.transports.set(transport.id, transport);

				accept({
					id: transport.id,
					iceParameters: transport.iceParameters,
					iceCandidates: transport.iceCandidates,
					dtlsParameters: transport.dtlsParameters
				});

				// If set, apply max incoming bitrate limit.
				if (maxIncomingBitrate) {
					try {
						await transport.setMaxIncomingBitrate(maxIncomingBitrate);
					} catch (error) {}
				}

				break;
			}

			case 'connectWebRtcTransport': {
				const {
					transportId,
					dtlsParameters
				} = request.data;
				const transport = peer.data.transports.get(transportId);

				if (!transport)
					throw new Error(`transport with id "${transportId}" not found`);

				await transport.connect({
					dtlsParameters
				});

				accept();

				break;
			}

			case 'closeProducer': {
				// Ensure the Peer is joined.
				if (!peer.data.joined)
					throw new Error('Peer not yet joined');

				const {
					producerId
				} = request.data;
				const producer = peer.data.producers.get(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				producer.close();

				// Remove from its map.
				peer.data.producers.delete(producer.id);

				accept();

				break;
			}

			case 'pauseProducer': {
				// Ensure the Peer is joined.
				if (!peer.data.joined)
					throw new Error('Peer not yet joined');

				const {
					producerId
				} = request.data;
				const producer = peer.data.producers.get(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				await producer.pause();

				accept();

				break;
			}

			case 'resumeProducer': {
				// Ensure the Peer is joined.
				if (!peer.data.joined)
					throw new Error('Peer not yet joined');

				const {
					producerId
				} = request.data;
				const producer = peer.data.producers.get(producerId);

				if (!producer)
					throw new Error(`producer with id "${producerId}" not found`);

				await producer.resume();

				accept();

				break;
			}

			case 'pauseConsumer': {
				// Ensure the Peer is joined.
				if (!peer.data.joined)
					throw new Error('Peer not yet joined');

				const {
					consumerId
				} = request.data;
				const consumer = peer.data.consumers.get(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.pause();

				accept();

				break;
			}

			case 'resumeConsumer': {
				// Ensure the Peer is joined.
				if (!peer.data.joined)
					throw new Error('Peer not yet joined');

				const {
					consumerId
				} = request.data;
				const consumer = peer.data.consumers.get(consumerId);

				if (!consumer)
					throw new Error(`consumer with id "${consumerId}" not found`);

				await consumer.resume();

				accept();

				break;
			}

			default: {
				console.error('unknown request.method', request.method);

				reject(500, `unknown request.method "${request.method}"`);
			}
		}
	}

	/**
	 * Helper to get the list of joined protoo peers.
	 */
	_getJoinedPeers({
		excludePeer = undefined
	} = {}) {
		return this._protooRoom.peers
			.filter((peer) => peer.data.joined && peer !== excludePeer);
	}

	/**
	 * Creates a mediasoup Consumer for the given mediasoup Producer.
	 *
	 * @async
	 */
	async _createConsumer({
		consumerPeer,
		producerPeer,
		producer
	}) {
		// Optimization:
		// - Create the server-side Consumer. If video, do it paused.
		// - Tell its Peer about it and wait for its response.
		// - Upon receipt of the response, resume the server-side Consumer.
		// - If video, this will mean a single key frame requested by the
		//   server-side Consumer (when resuming it).

		// NOTE: Don't create the Consumer if the remote Peer cannot consume it.
		if (
			!consumerPeer.data.rtpCapabilities ||
			!this._mediasoupRouter.canConsume({
				producerId: producer.id,
				rtpCapabilities: consumerPeer.data.rtpCapabilities
			})
		) {
			return;
		}

		// Must take the Transport the remote Peer is using for consuming.
		const transport = Array.from(consumerPeer.data.transports.values())
			.find((t) => t.appData.consuming);

		// This should not happen.
		if (!transport) {
			return;
		}

		// Create the Consumer in paused mode.
		let consumer;

		try {
			consumer = await transport.consume({
				producerId: producer.id,
				rtpCapabilities: consumerPeer.data.rtpCapabilities,
				paused: producer.kind === 'video'
			});
		} catch (error) {
			console.log('_createConsumer() | transport.consume():', error);

			return;
		}

		// Store the Consumer into the protoo consumerPeer data Object.
		consumerPeer.data.consumers.set(consumer.id, consumer);

		// Set Consumer events.
		consumer.on('transportclose', () => {
			// Remove from its map.
			consumerPeer.data.consumers.delete(consumer.id);
		});

		consumer.on('producerclose', () => {
			// Remove from its map.
			consumerPeer.data.consumers.delete(consumer.id);

			consumerPeer.notify('consumerClosed', {
					consumerId: consumer.id
				})
				.catch(() => {});
		});

		consumer.on('producerpause', () => {
			consumerPeer.notify('consumerPaused', {
					consumerId: consumer.id
				})
				.catch(() => {});
		});

		consumer.on('producerresume', () => {
			consumerPeer.notify('consumerResumed', {
					consumerId: consumer.id
				})
				.catch(() => {});
		});

		consumer.on('score', (score) => {
			consumerPeer.notify('consumerScore', {
					consumerId: consumer.id,
					score
				})
				.catch(() => {});
		});

		consumer.on('layerschange', (layers) => {
			consumerPeer.notify(
					'consumerLayersChanged', {
						consumerId: consumer.id,
						spatialLayer: layers ? layers.spatialLayer : null,
						temporalLayer: layers ? layers.temporalLayer : null
					})
				.catch(() => {});
		});

		// Send a protoo request to the remote Peer with Consumer parameters.
		try {
			await consumerPeer.request(
				'newConsumer', {
					peerId: producerPeer.id,
					producerId: producer.id,
					id: consumer.id,
					kind: consumer.kind,
					rtpParameters: consumer.rtpParameters,
					type: consumer.type,
					appData: producer.appData,
					producerPaused: consumer.producerPaused
				});

			// Now that we got the positive response from the remote Peer and, if
			// video, resume the Consumer to ask for an efficient key frame.
			if (producer.kind === 'video')
				await consumer.resume();

			consumerPeer.notify(
					'consumerScore', {
						consumerId: consumer.id,
						score: consumer.score
					})
				.catch(() => {});
		} catch (error) {
			console.error('_createConsumer() | failed:', error);
		}
	}
}

module.exports = Room;
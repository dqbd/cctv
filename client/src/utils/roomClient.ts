import protooClient, { Peer } from 'protoo-client'
import { WS_URL } from './constants'

import * as mediasoupClient from 'mediasoup-client'


export type RoomConsumer = {
  id: string,
  type: string,
  locallyPaused: boolean,
  remotelyPaused: boolean,
  rtpParameters: any,
  spatialLayers: number,
  temporalLayers: number,
  preferredSpatialLayer: number,
  preferredTemporalLayer: number,
  codec: string,
  track: MediaStreamTrack,
  score: number,
}

export type RoomPeer = {
  id: string,
  displayName: string,
  device: object,
  consumers: string[]
}

type StateActions = {
  notify(payload: { type?: string, text: string }): any,
  setRoomState(state: string): any,
  addPeer(peer: RoomPeer): any,
  removePeer(peerId: string): any,
  addConsumer(consumer: RoomConsumer, peerId: string): any,
  removeConsumer(consumerId: string, peerId: string): any,
  setConsumerPaused(consumerId: string, sourceOfEvent: string): any,
  setConsumerResumed(consumerId: string, sourceOfEvent: string): any,
  setConsumerCurrentLayers(consumerId: string, spatialLayer: any, temporalLayer: any): any,
  setConsumerScore(consumerId: string, score: number): any,
}

export default class RoomClient {
  _closed: Boolean = false
  _forceTcp: Boolean = false
  _forceH264: Boolean = false
  _protooUrl: String
  _protoo: Peer | null = null
  _mediasoupDevice: mediasoupClient.Device | null | undefined  = null
  _recvTransport: mediasoupClient.Transport | null | undefined = null
  _consumers: Map<String, mediasoupClient.Consumer> = new Map()
  _stateActions: StateActions

  constructor({
    peerId,
    forceTcp,
    stateActions,
    roomId,
  }: {
    peerId: string,
    roomId: string,
    forceTcp: boolean,
    stateActions: StateActions,
  }) {
    this._forceTcp = forceTcp
    this._stateActions = stateActions
    this._protooUrl = `${WS_URL}/?peerId=${peerId}&roomId=${roomId}`
  }

  close() {
    if (this._closed)
      return;

    this._closed = true;

    if (this._protoo) {
      this._protoo.close();
    }

    if (this._recvTransport) {
      this._recvTransport.close();
    }

    this._stateActions.setRoomState('closed')
  }

  async join() {
    const protooTransport = new protooClient.WebSocketTransport(this._protooUrl);

    this._protoo = new protooClient.Peer(protooTransport);

    this._stateActions.setRoomState('connecting')

    this._protoo.on('open', () => this._joinRoom());

    this._protoo.on('failed', () => {
      this._stateActions.notify({
        type: 'error',
        text: 'WebSocket connection failed'
      });
    });

    this._protoo.on('disconnected', () => {
      this._stateActions.notify({
        type: 'error',
        text: 'WebSocket disconnected'
      });

      if (this._recvTransport) {
        this._recvTransport.close();
        this._recvTransport = null;
      }

      this._stateActions.setRoomState('closed')
    });

    this._protoo.on('close', () => {
      if (this._closed)
        return;

      this.close();
    });

    
    this._protoo.on('request', async (request: { method: string, data: any }, accept: () => any) => {
      switch (request.method) {
        case 'newConsumer': {
          const {
            peerId,
            producerId,
            id,
            kind,
            rtpParameters,
            type,
            appData,
            producerPaused
          } = request.data;

          if (this._recvTransport == null) return
          const consumer = await this._recvTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            appData: {
              ...appData,
              peerId
            } // Trick.
          });

          // Store in the map.
          this._consumers.set(consumer.id, consumer);

          consumer.on('transportclose', () => {
            this._consumers.delete(consumer.id);
          });

          const {
            spatialLayers,
            temporalLayers
          } =
          // @ts-ignore
          mediasoupClient.parseScalabilityMode(consumer.rtpParameters.encodings[0].scalabilityMode);

          this._stateActions.addConsumer({
            id: consumer.id,
            type: type,
            locallyPaused: false,
            remotelyPaused: producerPaused,
            rtpParameters: consumer.rtpParameters,
            spatialLayers: spatialLayers,
            temporalLayers: temporalLayers,
            preferredSpatialLayer: spatialLayers - 1,
            preferredTemporalLayer: temporalLayers - 1,
            codec: consumer.rtpParameters.codecs[0].mimeType.split('/')[1],
            track: consumer.track,
            score: 0,
          },
          peerId)

          // We are ready. Answer the protoo request so the server will
          // resume this Consumer (which was paused for now).
          accept();

          break;
        }
        default: {
          break;
        }
      }
    });

    this._protoo.on('notification', (notification: { method: string, data: any }) => {
      switch (notification.method) {
        case 'newPeer': {
          const peer = notification.data;

          this._stateActions.addPeer({
            ...peer,
            consumers: []
          })

          this._stateActions.notify({
            text: `${peer.displayName} has joined the room`
          });

          break;
        }

        case 'peerClosed': {
          const {
            peerId
          } = notification.data;

          this._stateActions.removePeer(peerId)

          break;
        }

        case 'consumerClosed': {
          const {
            consumerId
          } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          consumer.close();
          this._consumers.delete(consumerId);

          const {
            peerId
          } = consumer.appData;

          this._stateActions.removeConsumer(consumerId, peerId)

          break;
        }

        case 'consumerPaused': {
          const {
            consumerId
          } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          this._stateActions.setConsumerPaused(consumerId, 'remote')

          break;
        }

        case 'consumerResumed': {
          const {
            consumerId
          } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          this._stateActions.setConsumerResumed(consumerId, 'remote')

          break;
        }

        case 'consumerLayersChanged': {
          const {
            consumerId,
            spatialLayer,
            temporalLayer
          } = notification.data;
          const consumer = this._consumers.get(consumerId);

          if (!consumer)
            break;

          this._stateActions.setConsumerCurrentLayers(consumerId, spatialLayer, temporalLayer)

          break;
        }

        case 'consumerScore': {
          const {
            consumerId,
            score
          } = notification.data;

          this._stateActions.setConsumerScore(consumerId, score)

          break;
        }

        default: {
        }
      }
    });
  }

  async _joinRoom() {
    if (this._protoo == null) return
    try {
      this._mediasoupDevice = new mediasoupClient.Device();

      
      const routerRtpCapabilities =
        await this._protoo.request('getRouterRtpCapabilities');

      await this._mediasoupDevice.load({
        routerRtpCapabilities
      });

      // Create mediasoup Transport for sending (unless we don't want to consume).
      const transportInfo = await this._protoo.request(
        'createWebRtcTransport', {
          forceTcp: this._forceTcp,
          producing: false,
          consuming: true
        });

      const {
        id,
        iceParameters,
        iceCandidates,
        dtlsParameters
      } = transportInfo;

      this._recvTransport = this._mediasoupDevice.createRecvTransport({
        id,
        iceParameters,
        iceCandidates,
        dtlsParameters
      });

      this._recvTransport.on(
        'connect', ({
          dtlsParameters
        }, callback, errback) => 
        {
          if (this._protoo && this._recvTransport)
            this._protoo.request(
              'connectWebRtcTransport', {
                transportId: this._recvTransport.id,
                dtlsParameters
              })
            .then(callback)
            .catch(errback);
        });

      // Join now into the room.
      // NOTE: Don't send our RTP capabilities if we don't want to consume.
      const {
        peers
      } = await this._protoo.request(
        'join', {
          displayName: "",
          device: {},
          rtpCapabilities: this._mediasoupDevice.rtpCapabilities
        });

      this._stateActions.setRoomState('connected');

      this._stateActions.notify({
        text: 'You are in the room!',
      });

      for (const peer of peers) {
        this._stateActions.addPeer({
          ...peer,
          consumers: []
        });
      }
    } catch (error) {

      this._stateActions.notify({
        type: 'error',
        text: `Could not join the room: ${error}`
      });

      this.close();
    }
  }
}
import { EventEmitter } from "events";

export class Device {
  rtpCapabilities: any;
  constructor({ Handler }?: any);
  canProduce(kind: any): any;
  createRecvTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    iceServers,
    iceTransportPolicy,
    proprietaryConstraints,
    appData = {}
  }: any): Transport;
  createSendTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    iceServers,
    iceTransportPolicy,
    proprietaryConstraints,
    appData = {}
  }: any): any;
  load({ routerRtpCapabilities }: any): void;
}

export class Transport extends EventEmitter {
  id: any;
  constructor({
    direction,
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters,
    iceServers,
    iceTransportPolicy,
    proprietaryConstraints,
    appData,
    Handler,
    extendedRtpCapabilities,
    canProduceByKind
  }: any);
  close(): any;
  async getStats(): RTCStatsReport; 
  async restartIce({ iceParameters }: any): any;


	/**
	 * Update ICE servers.
	 *
	 * @param {Array<RTCIceServer>} [iceServers] - Array of ICE servers.
	 *
	 * @async
	 * @throws {InvalidStateError} if Transport closed.
	 * @throws {TypeError} if wrong arguments.
	 */
	async updateIceServers({ iceServers } = {}): any;

	/**
	 * Produce a track.
	 *
	 * @param {MediaStreamTrack} track - Track to sent.
	 * @param {Array<RTCRtpCodingParameters>} [encodings] - Encodings.
	 * @param {Object} [codecOptions] - Codec options.
	 * @param {Object} [appData={}] - Custom app data.
	 *
	 * @async
	 * @returns {Producer}
	 * @throws {InvalidStateError} if Transport closed or track ended.
	 * @throws {TypeError} if wrong arguments.
	 * @throws {UnsupportedError} if Transport direction is incompatible or
	 *   cannot produce the given media kind.
	 */
	async produce({
    track,
    encodings,
    codecOptions,
    appData = {}
  }: any): Producer;

	/**
	 * Consume a remote Producer.
	 *
	 * @param {String} id - Server-side Consumer id.
	 * @param {String} producerId - Server-side Producer id.
	 * @param {String} kind - 'audio' or 'video'.
	 * @param {RTCRtpParameters} rtpParameters - Server-side Consumer RTP parameters.
	 * @param {Object} [appData={}] - Custom app data.
	 *
	 * @async
	 * @returns {Consumer}
	 * @throws {InvalidStateError} if Transport closed.
	 * @throws {TypeError} if wrong arguments.
	 * @throws {UnsupportedError} if Transport direction is incompatible.
	 */
	async consume(
		{
			id,
			producerId,
			kind,
			rtpParameters,
			appData = {}
		} = {}): Consumer;
}

export class Consumer extends EventEmitter {
	constructor({ id, localId, producerId, track, rtpParameters, appData }: any)

	get id(): string
	get localId():string

	get producerId(): string
	get closed(): boolean
	get kind(): string
	get track(): MediaStreamTrack
	get rtpParameters(): RTCRtpSendParameters
	get paused(): boolean
	get appData(): { peerId: string }
	close(): void
	transportClosed(): void
};

export class Producer extends EventEmitter {

};

export function parseScalabilityMode(scalabilityMode: any): any;
export const version: string;

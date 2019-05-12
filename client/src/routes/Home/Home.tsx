import React, { useEffect, useRef, useReducer } from 'react'
import RoomClient, { RoomPeer, RoomConsumer } from '../../utils/roomClient'
import randomString from 'random-string'
import PeerList from '../../components/PeerList/PeerList'

type State = {
  consumers: { [key: string]: RoomConsumer },
  peers: { [key: string]: RoomPeer },
  roomState: string,
}

type Action =
  | { type: 'SET_ROOM_STATE', payload: string }
  | { type: 'ADD_PEER', payload: RoomPeer }
  | { type: 'REMOVE_PEER', payload: string }
  | { type: 'ADD_CONSUMER', payload: { consumer: RoomConsumer, peerId: string } }
  | { type: 'REMOVE_CONSUMER', payload: { consumerId: string, peerId: string } }
  | { type: 'SET_CONSUMER_PLAYBACK', payload: { consumerId: string, sourceOfEvent: string, paused: boolean } }
  | { type: 'SET_CONSUMER_LAYERS', payload: { consumerId: string, spatialLayer: any, temporalLayer: any } }
  | { type: 'SET_CONSUMER_SCORE', payload: { consumerId: string, score: number } }


const consumerReducer = (state: { [key: string]: RoomConsumer }, action: Action): { [key: string]: RoomConsumer } => {
  switch (action.type) {
    case 'ADD_CONSUMER': return { ...state, [action.payload.consumer.id]: action.payload.consumer }
    case 'REMOVE_CONSUMER': {
      const newState = { ...state }
      delete newState[action.payload.consumerId]
      return newState
    }
    case 'SET_CONSUMER_PLAYBACK': {
      const { consumerId, sourceOfEvent, paused } = action.payload
      const consumer = state[consumerId]
      if (!consumer) return state

      let newConsumer
      if (sourceOfEvent === 'local') {
        newConsumer = { ...consumer, locallyPaused: paused }
      } else {
        newConsumer = { ...consumer, remotelyPaused: paused }
      }

      return { ...state, [consumerId]: newConsumer }
    }
    case 'SET_CONSUMER_LAYERS': {
      const { consumerId, spatialLayer, temporalLayer } = action.payload
      const consumer = state[consumerId]
      if (!consumer) return state

      const newConsumer = {
        ...consumer, spatialLayer, temporalLayer
      }

      return { ...state, [consumerId]: newConsumer }
    }
    case 'SET_CONSUMER_SCORE': {
      const { consumerId, score } = action.payload
      const consumer = state[consumerId]
      if (!consumer) return state

      const newConsumer = { ...consumer, score }

      return { ...state, [consumerId]: newConsumer }
    }
  }
  return state
}

const peerReducer = (state: { [key: string]: RoomPeer }, action: Action): { [key: string]: RoomPeer } => {
  switch (action.type) {
    case 'ADD_PEER': return { ...state, [action.payload.id]: action.payload }
    case 'REMOVE_PEER': {
      const newState = {...state}
      delete newState[action.payload]
      return newState
    }
    case 'ADD_CONSUMER': {
      const { consumer, peerId } = action.payload
			const peer = state[peerId]
			if (!peer) return state

			const newConsumers = [ ...peer.consumers, consumer.id ]
			const newPeer = { ...peer, consumers: newConsumers }

			return { ...state, [newPeer.id]: newPeer }
    }
    case 'REMOVE_CONSUMER': {
      const { consumerId, peerId } = action.payload
			const peer = state[peerId]

			if (!peer) return state

			const idx = peer.consumers.indexOf(consumerId);
			if (idx === -1) return state

			const newConsumers = peer.consumers.slice()
			newConsumers.splice(idx, 1)

			const newPeer = { ...peer, consumers: newConsumers }
			return { ...state, [newPeer.id]: newPeer }
    }
  }
  return state
}

const roomReducer = (state: string, action: Action): string => {
  switch (action.type) {
    case 'SET_ROOM_STATE': return action.payload
  }
  return state
}

const reducer = (state: State, action: Action): State => {
  return {
    consumers: consumerReducer(state.consumers, action),
    peers: peerReducer(state.peers, action),
    roomState: roomReducer(state.roomState, action),
  }
}


export default () => {
  const clientRef = useRef<RoomClient>()
  const [state, dispatch] = useReducer(reducer, { consumers: {}, peers: {}, roomState: "" })

  useEffect(() => {
    clientRef.current = new RoomClient({
      peerId: randomString({ length: 8 }),
      forceTcp: false,
      stateActions: {
        notify(payload: { type?: string, text: string }): any {
          console.log(payload)
        },
        setRoomState: (state) => dispatch({ type: 'SET_ROOM_STATE', payload: state }),
        addPeer: (peer) => dispatch({ type: 'ADD_PEER', payload: peer }),
        removePeer: (peerId) => dispatch({ type: 'REMOVE_PEER', payload: peerId }),
        addConsumer: (consumer, peerId) => dispatch({ type: 'ADD_CONSUMER', payload: { consumer, peerId }}),
        removeConsumer: (consumerId, peerId) => dispatch({ type: 'REMOVE_CONSUMER', payload: { consumerId, peerId }}),
        setConsumerPaused: (consumerId, sourceOfEvent) => dispatch({ type: 'SET_CONSUMER_PLAYBACK', payload: { consumerId, sourceOfEvent, paused: true }}),
        setConsumerResumed: (consumerId, sourceOfEvent) => dispatch({ type: 'SET_CONSUMER_PLAYBACK', payload: { consumerId, sourceOfEvent, paused: false }}),
        setConsumerCurrentLayers: (consumerId, spatialLayer, temporalLayer) => dispatch({ type: 'SET_CONSUMER_LAYERS', payload: { consumerId, spatialLayer, temporalLayer }}),
        setConsumerScore: (consumerId, score) => dispatch({ type: 'SET_CONSUMER_SCORE', payload: { consumerId, score }})
      }
    })

    clientRef.current.join()

    return () => {
      if (clientRef.current) {
        clientRef.current.close()
      }
    }
  }, [])

  console.log(state)

  return (
    <div>
      <PeerList
        peers={state.peers}
        consumers={state.consumers}
      />
    </div>
  )
}
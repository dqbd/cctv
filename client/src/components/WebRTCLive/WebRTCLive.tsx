import React from 'react'
import useWebRTCRoom from '../../utils/useWebRTCRoom'
import PeerView from '../../components/PeerView/PeerView'

export default ({ room }: { room: string }) => {
  const state = useWebRTCRoom(room)
  const peer = state.peers[room]
  
  if (!peer) return null
  
  const consumerList = peer.consumers.map(consumerId => state.consumers[consumerId])
  const videoConsumer = consumerList.find((consumer) => consumer.track.kind === 'video')

  const videoVisible = (
    videoConsumer &&
    !videoConsumer.locallyPaused &&
    !videoConsumer.remotelyPaused &&
    videoConsumer.score < 5
  )

  return <PeerView
    videoTrack={videoConsumer ? videoConsumer.track : null}
    videoVisible={!!videoVisible}
  />
}
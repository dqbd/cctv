import React from 'react';
import styles from './PeerList.module.css';
import { RoomPeer, RoomConsumer } from '../../utils/roomClient'
import PeerView from '../PeerView/PeerView';

type Props = {
  peers: { [key: string]: RoomPeer },
  consumers: { [key: string]: RoomConsumer },
}

const PeerList = ({ peers, consumers }: Props) => {
  return (
    <div>
      {Object.values(peers).map(peer => {
        const consumerList = peer.consumers.map(consumerId => consumers[consumerId])
        const videoConsumer = consumerList.find((consumer) => consumer.track.kind === 'video')

        const videoVisible = (
          videoConsumer &&
          !videoConsumer.locallyPaused &&
          !videoConsumer.remotelyPaused &&
          videoConsumer.score < 5
        )

        return (
          <div key={peer.id}>
            <PeerView
              videoTrack={videoConsumer ? videoConsumer.track : null}
              videoVisible={!!videoVisible}
            />
          </div>
        )
      })}
    </div>
  )
}

export default PeerList
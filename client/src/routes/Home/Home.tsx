import React from 'react'
import DataProvider from '../../utils/dataProvider'

import PeerView from '../../components/PeerView/PeerView'
import styles from './Home.module.css'
import { COLORS } from 'utils/constants';
import { useWebRTCRoom } from '../../utils/useWebRTCRoom'
import { NavLink } from 'react-router-dom';

export default () => {
  const state = useWebRTCRoom('')

  return (
    <div>
      <div className={styles.list}>
        <DataProvider.Consumer>
          {({ streams }) => streams.map(({ key, name }, index) => {

            const peer = state.peers[key]
            let videoContent = null
            
            if (peer) {
              const consumerList = peer.consumers.map(consumerId => state.consumers[consumerId])
              const videoConsumer = consumerList.find((consumer) => consumer.track.kind === 'video')

              const videoVisible = (
                videoConsumer &&
                !videoConsumer.locallyPaused &&
                !videoConsumer.remotelyPaused &&
                videoConsumer.score < 5
              )

              videoContent = <PeerView
                videoTrack={videoConsumer ? videoConsumer.track : null}
                videoVisible={!!videoVisible}
              />
            }

            return (
              <NavLink to={`/camera/${key}`}>
                <article className={styles.item} key={key}>
                  <section className={styles.header}>
                    <h2 className={styles.name}>{name}</h2>
                    <span className={styles.color} style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  </section>
                  <div className={styles.video}>{videoContent}</div>
                </article>
              </NavLink>
            )
          })}
        </DataProvider.Consumer>
      </div>
    </div>
  )
}
import React from 'react'
import DataProvider from '../../utils/dataProvider'

import styles from './Home.module.css'
import { COLORS, API_URL } from 'utils/constants';
import { NavLink } from 'react-router-dom';
import { RefreshImg } from '../../components/RefreshImg/RefreshImg';

export default () => {
  return (
    <div>
      <div className={styles.list}>
        <DataProvider.Consumer>
          {({ streams }) => streams.map(({ key, name }, index) => (
            <NavLink to={`/camera/${key}`}>
              <article className={styles.item} key={key}>
                <section className={styles.header}>
                  <h2 className={styles.name}>{name}</h2>
                  <span className={styles.color} style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                </section>
                <div className={styles.video}>
                  <RefreshImg src={`${API_URL}/frame/${key}`} alt={name} />
                </div>
              </article>
            </NavLink>
          ))}
        </DataProvider.Consumer>
      </div>
    </div>
  )
}
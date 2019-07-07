import React from 'react'
import ControlModal from '../ControlModal/ControlModal'
import styles from './TimeModal.module.css'

const debounce = (func: (...args: any) => any, delay: number) => {

  let timer: number | null = null

  return (...args: any) => {

    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export default ({
  onClose
}: {
  onClose: () => any,
}) => {

  const handleScroll = debounce((e: any) => {
    console.log(e.target)
  }, 200)

  return (
    <ControlModal
      onOutsideClick={onClose}
    >
      <div className={styles.time}>
        <div className={styles.picker} onScroll={handleScroll}>
          {Array(24).fill(0).map((_, index) => <span className={styles.item}>{index.toString().padStart(2, '0')}</span>)}
        </div>

        <div className={styles.picker}>
          {Array(60).fill(0).map((_, index) => <span className={styles.item}>{index.toString().padStart(2, '0')}</span>)}
        </div>
      </div>
    </ControlModal>
  )
}
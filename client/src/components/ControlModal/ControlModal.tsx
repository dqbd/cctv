import React, { Component } from 'react'
import { createPortal } from 'react-dom'

import styles from './ControlModal.module.css'

const modalRoot = window.document.getElementById('modal-root')

type Props = {
  onOutsideClick: () => any,
}

export default class ControlModal extends Component<Props> {
  domElement = window.document.createElement("div")

  onOutsideClick = (e: MouseEvent) => {
    console.log('outside click')
    e.preventDefault()
    this.props.onOutsideClick()
  }

  onInsideClick = (e: any) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopPropagation()
    console.log('inside click')
  }
  
  componentDidMount() {
    if (modalRoot) {
      modalRoot.appendChild(this.domElement)
      modalRoot.addEventListener('click', this.onOutsideClick)
    }
  }
  
  componentWillUnmount() {
    if (modalRoot) {
      modalRoot.removeChild(this.domElement)
      modalRoot.removeEventListener('click', this.onOutsideClick)
    }
  }

  render() {
    const { children } = this.props
    return createPortal(
      <div className={styles.container} onClick={this.onInsideClick}>
        <div className={styles.modal}>
          {children}
        </div>
        <div className={styles.background} />
    </div>,
      this.domElement,
    )
  }
}
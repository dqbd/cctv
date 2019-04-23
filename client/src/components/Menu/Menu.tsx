import React, { Component } from 'react'
import styles from './Menu.module.css'
import { NavLink } from 'react-router-dom'

type Props = {
  streams: {
    name: string,
    key: string,
    port: number,
  }[]
}

export default class Menu extends Component<Props> {
	state = {
		showMenu: false,
	}

	handleOnMenu = () => {
		try {
			navigator.vibrate(100)
		} catch (err) {}
		this.setState({ showMenu: !this.state.showMenu })
	}

	componentDidMount() {
		// this.wakelock = new NoSleep()
	}

	componentWillUnmount() {
		// if (this.wakelock) {
		// 	this.wakelock.disable()
		// }
	}

	enableNoSleep = () => {
		try {
			navigator.vibrate(100)
		} catch (err) {}

		this.handleOnMenu()
		// if (this.wakelock) {
		// 	this.wakelock.enable()
		// }
	}

	render() {
		return (
			<header className={styles.header}>
				<h1>Kamera</h1>
				<nav className={this.state.showMenu ? undefined : styles.hide}>
					{ this.props.streams.map(({ name, key }) => (
						<NavLink activeClassName={styles.active} to={`/camera/${key}`} key={key}>{name}</NavLink>
					))}
				</nav>
				<a className={styles.btn} onClick={this.handleOnMenu}>☰</a>
			</header>
		);
	}
}

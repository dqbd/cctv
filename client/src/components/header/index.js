import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';
import NoSleep from 'nosleep.js';

export default class Header extends Component {
	state = {
		streams: []
	}

	componentDidMount() {
		this.wakelock = new NoSleep()
		fetch('/streams')
			.then(a => a.json())
			.then(({ data }) => {
				this.setState({ streams: data })
			})
	}

	componentWillUnmount() {
		if (this.wakelock) {
			this.wakelock.disable()
		}
	}

	enableNoSleep = () => {
		if (this.wakelock) {
			this.wakelock.enable()
		}
	}

	render() {
		return (
			<header class={style.header}>
				<h1>Kamera</h1>
				<nav>
					{ this.state.streams.map(({ name, key }) => (
						<Link activeClassName={style.active} onClick={this.enableNoSleep} href={`/camera/${key}`} key={key}>{name}</Link>
					))}
				</nav>
			</header>
		);
	}
}

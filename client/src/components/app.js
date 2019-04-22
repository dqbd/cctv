import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';
import Home from '../routes/home';
import Camera from '../routes/camera';

import { BASE_URL } from '../constants'

export default class App extends Component {

	state = {
		streams: [],
	}

	componentDidMount() {
		fetch(`${BASE_URL}/streams`)
			.then(a => a.json())
			.then(({ data }) => {
				this.setState({ streams: data })
			})
	}

	handleRoute = e => {
		this.currentUrl = e.url
	}

	render() {
		return (
			<div id="app">
				<Header streams={this.state.streams} />
				<Router onChange={this.handleRoute}>
					<Home path="/" />
					<Camera path="/camera/:name" streams={this.state.streams} />
				</Router>
			</div>
		);
	}
}

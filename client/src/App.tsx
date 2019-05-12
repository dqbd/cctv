import React, { Component } from 'react'
import { BrowserRouter as Router, Route, RouteComponentProps } from 'react-router-dom'

import Menu from './components/Menu/Menu';
import Home from './routes/Home/Home';
import Camera from './routes/Camera/Camera';

import { API_URL } from './utils/constants'

export default class App extends Component {

	state = {
		streams: [],
	}

	componentDidMount() {
		fetch(`${API_URL}/streams`)
			.then(a => a.json())
			.then(({ data }) => {
				this.setState({ streams: data })
			})
	}

	render() {
		return (
			<Router>
				<div id="app">
					<Menu streams={this.state.streams} />
						<Route path="/" component={Home} />
						<Route path="/camera/:name" render={({ match }: RouteComponentProps<{ name: string }>) => (<Camera name={match.params.name} streams={this.state.streams} />)} />
				</div>
			</Router>
		);
	}
}

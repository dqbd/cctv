import { h, Component } from 'preact';
import { Link } from 'preact-router/match';
import style from './style';

export default class Header extends Component {
	render() {
		return (
			<header class={style.header}>
				<h1>Kamera</h1>
				<nav>
					<Link activeClassName={style.active} href="/camera/VENKU">Venku</Link>
					<Link activeClassName={style.active} href="/camera/OBCHOD">Obchod</Link>
				</nav>
			</header>
		);
	}
}

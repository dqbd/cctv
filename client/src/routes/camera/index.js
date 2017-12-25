import { h, Component } from 'preact';
import style from './style';
import Hls from 'hls.js';

export default class Camera extends Component {
	state = {
        url: undefined,
        from: undefined,
        to: undefined,
        shift: undefined,
        showTools: false,
    }
    
    hls = undefined
    timer = undefined
    ref = undefined

    generateUrl = ({ name, from, to, shift }) => {
        let baseUrl = `/${name}/`
        let type = 'stream.m3u8'

        let params = []
        if (from > 0 && to > 0 && from < to) {
            type = 'stream.m3u8'
            params.push(`from=${from}`)
            params.push(`to=${to}`)
        } else if (shift > 0) {
            params.push(`shift=${shift}`)
        }

        baseUrl += type
        if (params.length > 0) {
            baseUrl += '?' + params.join('&')
        }

        return baseUrl
    }

    getUrl = (props = this.props) => {
        const { name } = props
        const { from, to, shift } = this.state
        
        return this.generateUrl({ name, from, to, shift })
    }

	// gets called when this route is navigated to
	componentDidMount() {
        this.handlePlayback()
    }
    
    componentWillUpdate(newProps) {
        if (this.props.name !== newProps.name) {
            this.setState({ from: undefined, to: undefined, shift: undefined })
        }
    }

    componentDidUpdate(oldProps) {
        if (this.getUrl(oldProps) !== this.getUrl(this.props)) {
            this.handlePlayback()
        }
    }

    videoRef = (ref) => {
        this.ref = ref
        this.handlePlayback()
    }
    
    handlePlayback = () => {
        const url = this.getUrl()
        if (url && this.ref) {
            clearTimeout(this.timer)
            if (this.hls) {
                this.hls.destroy()
            }

            this.hls = new Hls()
            this.hls.loadSource(url)
            this.hls.attachMedia(this.ref)
            this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                this.timer = setTimeout(this.autoplay, 300)
            });
        }
    }

    autoplay = () => {
        if (this.hls && this.ref) {
            this.ref.play()
        }
    }

    toggleTools = () => {
        this.setState({ showTools: !this.state.showTools })
    }

	componentWillUnmount() {
        clearTimeout(this.timer)
        if (this.hls) this.hls.destroy()
    }

    handleDateChange = (e) => {
        const value = e.target.value
        const name = e.target.id

        this.setState({ [name]: Date.parse(value) / 1000 })
    }

    handleShiftChange = (e) => {
        const value = e.target.value
        this.setState({ shift: Number.parseInt(value, 10) })
    }

    getValidInputString = (val) => {
        if (!val) return undefined
        const date = new Date(val * 1000)
        const pad = (num) => {
            const norm = Math.floor(Math.abs(num))
            return (norm < 10 ? '0' : '') + norm
        }
        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes())
    }

	render({ name }, { url, shift, from, to, showTools }) {
		return (
			<div class={style.camera}>
				<video class={style.video} ref={this.videoRef} />
                <div class={style.controls}>
                    { showTools && <div class={style.panel}>
                        <div class={style.label}>
                            <label for="from">Od:</label>
                            <input type="datetime-local" id="from" onChange={this.handleDateChange} value={this.getValidInputString(from)} />
                        </div>
                        <div class={style.label}>
                            <label for="to">Do:</label>
                            <input type="datetime-local" id="to" onChange={this.handleDateChange} value={this.getValidInputString(to)}/>
                        </div>
                        <div class={style.label}>
                            <label for="shift">Posun:</label>
                            <input type="number" min="0" max="86400" id="shift" onChange={this.handleShiftChange} value={shift} />
                        </div>
                    </div> }
                    <div class={style.playback}>
                        <div onClick={this.toggleTools}>👀</div>
                        <div onClick={this.handlePlayback}>▶️</div>
                    </div>
                </div>
			</div>
		);
	}
}

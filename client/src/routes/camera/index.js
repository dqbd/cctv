import { h, Component } from 'preact';
import style from './style';
import Hls from 'hls.js';
import Scrobber from '../../components/scrobber';

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
        let baseUrl = `http://192.168.1.135/data/${name}/`
        let type = 'stream.m3u8'

        let params = []
        if (from > 0) {
            type = 'slice.m3u8'
            params.push(`from=${from}`)

            if (to > 0 && from < to) {
                params.push(`to=${to}`)
            }
        } else if (shift > 0) {
            params.push(`shift=${shift}`)
        }

        baseUrl += type
        if (params.length > 0) {
            baseUrl += '?' + params.join('&')
        }

        return baseUrl
    }

    getUrl = (props = this.props, state = this.state) => {
        const { name } = props
        const { from, to, shift } = state

        const url = this.generateUrl({ name, from, to, shift })
        return url
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

    componentDidUpdate(oldProps, oldState) {
        // if (this.getUrl(oldProps, oldState) !== this.getUrl(this.props, this.state)) {
        // }
        this.handlePlayback()
    }

    videoRef = (ref) => {
        this.ref = ref
        this.handlePlayback()
    }
    
    handlePlayback = () => {
        const url = this.getUrl()

        console.log('handlePlayback', url)
        if (url && this.ref) {
            clearTimeout(this.timer)

            if (Hls.isSupported()) {
                if (this.hls) {
                    this.ref.pause()
                    this.hls.destroy()
                }
    
                this.hls = new Hls()
                this.hls.loadSource(url)
                this.hls.attachMedia(this.ref)
                this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    this.timer = setTimeout(this.autoplay, 300)
                })
            } else {
                this.ref.src = url
                setTimeout(this.autoplay, 300)
            }
        }
    }

    autoplay = () => {
        if (this.ref) {
            this.ref.play()
        }
    }

	componentWillUnmount() {
        clearTimeout(this.timer)
        if (this.hls) this.hls.destroy()
    }

    handlePause = () => {
        if (this.ref) {
            this.ref.pause()
        }
    }

    handleShiftChange = (shift) => {
        this.setState({ shift })
    }

	render({ name }, { url, shift, from, to, showTools }) {
		return (
			<div class={style.camera}>
				<video class={style.video} autoplay muted playsinline ref={this.videoRef} />
                <Scrobber onShift={this.handleShiftChange} onStop={this.handlePause} />
			</div>
		);
	}
}

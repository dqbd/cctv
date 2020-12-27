"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
class Manifest {
    getManifest(segments, seq, end = false) {
        const { config  } = this;
        const buffer = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            `#EXT-X-TARGETDURATION:${config.segmentSize}`,
            `#EXT-X-MEDIA-SEQUENCE:${seq}`, 
        ];
        segments.forEach(({ filename , extinf  })=>{
            buffer.push(`#EXTINF:${extinf || "4.000"},`);
            buffer.push(filename);
        });
        if (end) {
            buffer.push("#EXT-X-ENDLIST");
        }
        return buffer.join("\n") + "\n";
    }
    constructor(config){
        this.config = config;
    }
}
exports.Manifest = Manifest;

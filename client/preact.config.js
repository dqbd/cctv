import CopyWebpackPlugin from 'copy-webpack-plugin'

export default config => {
    // Take everything under src/assets and copy it into root build destination
    config.plugins.push( new CopyWebpackPlugin([{ context: `${__dirname}/src/assets`, from: `*.*` }]) );
}
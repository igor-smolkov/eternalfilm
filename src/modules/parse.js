function youtubeGetID(input){
    var r = input.replace(/(>|<)/gi,'').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/)
    if(r[2] !== undefined) {
        return r[2].split(/[^0-9a-z_\-]/i)[0]
    } else {
        r = input.match(/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/)
        if(r && r[1] !== undefined) {
            return r[1]
        }
        else return 'error'
    }
}
export { youtubeGetID as ytLink };
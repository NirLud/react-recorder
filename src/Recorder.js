'use strict'

import React, { Component } from 'react'
import PropTypes from 'prop-types'

export default class Recorder extends Component {
  start () {
    this.mediaRecorder.start()
  }

  stop () {
    this.mediaRecorder.stop()
  }

  pause () {
    this.mediaRecorder.pause()
  }

  resume () {
    this.mediaRecorder.resume()
  }

  componentDidMount () {
    let supportsMediaDevices = !!navigator.mediaDevices.getUserMedia
    const getUserMedia =
      navigator.mediaDevices.getUserMedia ||
      navigator.getUserMedia ||
      navigator.mozGetUserMedia ||
      navigator.msGetUserMedia ||
      navigator.webkitGetUserMedia

    if (getUserMedia && window.MediaRecorder) {
      const { constraints } = this.props
      this.chunks = []
      const {
        blobOpts,
        onStop,
        onError,
        mediaOpts,
        onPause,
        onResume,
        onStart,
        gotStream
      } = this.props

      const onErr = err => {
        console.warn(err)
        if (onError) onError(err)
      }

      const onSuccess = stream => {
        this.mediaRecorder = new window.MediaRecorder(stream, mediaOpts || {})

        this.mediaRecorder.ondataavailable = e => {
          this.chunks.push(e.data)
        }

        this.mediaRecorder.onstop = e => {
          const blob = new window.Blob(
            this.chunks,
            blobOpts || { type: 'audio/wav' }
          )
          this.chunks = []
          onStop(blob)
        }

        this.mediaRecorder.onerror = onErr
        if (onPause) this.mediaRecorder.onpause = onPause
        if (onResume) this.mediaRecorder.onresume = onResume
        if (onStart) this.mediaRecorder.onstart = onStart
        this.stream = stream
        if (gotStream) gotStream(stream)
      }

      if (supportsMediaDevices) {
        Promise.resolve(navigator.mediaDevices.getUserMedia(constraints))
          .then(stream => onSuccess(stream))
          .catch(err => onErr(err))
      } else {
        navigator.getUserMedia(constraints, onSuccess, onError)
      }
    } else {
      console.warn('Audio recording APIs not supported by this browser')
      const { onMissingAPIs } = this.props
      if (onMissingAPIs) {
        onMissingAPIs(navigator.getUserMedia, window.MediaRecorder)
      } else {
        window.alert(
          "Your browser doesn't support native microphone recording. For best results, we recommend using Google Chrome or Mozilla Firefox to use this site."
        )
      }
    }
  }

  componentDidUpdate (prevProps) {
    if (
      this.props.command &&
      this.props.command !== 'none' &&
      prevProps.command !== this.props.command
    ) {
      this[this.props.command]()
    }
  }

  componentWillUnmount () {
    if (this.props.onUnmount) this.props.onUnmount(this.stream)
  }

  render () {
    return false
  }
}

Recorder.propTypes = {
  className: PropTypes.string,
  command: PropTypes.oneOf(['start', 'stop', 'pause', 'resume', 'none']),
  constraints: PropTypes.object,
  onStop: PropTypes.func.isRequired,
  onMissingAPIs: PropTypes.func,
  onError: PropTypes.func,
  onPause: PropTypes.func,
  onStart: PropTypes.func,
  onResume: PropTypes.func,
  onUnmount: PropTypes.func,
  gotStream: PropTypes.func,
  blobOpts: PropTypes.object,
  mediaOpts: PropTypes.object
}

Recorder.defaultProps = {
  constraints: { audio: true }
}

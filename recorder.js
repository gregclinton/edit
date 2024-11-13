const recorder = {
    start: () => {
        recorder.recording = true;
        navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            recorder.stream = stream;
            recorder.device = new RecordRTC(recorder.stream, {
                mimeType: 'audio/webm',
                timeSlice: 1000,
                recorderType: RecordRTC.StereoAudioRecorder,
                numberOfAudioChannels: 1,
                audioBitsPerSecond: 128000
            });
            recorder.device.startRecording();
        })
    },

    stop: () => recorder.device.stopRecording(recorder.close),

    send: () => {
        recorder.device.stopRecording(() => {
            const blob = recorder.device.getBlob();

            chat.waiting = true;
            recorder.close();
            recorder.stt(blob)
            .then(res => res.text())
            .then(prompt => {
                const text = prompt.trim();

                navigator.clipboard.writeText(text);
                chat.prompt(text);
            });
        });
    },

    close: () => {
        recorder.stream.getTracks().forEach(track => { track.stop(); });
        recorder.stream = null;
        recorder.device = null;
        recorder.recording = false;
    },

    stt: blob => {
        const data = new FormData();

        data.append('file', blob, 'stt.webm');
        data.append('model', 'whisper-1');
        data.append('language', 'en'); // optional but improves accuracy and latency
        data.append('response_format', 'text');

        return fetch('/openai/v1/audio/transcriptions', {
            method: 'POST',
            body: data
        })
    }
}
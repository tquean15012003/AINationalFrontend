import React, { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import Axios from 'axios'
import FormData from "form-data";

export default function WebcamVideo() {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
  }, [webcamRef, setCapturing, mediaRecorderRef, handleDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
  }, [mediaRecorderRef, setCapturing]);

  const handleDownload = useCallback(async () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);

      const mediaBlob = await fetch(url)
        .then(response => response.blob());

      const myFile = new File(
        [mediaBlob],
        "demo.mp4",
        { type: 'video/mp4' }
      );

      const data = new FormData()

      data.append('video', myFile)
      
      console.log(data)

      await Axios({
        url: `http://localhost:4000/annote/video`,
        method: 'POST',
        data: data
      }).then(function (response) {
        console.log(JSON.stringify(response.data));
      })
        .catch(function (error) {
          console.log(error);
        });


      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks]);

  const videoConstraints = {
    width: 520,
    height: 520,
    facingMode: "user",
  };

  return (
    <div className="Container">
      <Webcam
        height={500}
        width={500}
        audio={false}
        mirrored={true}
        ref={webcamRef}
        videoConstraints={videoConstraints}
      />
      {capturing ? (
        <button onClick={() => {
          handleStopCaptureClick()
        }}>Stop Capture</button>
      ) : (
        <button onClick={() => {
          handleStartCaptureClick()
        }}>Start Capture</button>
      )}
      {recordedChunks.length > 0 && (
        <button onClick={() => {
          handleDownload()
        }}>Download</button>
      )}
    </div>
  );
}
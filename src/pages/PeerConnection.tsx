import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import Peer from 'peerjs';
import { useParams } from 'react-router-dom';

function PeerConnection() {
  const [username, setUsername] = useState<string | null>('kamal');
  const [myPeerID, setMyPeerID] = useState<string | null>(null);                // Store the peer ID
  const [remotePeerId, setRemotePeerId] = useState<string | null>(null);        // Store the remote peer ID

  const [socket, setSocket] = useState<WebSocket | null>(null);                 // Store the WebSocket object
  const [incomeSocketMsg, setIncomeSocketMsg] = useState<string | null>(null);  // Store the WebSocket message

  const [peer, setPeer] = useState<Peer | null>(null);                          // store the peer object

  const localVideoRef = useRef<HTMLVideoElement | null >(null);                  // store the local video
  const remoteVideoRef = useRef<HTMLVideoElement | null >(null);                 // store the remote video

  const [isCall, setIsCall] = useState<boolean>(false);
  const [isAnswer, setIsAnswer] = useState<boolean>(false);

  const {user_name} = useParams();

  const getUserStream = async() => {
    
    try{
      return await navigator.mediaDevices.getUserMedia({video: true, audio: true});

    }catch (error){

      console.error("error access media devices : ", error);
      window.alert("could not access your media devices, please allow access");
    }
    
  }

  const sendFindUserMessage = async () => {
    if (socket && socket.readyState === WebSocket.OPEN) {  

      const msg = JSON.stringify({ type: "join_conference" });
      console.log("Sending message:", msg);
      socket.send(msg);

    } else {

      console.error("WebSocket is not open.");
    }
  };

  const userCall = async () => {
    if (!remotePeerId) {
      console.log("Remote peer ID is missing");
      return;
    }
  
    const localStream = await getUserStream();
  
    if (!localStream) {
      console.log("Failed to get local media stream");
      return;
    }
  
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream; 
    }
  
    if (peer) {
      const call = peer.call(remotePeerId, localStream); 

      call.on("stream",(remoteStream) => {
        if(remoteVideoRef.current){
          remoteVideoRef.current.srcObject = remoteStream;
        }
      })

      call.on('close',() => {
        console.log("call is end..");
      })
    }
  };

  const userAnswer = async() => {

    const localStream = await getUserStream();

    if (!localStream){
      console.log("Failed to get local media stream");
      return
    }

    if (localVideoRef.current){
      localVideoRef.current.srcObject = localStream;
    }

    if(peer){
      peer.on('call',(incommingCall) =>{

        incommingCall.answer(localStream)
        incommingCall.on("stream", (recivedStream) => {

          if(remoteVideoRef.current){
            remoteVideoRef.current.srcObject = recivedStream;
          }
        })
        incommingCall.on("close",() =>{
          console.log("call end ...")
        });

      });
    }

  }
  

  const disconnect = async() => {
    if(socket){
      socket.close();
      console.log("websocket is disconnect.");
    }
  }

  useEffect(() => {
    const newUniqueId: string = uuid();
    setMyPeerID(newUniqueId);

    setUsername(user_name!)

    if (newUniqueId && username){

      const newPeer = new Peer(newUniqueId,{
        config: {
          'iceServers': [{ url: 'stun:stun.l.google.com:19302' }]
        }
      });

      setPeer(newPeer)

      newPeer.on('error', (error) => {
        console.log("peer connection error : ", error);
      });
    }

  }, []); 

  useEffect(() => {
    if (myPeerID) {
      
      const newSocket = new WebSocket(`wss://testninja.info/createConference/${username}/${myPeerID}`);
      setSocket(newSocket);

      // Listen for incoming messages from the WebSocket
      newSocket.onmessage = (event) => {
        console.log(event.data);
        setIncomeSocketMsg(event.data.toString('utf-8'));
      };

      newSocket.onerror = (error) =>{
        console.error(error);
      }

      // Cleanup function to close the WebSocket connection
      return () => {
        newSocket.close();
      };
    }
  }, [myPeerID]); 

  useEffect(() => {

    if(incomeSocketMsg){
      const message = JSON.parse(incomeSocketMsg)
      if(message.status == true){
        console.log("set remote peer id : ", message.peer_id)
        setRemotePeerId(message.peer_id)

        if(message.requested == true){
          setIsAnswer(true);
          setIsCall(false);
        }
        if (message.requested == false){
          setIsCall(true);
          setIsAnswer(false);
        }
      }
    }
  },[incomeSocketMsg])

  

  return (
    <div>
      <h1>WebSocket Peer Connection</h1>
      <p>My Peer ID: {myPeerID}</p>
      <p>Incoming Message: {incomeSocketMsg}</p>

      <button onClick={sendFindUserMessage}>find user</button>
      <button onClick={disconnect}>disconnect</button>
      {isCall && (
        <div>
          <button onClick={userCall}>call</button>
        </div>
      )}

      {isAnswer && (
        <div>
          <button onClick={userAnswer}>answer</button>
        </div>
      )}

      <video ref={localVideoRef}  height="200px" width="200px" muted autoPlay playsInline></video> <br/>
      <video ref={remoteVideoRef} height="200px" width="200px" autoPlay playsInline></video>
      
    </div>
  );
}

export default PeerConnection;

